import { _electron as electron, expect, test, type ElectronApplication, type Page, type TestInfo } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AppConfig, Workspace } from '../src/shared/types';

let server: Server;
let origin: string;
const applications = new Set<ElectronApplication>();
const directories: string[] = [];

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (path === '/broken') {
      request.socket.destroy();
      return;
    }
    if (path === '/identity') {
      response.end(JSON.stringify({ userAgent: request.headers['user-agent'] }));
      return;
    }
    const title = path === '/two' ? 'Página dois' : path === '/next' ? 'Próxima página' : 'Página um';
    response.end(`<!doctype html><html lang="pt-BR"><head><title>${title}</title></head>
      <body style="font:20px sans-serif;background:#eef7f5;padding:24px">
        <h1>${title}</h1>
        <p id="counter">0</p><button id="increment">Incrementar</button>
        <a id="next" href="/next">Navegar</a>
        <a id="popup" href="/two" target="_blank">Nova janela</a>
        <label>Nota<input id="note" value=""></label>
        <script>
          let count=0;
          document.querySelector('#increment').onclick=()=>document.querySelector('#counter').textContent=String(++count);
          document.querySelector('#note').value=localStorage.getItem('note')||'';
          document.querySelector('#note').oninput=event=>localStorage.setItem('note',event.target.value);
        </script>
      </body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Servidor de teste sem porta TCP.');
  origin = `http://127.0.0.1:${address.port}`;
});

test.afterEach(async () => {
  for (const app of applications) await close(app);
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true });
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function profile(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'mosaico-e2e-'));
  directories.push(directory);
  return directory;
}

async function launch(directory: string): Promise<{ app: ElectronApplication; page: Page }> {
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.MOSAICO_DEV_URL;
  const app = await electron.launch({
    args: [...(process.env.MOSAICO_TEST_NO_SANDBOX === '1' ? ['--no-sandbox'] : []), '.'],
    cwd: process.cwd(),
    env: { ...env, MOSAICO_USER_DATA: directory },
    timeout: 30_000,
  });
  applications.add(app);
  await expect.poll(() => app.windows().some(candidate => candidate.url().startsWith("file:"))).toBe(true);
  const page = app.windows().find(candidate => candidate.url().startsWith("file:"))!;
  await page.waitForFunction(() => Boolean(window.mosaico));
  await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
  return { app, page };
}

async function close(app: ElectronApplication): Promise<void> {
  applications.delete(app);
  await app.close();
}

function workspace(): Workspace {
  return {
    panels: [
      { id: 'first', title: 'Primeiro painel', url: `${origin}/one`, zoomFactor: 1, reloadIntervalSec: 0 },
      { id: 'second', title: 'Segundo painel', url: `${origin}/two`, zoomFactor: 1, reloadIntervalSec: 0 },
    ],
    layout: {
      type: 'split', id: 'split-main', direction: 'row', ratio: 0.5,
      first: { type: 'leaf', panelId: 'first' }, second: { type: 'leaf', panelId: 'second' },
    },
  };
}

async function setWorkspace(page: Page, value = workspace()): Promise<void> {
  await page.evaluate(value => window.mosaico.saveWorkspace(value), value);
  await expect.poll(async () => (await page.evaluate(() => window.mosaico.getState())).statuses.filter(status => !status.loading && !status.error).length).toBe(value.panels.length);
}

async function nativeViews(app: ElectronApplication) {
  return app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    return window.contentView.children.flatMap(child => {
      if (!('webContents' in child)) return [];
      const view = child as Electron.WebContentsView;
      if (view.webContents.id === window.webContents.id) return [];
      return [{ id: view.webContents.id, url: view.webContents.getURL(), bounds: view.getBounds(), visible: view.getVisible() }];
    });
  });
}

async function nativeScript<T>(app: ElectronApplication, path: string, script: string): Promise<T> {
  return app.evaluate(async ({ BrowserWindow }, args) => {
    const window = BrowserWindow.getAllWindows()[0];
    const view = window.contentView.children.find(child => 'webContents' in child && (child as Electron.WebContentsView).webContents.getURL().endsWith(args.path)) as Electron.WebContentsView | undefined;
    if (!view) throw new Error(`Página nativa não encontrada: ${args.path}`);
    return view.webContents.executeJavaScript(args.script, true);
  }, { path, script });
}

