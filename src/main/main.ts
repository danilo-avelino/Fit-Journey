import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, screen, session, Tray } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent, Input } from 'electron';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { ConfigStore } from './config-store';
import { PanelManager } from './panel-manager';
import { chromiumUserAgent } from './browser-identity';
import { validateWorkspace } from '../shared/workspace';
import type { AppConfig, AppState, Mode, PanelStatus, Workspace } from '../shared/types';

app.setName('Mosaico');
if (!app.isPackaged) {
  app.setPath('userData', resolve(process.env.MOSAICO_USER_DATA || join(app.getAppPath(), '.mosaico-dev')));
} else {
  app.setPath('userData', join(app.getPath('appData'), 'Mosaico'));
}

let window: BrowserWindow | null = null;
let panels: PanelManager | null = null;
let tray: Tray | null = null;
let store: ConfigStore;
let config: AppConfig;
let warning: string | null = null;
let mode: Mode = 'edit';
let isQuitting = false;
let rendererReady = false;
let trustedRendererURL = '';
let fileDialogOpen = false;

const supportsLogin = process.platform === 'win32' && app.isPackaged && !process.env.PORTABLE_EXECUTABLE_DIR;
const loginSettings = () => ({ path: process.execPath, args: ['--autostart'] });

function getState(): AppState {
  const primary = screen.getPrimaryDisplay().id;
  return {
    config: structuredClone(config), mode,
    statuses: panels?.getStatuses() ?? [],
    displays: screen.getAllDisplays().map((display, index) => ({
      id: display.id,
      label: display.label || `Monitor ${index + 1}`,
      width: display.size.width, height: display.size.height, primary: display.id === primary,
    })),
    platform: process.platform, version: app.getVersion(), launchAtLoginSupported: Boolean(supportsLogin), warning,
  };
}

function publishState(): void {
  if (rendererReady && window && !window.isDestroyed()) window.webContents.send('mosaico:state', getState());
  refreshTray();
}

function publishPanel(status: PanelStatus): void {
  if (rendererReady && window && !window.isDestroyed()) window.webContents.send('mosaico:panel-status', status);
}

function save(next: AppConfig): void {
  // Persist first, so failed disk writes never report success to the editor.
  store.save(next);
  config = next;
}

function setMode(next: Mode): AppState {
  if (next !== 'edit' && next !== 'present') throw new Error('Modo inválido.');
  if (next === 'present' && !config.panels.length) throw new Error('Adicione uma página antes de exibir o painel.');
  mode = next;
  // Wait for fresh renderer measurements before exposing native views over the editor.
  panels?.setBounds({ panels: [], hidden: true });
  if (mode === 'edit') window?.webContents.focus();
  publishState();
  return getState();
}

function showEditor(): void {
  if (!window || window.isDestroyed()) return;
  window.restore();
  window.show();
  window.setFullScreen(true);
  window.focus();
  setMode('edit');
}

function handleShortcut(input: Input, event: Electron.Event): void {
  if (input.type !== 'keyDown') return;
  const key = input.key.toLowerCase();
  if ((input.control || input.meta) && input.shift && key === 'e') {
    event.preventDefault();
    showEditor();
  } else if (key === 'escape' && mode === 'present') {
    event.preventDefault();
    showEditor();
  } else if (key === 'f11' && config.panels.length) {
    event.preventDefault();
    setMode(mode === 'edit' ? 'present' : 'edit');
  }
}

function refreshTray(): void {
  if (!tray || tray.isDestroyed() || !config) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mosaico', enabled: false },
    { type: 'separator' },
    { label: 'Editar layout', click: showEditor },
    { label: 'Exibir em tela cheia', enabled: config.panels.length > 0, click: () => { window?.show(); window?.focus(); setMode('present'); } },
    { type: 'separator' },
    { label: 'Sair do Mosaico', click: () => app.quit() },
  ]));
}

function applyDisplay(): void {
  if (!window || window.isDestroyed()) return;
  const display = screen.getAllDisplays().find(item => item.id === config.targetDisplayId) ?? screen.getPrimaryDisplay();
  // Windows moves a fullscreen window reliably when its fullscreen state is reset.
  window.setFullScreen(false);
  window.setBounds(display.bounds);
  window.setFullScreen(true);
}

