import { BrowserWindow, WebContentsView } from 'electron';
import type { Event, Input, WebContents, WebPreferences } from 'electron';
import type { Panel, PanelBounds, PanelStatus } from '../shared/types';
import { normalizeUrl } from '../shared/workspace';

const PAGE_PREFERENCES: WebPreferences = {
  partition: 'persist:mosaico-pages',
  nodeIntegration: false,
  nodeIntegrationInSubFrames: false,
  nodeIntegrationInWorker: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  backgroundThrottling: false,
  webviewTag: false,
};

interface ManagedPanel {
  panel: Panel;
  view: WebContentsView;
  status: PanelStatus;
  timer?: ReturnType<typeof setInterval>;
  retry?: ReturnType<typeof setTimeout>;
  retryCount: number;
  loadSequence: number;
}

/** Real Chromium pages live in sandboxed native views, never in the trusted UI. */
export class PanelManager {
  private readonly panels = new Map<string, ManagedPanel>();
  private readonly bounds = new Map<string, PanelBounds>();
  private readonly popups = new Map<BrowserWindow, string>();
  private hidden = false;
  private suspended = false;
  private disposed = false;

  constructor(
    private readonly window: BrowserWindow,
    private readonly onStatus: (status: PanelStatus) => void,
    private readonly onShortcut: (input: Input, event: Event) => void,
  ) {}

  reconcile(panels: Panel[]): void {
    if (this.disposed) return;
    const wanted = new Set(panels.map(panel => panel.id));
    for (const [id, managed] of this.panels) {
      if (!wanted.has(id)) this.remove(managed);
    }
    for (const panel of panels) {
      let managed = this.panels.get(panel.id);
      if (!managed) {
        managed = this.create(panel);
        this.panels.set(panel.id, managed);
        this.window.contentView.addChildView(managed.view);
        this.load(managed, panel.url);
      } else {
        const old = managed.panel;
        managed.panel = { ...panel };
        if (old.url !== panel.url) {
          managed.retryCount = 0;
          this.load(managed, panel.url);
        }
        if (old.zoomFactor !== panel.zoomFactor) managed.view.webContents.setZoomFactor(panel.zoomFactor);
      }
      if (managed.timer) clearInterval(managed.timer);
      managed.timer = undefined;
      if (panel.reloadIntervalSec > 0) {
        managed.timer = setInterval(() => {
          if (this.alive(managed) && !managed.status.loading) this.reload(managed);
        }, panel.reloadIntervalSec * 1000);
        managed.timer.unref();
      }
      this.applyVisibility(managed);
    }
  }

  setBounds(payload: { panels: PanelBounds[]; hidden: boolean }): void {
    if (this.disposed) return;
    // The trusted renderer supplies CSS pixels; Electron view bounds use the same
    // device-independent pixels, including on Windows monitors with DPI scaling.
    this.hidden = payload?.hidden === true;
    this.bounds.clear();
    if (Array.isArray(payload?.panels)) {
      const content = this.window.getContentBounds();
      for (const entry of payload.panels) {
        if (!entry || !this.panels.has(entry.panelId)) continue;
        const values = [entry.x, entry.y, entry.width, entry.height];
        if (!values.every(value => typeof value === 'number' && Number.isFinite(value))) continue;
        if (entry.width <= 0 || entry.height <= 0) continue;
        const x = Math.max(0, Math.min(content.width, Math.round(entry.x)));
        const y = Math.max(0, Math.min(content.height, Math.round(entry.y)));
        const right = Math.max(x, Math.min(content.width, Math.round(entry.x + entry.width)));
        const bottom = Math.max(y, Math.min(content.height, Math.round(entry.y + entry.height)));
        if (right <= x || bottom <= y) continue;
        const checked = { panelId: entry.panelId, x, y, width: right - x, height: bottom - y };
        this.bounds.set(entry.panelId, checked);
        this.panels.get(entry.panelId)!.view.setBounds({ x, y, width: checked.width, height: checked.height });
      }
    }
    for (const managed of this.panels.values()) this.applyVisibility(managed);
  }