async function screenshot(app: ElectronApplication, info: TestInfo, name: string) {
  const base64 = await app.evaluate(async ({ desktopCapturer, screen }) => {
    const size = screen.getPrimaryDisplay().size;
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: size });
    return sources[0].thumbnail.toPNG().toString('base64');
  });
  const path = info.outputPath(`${name}.png`);
  await writeFile(path, Buffer.from(base64, 'base64'));
  await info.attach(name, { path, contentType: 'image/png' });
}

test('abre em tela cheia com editor vazio e preferências seguras', async () => {
  const { app, page } = await launch(await profile());
  const state = await page.evaluate(() => window.mosaico.getState());
  expect(state.mode).toBe('edit');
  expect(state.config.panels).toEqual([]);
  expect(state.config.layout).toBeNull();
  expect(state.launchAtLoginSupported).toBe(false); // Tests run an unpackaged application.
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
  expect(await nativeViews(app)).toHaveLength(0);
});

test('exibe duas páginas reais, redimensiona a divisão e apresenta sem controles', async ({}, info) => {
  const { app, page } = await launch(await profile());
  await setWorkspace(page);
  await expect.poll(async () => (await nativeViews(app)).filter(view => view.visible && view.bounds.width > 20).length).toBe(2);
  expect(await nativeScript<string>(app, '/one', 'document.querySelector("h1").textContent')).toBe('Página um');
  expect(await nativeScript<string>(app, '/two', 'document.querySelector("h1").textContent')).toBe('Página dois');
  const split = page.getByRole('separator').first();
  const box = await split.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(page.locator(".app-shell")).toHaveClass(/is-resizing/);
  await expect.poll(async () => (await nativeViews(app)).filter(view => view.visible).length).toBe(0);
  await page.mouse.move(box!.x + 100, box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const layout = (await page.evaluate(() => window.mosaico.getState())).config.layout;
    return layout?.type === 'split' ? layout.ratio : 0;
  }).toBeGreaterThan(0.52);
  await expect(page.locator('.app-shell')).not.toHaveClass(/is-resizing/);
  await expect.poll(async () => (await nativeViews(app)).filter(view => view.visible).length).toBe(2);
  await screenshot(app, info, 'editor-com-paginas');
  await page.evaluate(() => window.mosaico.setMode('present'));
  await expect.poll(async () => (await page.evaluate(() => window.mosaico.getState())).mode).toBe('present');
  await expect(page.getByRole('separator')).toHaveCount(0);
  const content = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentBounds());
  await expect.poll(async () => Math.max(...(await nativeViews(app)).map(view => view.bounds.height))).toBeGreaterThan(content.height - 50);
  await expect.poll(async () => (await nativeViews(app)).filter(view => view.visible).length).toBe(2);
  await screenshot(app, info, 'apresentacao-com-paginas');
  await app.evaluate(({ BrowserWindow }) => {
    const view = BrowserWindow.getAllWindows()[0].contentView.children.find(child => 'webContents' in child) as Electron.WebContentsView;
    view.webContents.focus();
    view.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'E', modifiers: ['control', 'shift'] });
    view.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'E', modifiers: ['control', 'shift'] });
  });
  await expect.poll(async () => (await page.evaluate(() => window.mosaico.getState())).mode).toBe('edit');
});

test('permite interação e navegação mantendo páginas isoladas da API e do Node', async () => {
  const { app, page } = await launch(await profile());
  await setWorkspace(page);
  expect(await nativeScript(app, '/one', '({node:typeof require, api:typeof window.mosaico, process:typeof process})')).toEqual({ node: 'undefined', api: 'undefined', process: 'undefined' });
  await nativeScript(app, '/one', 'document.querySelector("#increment").click()');
  expect(await nativeScript(app, '/one', 'document.querySelector("#counter").textContent')).toBe('1');
  await nativeScript(app, '/one', 'document.querySelector("#next").click()');
  await expect.poll(async () => (await nativeViews(app)).some(view => view.url.endsWith('/next'))).toBe(true);
  await page.evaluate(() => window.mosaico.navigatePanel({ id: 'first', action: 'back' }));
  await expect.poll(async () => (await nativeViews(app)).some(view => view.url.endsWith('/one'))).toBe(true);
  await page.evaluate(() => window.mosaico.navigatePanel({ id: 'first', action: 'reload' }));
  await expect.poll(() => nativeScript(app, '/one', 'document.querySelector("#counter")?.textContent')).toBe('0');
});