function assertTrusted(event: IpcMainInvokeEvent | IpcMainEvent): void {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame
      || event.senderFrame?.url !== trustedRendererURL) {
    throw new Error('Origem não autorizada.');
  }
}

function installIPC(): void {
  const handle = (channel: string, fn: (payload: any) => unknown) => {
    ipcMain.handle(channel, (event, payload) => { assertTrusted(event); return fn(payload); });
  };

  handle('mosaico:get-state', () => getState());
  handle('mosaico:save-workspace', (input: unknown) => {
    const workspace = validateWorkspace(input);
    save({ ...config, ...workspace });
    panels?.reconcile(config.panels);
    if (!config.panels.length) mode = 'edit';
    publishState();
    return getState();
  });
  handle('mosaico:set-mode', value => setMode(value));
  handle('mosaico:set-login', (enabled: unknown) => {
    if (typeof enabled !== 'boolean') throw new Error('Preferência inválida.');
    if (!supportsLogin) throw new Error('Instale o Mosaico no Windows para usar a inicialização automática.');
    const previous = config.launchAtLogin;
    app.setLoginItemSettings({ ...loginSettings(), openAtLogin: enabled, enabled });
    const actual = app.getLoginItemSettings(loginSettings()).openAtLogin;
    if (actual !== enabled) throw new Error('O Windows não permitiu alterar a inicialização automática. Verifique Configurações → Aplicativos → Inicialização.');
    try {
      save({ ...config, launchAtLogin: actual });
    } catch (error) {
      app.setLoginItemSettings({ ...loginSettings(), openAtLogin: previous, enabled: previous });
      throw error;
    }
    publishState();
    return getState();
  });
  handle('mosaico:set-display', (id: unknown) => {
    if (typeof id !== 'number' || !screen.getAllDisplays().some(display => display.id === id)) throw new Error('Monitor indisponível.');
    save({ ...config, targetDisplayId: id });
    applyDisplay();
    publishState();
    return getState();
  });
  handle('mosaico:navigate', (payload: unknown) => {
    const request = payload as { id?: unknown; action?: unknown } | null;
    if (!request || typeof request.id !== 'string' || !['back', 'forward', 'reload', 'stop'].includes(String(request.action))) {
      throw new Error('Ação de navegação inválida.');
    }
    panels?.navigate(request.id, request.action as 'back' | 'forward' | 'reload' | 'stop');
  });
  ipcMain.on('mosaico:bounds', (event, payload) => {
    try { assertTrusted(event); panels?.setBounds(payload); } catch { /* Ignore invalid asynchronous geometry messages. */ }
  });
  handle('mosaico:quit', () => { setImmediate(() => app.quit()); });
  handle('mosaico:import', async () => {
    if (!window || fileDialogOpen) return { cancelled: true };
    fileDialogOpen = true;
    panels?.setSuspended(true);
    try {
      const result = await dialog.showOpenDialog(window, {
        title: 'Importar layout do Mosaico', filters: [{ name: 'Layout JSON', extensions: ['json'] }], properties: ['openFile'],
      });
      if (result.canceled || !result.filePaths[0]) return { cancelled: true };
      if ((await stat(result.filePaths[0])).size > 2 * 1024 * 1024) throw new Error('O arquivo de layout deve ter até 2 MB.');
      const imported = JSON.parse(await readFile(result.filePaths[0], 'utf8'));
      if (imported.version !== 1) throw new Error('Versão de layout incompatível.');
      const workspace: Workspace = validateWorkspace(imported);
      save({ ...config, ...workspace });
      mode = 'edit';
      panels?.reconcile(config.panels);
      panels?.setBounds({ panels: [], hidden: true });
      publishState();
      return { cancelled: false };
    } catch (error) {
      return { cancelled: false, error: error instanceof Error ? error.message : 'Não foi possível importar o layout.' };
    } finally { fileDialogOpen = false; panels?.setSuspended(false); }
  });
  handle('mosaico:export', async () => {
    if (!window || fileDialogOpen) return { cancelled: true };
    fileDialogOpen = true;
    panels?.setSuspended(true);
    try {
      const result = await dialog.showSaveDialog(window, {
        title: 'Exportar layout do Mosaico', defaultPath: 'mosaico-layout.json', filters: [{ name: 'Layout JSON', extensions: ['json'] }],
      });
      if (result.canceled || !result.filePath) return { cancelled: true };
      const exported = { version: 1, panels: config.panels, layout: config.layout };
      await writeFile(result.filePath, JSON.stringify(exported, null, 2) + '\n', { mode: 0o600 });
      return { cancelled: false };
    } catch (error) {
      return { cancelled: false, error: error instanceof Error ? error.message : 'Não foi possível exportar o layout.' };
    } finally { fileDialogOpen = false; panels?.setSuspended(false); }
  });
}