  setSuspended(hidden: boolean): void {
    this.suspended = hidden;
    for (const managed of this.panels.values()) this.applyVisibility(managed);
  }

  getStatuses(): PanelStatus[] {
    return [...this.panels.values()].map(managed => ({ ...managed.status }));
  }

  navigate(id: string, action: 'back' | 'forward' | 'reload' | 'stop'): void {
    const managed = this.panels.get(id);
    if (!managed || !this.alive(managed)) throw new Error('A página não está disponível.');
    const contents = managed.view.webContents;
    switch (action) {
      case 'back':
        if (contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
        break;
      case 'forward':
        if (contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
        break;
      case 'reload':
        managed.retryCount = 0;
        this.reload(managed);
        break;
      case 'stop':
        contents.stop();
        if (managed.retry) clearTimeout(managed.retry);
        managed.retry = undefined;
        managed.status.loading = false;
        this.publish(managed);
        break;
      default:
        throw new Error('Ação de navegação inválida.');
    }
  }

  destroy(): void {
    this.disposed = true;
    for (const managed of [...this.panels.values()]) this.remove(managed);
    for (const popup of this.popups.keys()) if (!popup.isDestroyed()) popup.destroy();
    this.popups.clear();
  }

  private create(panel: Panel): ManagedPanel {
    const view = new WebContentsView({ webPreferences: { ...PAGE_PREFERENCES } });
    view.setBackgroundColor('#ffffff');
    view.setVisible(false);
    const contents = view.webContents;
    contents.setZoomMode('isolated');
    contents.setZoomFactor(panel.zoomFactor);
    const managed: ManagedPanel = {
      panel: { ...panel }, view, retryCount: 0, loadSequence: 0,
      status: { panelId: panel.id, url: panel.url, title: panel.title, loading: true, error: null, canGoBack: false, canGoForward: false },
    };
    this.guard(contents);
    contents.on('before-input-event', (event, input) => this.onShortcut(input, event));
    contents.on('did-start-loading', () => {
      if (!this.alive(managed)) return;
      managed.status.loading = true;
      managed.status.error = null;
      if (managed.retry) clearTimeout(managed.retry);
      managed.retry = undefined;
      this.publish(managed);
      this.applyVisibility(managed);
    });
    contents.on('did-stop-loading', () => {
      if (!this.alive(managed)) return;
      managed.status.loading = false;
      this.publish(managed);
    });
    contents.on('did-finish-load', () => {
      if (!this.alive(managed)) return;
      managed.status.loading = false;
      managed.status.error = null;
      managed.retryCount = 0;
      contents.setZoomFactor(managed.panel.zoomFactor);
      this.publish(managed);
      this.applyVisibility(managed);
    });
    contents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
      if (isMainFrame && code !== -3) this.failed(managed, code);
    });
    contents.on('did-navigate', () => this.publish(managed));
    contents.on('did-navigate-in-page', (_event, _url, isMainFrame) => {
      if (isMainFrame) this.publish(managed);
    });
    contents.on('page-title-updated', () => this.publish(managed));
    contents.on('render-process-gone', () => this.failed(managed, -1));
    contents.setWindowOpenHandler(details => {
      // Preserve window.opener for ordinary sign-in flows. Popups never inherit
      // a preload or Node privileges and are closed with their owning panel.
      if (!this.allowed(details.url, true) || this.popups.size >= 8) return { action: 'deny' };
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          parent: this.window, width: 1000, height: 720, minWidth: 400, minHeight: 300,
          autoHideMenuBar: true, title: 'Mosaico — página',
          webPreferences: { ...PAGE_PREFERENCES },
        },
      };
    });
    contents.on('did-create-window', popup => {
      this.popups.set(popup, panel.id);
      popup.setMenu(null);
      this.guard(popup.webContents, true);
      popup.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      popup.webContents.on('before-input-event', (event, input) => this.onShortcut(input, event));
      popup.on('closed', () => this.popups.delete(popup));
    });
    return managed;
  }

  private allowed(url: string, allowBlank = false): boolean {
    if (allowBlank && url === 'about:blank') return true;
    if (!/^https?:\/\//i.test(url)) return false;
    try { normalizeUrl(url); return true; } catch { return false; }
  }

  private guard(contents: WebContents, allowBlank = false): void {
    contents.on('will-navigate', event => {
      if (!this.allowed(event.url, allowBlank)) event.preventDefault();
    });
    contents.on('will-redirect', event => {
      if (event.isMainFrame && !this.allowed(event.url, allowBlank)) event.preventDefault();
    });
    // Pages cannot mount a privileged webview or take over the whole monitor.
    contents.on('will-attach-webview', event => event.preventDefault());
    contents.on('enter-html-full-screen', () => {
      if (!contents.isDestroyed()) contents.executeJavaScript('document.exitFullscreen().catch(() => {})').catch(() => {});
    });
  }

  private alive(managed: ManagedPanel): boolean {
    return !this.disposed && !managed.view.webContents.isDestroyed();
  }

  private publish(managed: ManagedPanel): void {
    if (!this.alive(managed)) return;
    const contents = managed.view.webContents;
    managed.status.url = contents.getURL() || managed.panel.url;
    managed.status.title = contents.getTitle() || managed.panel.title;
    managed.status.canGoBack = contents.navigationHistory.canGoBack();
    managed.status.canGoForward = contents.navigationHistory.canGoForward();
    this.onStatus({ ...managed.status });
  }

  private applyVisibility(managed: ManagedPanel): void {
    if (!this.alive(managed)) return;
    managed.view.setVisible(!this.hidden && !this.suspended && !managed.status.error && this.bounds.has(managed.panel.id));
  }

  private load(managed: ManagedPanel, url: string): void {
    if (!this.alive(managed)) return;
    const sequence = ++managed.loadSequence;
    managed.status.error = null;
    managed.status.loading = true;
    if (managed.retry) clearTimeout(managed.retry);
    managed.retry = undefined;
    void managed.view.webContents.loadURL(normalizeUrl(url)).catch((error: unknown) => {
      if (!this.alive(managed) || managed.loadSequence !== sequence) return;
      const code = typeof error === 'object' && error !== null && 'errno' in error ? Number(error.errno) : -1;
      if (code !== -3 && !managed.status.error) this.failed(managed, code);
    });
  }

  private reload(managed: ManagedPanel): void {
    if (!this.alive(managed)) return;
    const url = managed.view.webContents.getURL();
    if (managed.status.error || !this.allowed(url)) this.load(managed, managed.panel.url);
    else managed.view.webContents.reload();
  }

  private failed(managed: ManagedPanel, code: number): void {
    if (!this.alive(managed)) return;
    managed.status.loading = false;
    managed.status.error = code === -1
      ? 'Esta página foi interrompida. Tente carregá-la novamente.'
      : `Não foi possível carregar esta página (erro ${code}). Verifique o endereço e a conexão.`;
    this.publish(managed);
    this.applyVisibility(managed);
    // Windows may start this app before Wi-Fi is ready. Retry a bounded number
    // of times, without a tight loop or disturbing a healthy interactive page.
    if (!managed.retry && managed.retryCount < 5) {
      managed.retry = setTimeout(() => {
        managed.retry = undefined;
        managed.retryCount += 1;
        this.reload(managed);
      }, 30_000);
      managed.retry.unref();
    }
  }

  private remove(managed: ManagedPanel): void {
    if (managed.timer) clearInterval(managed.timer);
    if (managed.retry) clearTimeout(managed.retry);
    this.panels.delete(managed.panel.id);
    this.bounds.delete(managed.panel.id);
    for (const [popup, owner] of this.popups) {
      if (owner === managed.panel.id && !popup.isDestroyed()) popup.destroy();
    }
    if (!this.window.isDestroyed()) this.window.contentView.removeChildView(managed.view);
    if (!managed.view.webContents.isDestroyed()) managed.view.webContents.close({ waitForBeforeUnload: false });
  }
}