test('restaura layout, zoom e sessão ao reiniciar em modo de exibição', async () => {
  const directory = await profile();
  let running = await launch(directory);
  const value = workspace();
  value.panels[0].zoomFactor = 1.25;
  if (value.layout?.type === 'split') value.layout.ratio = 0.63;
  await setWorkspace(running.page, value);
  await running.page.getByRole('button', { name: 'Configurações', exact: true }).click();
  const displayId = (await running.page.evaluate(() => window.mosaico.getState())).displays[0].id;
  await running.page.locator('#display-select').selectOption(String(displayId));
  await expect.poll(async () => (await running.page.evaluate(() => window.mosaico.getState())).config.targetDisplayId).toBe(displayId);
  await running.page.getByRole('button', { name: 'Fechar janela' }).click();
  await nativeScript(running.app, '/one', 'localStorage.setItem("note","Sessão preservada"); document.cookie="mosaico_session=ok;max-age=3600;path=/"');
  await close(running.app);
  const persisted = JSON.parse(await readFile(join(directory, 'workspace.json'), 'utf8')) as AppConfig;
  expect(persisted.panels).toEqual(value.panels);
  expect(persisted.layout).toEqual(value.layout);
  expect(persisted.targetDisplayId).toBe(displayId);
  running = await launch(directory);
  await expect.poll(async () => (await nativeViews(running.app)).filter(view => view.url.startsWith(origin)).length).toBe(2);
  expect((await running.page.evaluate(() => window.mosaico.getState())).mode).toBe('present');
  expect((await running.page.evaluate(() => window.mosaico.getState())).config.targetDisplayId).toBe(displayId);
  await expect.poll(() => nativeScript(running.app, '/one', 'document.querySelector("#note")?.value')).toBe('Sessão preservada');
  expect(await nativeScript<string>(running.app, '/one', 'document.cookie')).toContain('mosaico_session=ok');
  expect(await running.app.evaluate(({ BrowserWindow }) => {
    const view = BrowserWindow.getAllWindows()[0].contentView.children.find(child => 'webContents' in child && (child as Electron.WebContentsView).webContents.getURL().endsWith('/one')) as Electron.WebContentsView;
    return view.webContents.getZoomFactor();
  })).toBe(1.25);
});

test('rejeita endereços perigosos e comunica falha de carregamento sem perder o layout', async () => {
  const { app, page } = await launch(await profile());
  const unsafe = workspace();
  unsafe.panels[0].url = 'file:///etc/passwd';
  const error = await page.evaluate(async value => {
    try { await window.mosaico.saveWorkspace(value); return null; }
    catch (error) { return String(error); }
  }, unsafe);
  expect(error).toBeTruthy();
  expect((await page.evaluate(() => window.mosaico.getState())).config.panels).toHaveLength(0);
  const value = workspace();
  value.panels[0].url = `${origin}/broken`;
  await page.evaluate(value => window.mosaico.saveWorkspace(value), value);
  await expect.poll(async () => (await page.evaluate(() => window.mosaico.getState())).statuses.find(status => status.panelId === 'first')?.error).toBeTruthy();
  expect((await page.evaluate(() => window.mosaico.getState())).config.panels).toHaveLength(2);
  value.panels[0].url = `${origin}/one`;
  await setWorkspace(page, value);
  expect(await nativeScript<string>(app, '/one', 'document.querySelector("h1").textContent')).toBe('Página um');
});


test('identifica páginas, requisições e popups como Chromium sem inventar a versão', async () => {
  const { app, page } = await launch(await profile());
  const value = workspace();
  value.panels[0].url = `${origin}/identity`;
  await setWorkspace(page, value);
  const identity = await nativeScript<{userAgent:string; server:string}>(app, '/identity', '({userAgent:navigator.userAgent,server:JSON.parse(document.body.innerText).userAgent})');
  expect(identity.userAgent).not.toMatch(/Electron|Mosaico/i);
  expect(identity.server).toBe(identity.userAgent);
  const chromeVersion = await app.evaluate(() => process.versions.chrome);
  expect(identity.userAgent).toContain(`Chrome/${chromeVersion}`);
  await nativeScript(app, '/two', 'document.querySelector("#popup").click()');
  await expect.poll(() => app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().length)).toBe(2);
  const popupUA = await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().find(win => win.getParentWindow())!.webContents.getUserAgent());
  expect(popupUA).toBe(identity.userAgent);
});