async function createWindow(): Promise<void> {
  store = new ConfigStore(app.getPath('userData'));
  const loaded = store.load();
  config = loaded.config;
  warning = loaded.warning;
  if (supportsLogin) {
    if (loaded.firstRun) app.setLoginItemSettings({ ...loginSettings(), openAtLogin: config.launchAtLogin, enabled: config.launchAtLogin });
    // Respect an explicit opt-out through Windows startup settings on later launches.
    config.launchAtLogin = app.getLoginItemSettings(loginSettings()).openAtLogin;
  }
  store.save(config);
  mode = config.panels.length ? 'present' : 'edit';
  const display = screen.getAllDisplays().find(item => item.id === config.targetDisplayId) ?? screen.getPrimaryDisplay();
  window = new BrowserWindow({
    ...display.bounds, minWidth: 800, minHeight: 540, show: false,
    fullscreen: true, frame: false, autoHideMenuBar: true,
    title: 'Mosaico', backgroundColor: '#f5f6f4',
    icon: join(app.getAppPath(), 'build', 'icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
    },
  });
  window.setMenu(null);
  window.webContents.on('before-input-event', (event, input) => handleShortcut(input, event));
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-redirect', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  const pageSession = session.fromPartition('persist:mosaico-pages');
  // Configure the persistent session before any page, redirect, worker or popup
  // starts. Do not clear cookies: existing logins must survive this update.
  pageSession.setUserAgent(chromiumUserAgent(pageSession.getUserAgent()));
  pageSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  pageSession.setPermissionCheckHandler(() => false);
  // HTTP(S) content cannot initiate an executable download silently.
  pageSession.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ title: 'Salvar arquivo da página', defaultPath: join(app.getPath('downloads'), item.getFilename()) });
  });
  panels = new PanelManager(window, publishPanel, handleShortcut);
  panels.reconcile(config.panels);
  installIPC();

  const icon = nativeImage.createFromPath(join(app.getAppPath(), 'build', 'icon.png')).resize({ width: 24, height: 24 });
  if (!icon.isEmpty()) {
    tray = new Tray(icon);
    tray.setToolTip('Mosaico — Ctrl+Shift+E para editar');
    tray.on('double-click', showEditor);
    refreshTray();
  }

  window.on('closed', () => {
    rendererReady = false;
    panels?.destroy();
    panels = null;
    window = null;
    tray?.destroy();
    tray = null;
  });
  window.on('ready-to-show', () => { window?.show(); window?.setFullScreen(true); });
  window.webContents.on('did-finish-load', () => { rendererReady = true; publishState(); });
  window.webContents.on('render-process-gone', () => {
    panels?.setBounds({ panels: [], hidden: true });
    rendererReady = false;
    if (!isQuitting && window && !window.isDestroyed()) window.webContents.reload();
  });

  const devURL = !app.isPackaged ? process.env.MOSAICO_DEV_URL : undefined;
  if (devURL) {
    const parsed = new URL(devURL);
    if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1') throw new Error('O servidor de desenvolvimento deve ser local.');
    trustedRendererURL = parsed.href;
    await window.loadURL(trustedRendererURL);
  } else {
    trustedRendererURL = pathToFileURL(join(app.getAppPath(), 'dist', 'index.html')).href;
    await window.loadURL(trustedRendererURL);
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { window?.restore(); window?.show(); window?.focus(); });
  app.on('before-quit', () => {
    isQuitting = true;
    panels?.destroy();
    panels = null;
    tray?.destroy();
    tray = null;
  });
  app.on('window-all-closed', () => app.quit());
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    await createWindow();
    screen.on('display-removed', () => { applyDisplay(); publishState(); });
    screen.on('display-added', publishState);
    screen.on('display-metrics-changed', () => { applyDisplay(); publishState(); });
  }).catch(error => {
    dialog.showErrorBox('Não foi possível iniciar o Mosaico', error instanceof Error ? error.message : 'Erro inesperado.');
    app.exit(1);
  });
}
