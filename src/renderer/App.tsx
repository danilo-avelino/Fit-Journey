import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
  type FormEvent, type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp,
  Columns2, Download, Expand, ExternalLink, Globe2, GripVertical,
  Layers3, LoaderCircle, Maximize2, Monitor, MonitorPlay, MousePointer2,
  PanelLeftClose, PanelLeftOpen, Play, Plus, Power, RefreshCw,
  Rows2, Settings2, ShieldCheck, SlidersHorizontal, Trash2, Upload, X,
} from 'lucide-react';
import type {
  AppState, Direction, LayoutNode, Panel, PanelStatus, Workspace,
} from '../shared/types';
import {
  createPanel, normalizeUrl, removeLeaf, splitLeaf, updateRatio,
} from '../shared/workspace';

interface AddDialog {
  direction: Direction;
  targetId: string | null;
}
interface PanelDraft {
  title: string;
  url: string;
  zoom: string;
  refresh: string;
}
const initialDraft: PanelDraft = { title: '', url: '', zoom: '100', refresh: '0' };
const hostName = (url: string) => {
  try { return new URL(url).hostname; } catch { return url; }
};
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir esta ação.';
const shortTitle = (panel: Panel) => panel.title || hostName(panel.url);

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}>
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
    <span>Mosaico<span className="brand-dot">.</span></span>
  </div>;
}

function Modal({ title, eyebrow, children, onClose }: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = ref.current?.querySelector<HTMLElement>('input, button, select, [tabindex="0"]');
    target?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab' || !ref.current) return;
      const focusable = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <button className="icon-button modal-close" aria-label="Fechar janela" onClick={onClose}><X size={18} /></button>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </div>
  </div>;
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>({ panels: [], layout: null });
  const [statuses, setStatuses] = useState<Record<string, PanelStatus>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelDraft, setPanelDraft] = useState<PanelDraft>(initialDraft);
  const [addDialog, setAddDialog] = useState<AddDialog | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [presentationControls, setPresentationControls] = useState(false);
  const viewportRefs = useRef(new Map<string, HTMLDivElement>());
  const workspaceRef = useRef(workspace);
  const canvasRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  workspaceRef.current = workspace;
  const selected = workspace.panels.find(panel => panel.id === selectedId) ?? null;
  const editing = state?.mode !== 'present';
  const modalOpen = !!addDialog || settingsOpen || helpOpen || deleteOpen;
  const hidden = dragging || modalOpen;
  const readyCount = workspace.panels.filter(panel => !statuses[panel.id]?.error).length;

  const notify = useCallback((text: string, error = false) => {
    setMessage({ text, error });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), error ? 9000 : 4000);
  }, []);

  const acceptState = useCallback((next: AppState) => {
    setState(next);
    setWorkspace({ panels: next.config.panels, layout: next.config.layout });
    setStatuses(Object.fromEntries(next.statuses.map(status => [status.panelId, status])));
    setSelectedId(current => next.config.panels.some(panel => panel.id === current) ? current : next.config.panels[0]?.id ?? null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!window.mosaico) {
      setFatalError('Abra o Mosaico pelo aplicativo para Windows. Esta interface precisa do navegador integrado para exibir suas páginas.');
      return;
    }
    window.mosaico.getState().then(next => { if (mounted.current) acceptState(next); }).catch(error => setFatalError(errorText(error)));
    const offState = window.mosaico.onState(next => { if (mounted.current) acceptState(next); });
    const offStatus = window.mosaico.onPanelStatus(status => {
      if (mounted.current) setStatuses(current => ({ ...current, [status.panelId]: status }));
    });
    return () => {
      mounted.current = false;
      offState(); offStatus();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [acceptState]);

  useEffect(() => {
    setPanelDraft(selected ? {
      title: selected.title, url: selected.url,
      zoom: String(Math.round(selected.zoomFactor * 100)),
      refresh: String(selected.reloadIntervalSec),
    } : initialDraft);
  }, [selected?.id, selected?.title, selected?.url, selected?.zoomFactor, selected?.reloadIntervalSec]);

  const measure = useCallback(() => {
    if (!window.mosaico) return;
    const panels = workspaceRef.current.panels.flatMap(panel => {
      const el = viewportRefs.current.get(panel.id);
      if (!el) return [];
      const rect = el.getBoundingClientRect();
      return [{ panelId: panel.id, x: rect.x, y: rect.y, width: rect.width, height: rect.height }];
    });
    window.mosaico.syncBounds({ panels, hidden });
  }, [hidden]);

  useLayoutEffect(() => {
    measure();
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, workspace, editing, sidebarOpen, presentationControls, state]);

  useEffect(() => {
    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    if (canvasRef.current) observer.observe(canvasRef.current);
    for (const el of viewportRefs.current.values()) observer.observe(el);
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [measure, workspace.layout, editing, state !== null]);

  const saveWorkspace = useCallback(async (next: Workspace, success?: string) => {
    setSaving(true);
    try {
      const result = await window.mosaico.saveWorkspace(next);
      acceptState(result);
      if (success) notify(success);
      return true;
    } catch (error) {
      notify(errorText(error), true);
      return false;
    } finally { setSaving(false); }
  }, [acceptState, notify]);

  const closeAdd = useCallback(() => { setAddDialog(null); setDialogError(null); }, []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const openAdd = (direction: Direction = 'row') => {
    setNewUrl(''); setNewTitle(''); setDialogError(null);
    setAddDialog({ direction, targetId: selectedId ?? workspace.panels[0]?.id ?? null });
  };

  const addPage = async (event: FormEvent) => {
    event.preventDefault();
    if (!addDialog) return;
    try {
      const panel = createPanel(normalizeUrl(newUrl.trim()), newTitle.trim());
      const layout: LayoutNode = workspace.layout && addDialog.targetId
        ? splitLeaf(workspace.layout, addDialog.targetId, panel.id, addDialog.direction, crypto.randomUUID())!
        : { type: 'leaf', panelId: panel.id };
      setSaving(true);
      const next = await window.mosaico.saveWorkspace({ panels: [...workspace.panels, panel], layout });
      acceptState(next);
      setSelectedId(panel.id);
      closeAdd();
      notify('Página adicionada. Seu layout foi salvo.');
    } catch (error) { setDialogError(errorText(error)); }
    finally { setSaving(false); }
  };

  const savePanel = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try {
      const url = normalizeUrl(panelDraft.url);
      const zoomFactor = Number(panelDraft.zoom) / 100;
      const reloadIntervalSec = Number(panelDraft.refresh);
      if (!Number.isFinite(zoomFactor) || zoomFactor < .25 || zoomFactor > 3) throw new Error('O zoom deve ficar entre 25% e 300%.');
      if (!Number.isInteger(reloadIntervalSec) || reloadIntervalSec < 0 || (reloadIntervalSec > 0 && reloadIntervalSec < 10)) throw new Error('Use 0 para desativar ou um intervalo a partir de 10 segundos.');
      const panel: Panel = { ...selected, title: panelDraft.title.trim(), url, zoomFactor, reloadIntervalSec };
      await saveWorkspace({ ...workspace, panels: workspace.panels.map(item => item.id === selected.id ? panel : item) }, 'Alterações salvas.');
    } catch (error) { notify(errorText(error), true); }
  };

  const removePage = async () => {
    if (!selected || !workspace.layout) return;
    const next = { panels: workspace.panels.filter(panel => panel.id !== selected.id), layout: removeLeaf(workspace.layout, selected.id) };
    if (await saveWorkspace(next, 'Página removida do layout.')) closeDelete();
  };

  const setMode = async (mode: 'edit' | 'present') => {
    try { acceptState(await window.mosaico.setMode(mode)); }
    catch (error) { notify(errorText(error), true); }
  };

  const navigate = (id: string, action: 'back' | 'forward' | 'reload' | 'stop') => {
    window.mosaico.navigatePanel({ id, action }).catch(error => notify(errorText(error), true));
  };

  const beginResize = (event: ReactPointerEvent<HTMLDivElement>, node: Extract<LayoutNode, { type: 'split' }>) => {
    if (!editing || event.button !== 0 || saving) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const area = handle.parentElement!.getBoundingClientRect();
    const original = workspaceRef.current;
    handle.setPointerCapture(event.pointerId);
    setDragging(true);
    const onMove = (move: PointerEvent) => {
      const size = node.direction === 'row' ? area.width : area.height;
      const position = node.direction === 'row' ? move.clientX - area.left : move.clientY - area.top;
      const min = Math.min(.45, Math.max(.05, 72 / size));
      const ratio = Math.max(min, Math.min(1 - min, position / size));
      const current = workspaceRef.current;
      if (!current.layout) return;
      const next = { ...current, layout: updateRatio(current.layout, node.id, ratio) };
      workspaceRef.current = next;
      setWorkspace(next);
    };
    const finish = async (cancelled = false) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      const next = workspaceRef.current;
      if (cancelled) { workspaceRef.current = original; setWorkspace(original); }
      else if (!(await saveWorkspace(next))) { workspaceRef.current = original; setWorkspace(original); }
      setDragging(false);
    };
    const onUp = () => { void finish(); };
    const onCancel = () => { void finish(true); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onCancel, { once: true });
  };

  const renderLayout = (node: LayoutNode): React.ReactNode => {
    if (node.type === 'split') return <div className={`layout-split split-${node.direction}`} key={node.id}>
      <div className="split-child" style={{ flex: `${node.ratio} 1 0%` }}>{renderLayout(node.first)}</div>
      <div
        className={`split-handle ${editing ? '' : 'presentation-handle'}`}
        role={editing ? 'separator' : undefined}
        aria-label={editing ? 'Redimensionar divisão' : undefined}
        aria-orientation={node.direction === 'row' ? 'vertical' : 'horizontal'}
        aria-valuemin={5} aria-valuemax={95} aria-valuenow={Math.round(node.ratio * 100)}
        tabIndex={editing ? 0 : -1}
        onPointerDown={event => beginResize(event, node)}
        onKeyDown={event => {
          const direction = node.direction === 'row' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
          if (!direction.includes(event.key) || !workspace.layout) return;
          event.preventDefault();
          const delta = event.key === direction[0] ? -.025 : .025;
          void saveWorkspace({ ...workspace, layout: updateRatio(workspace.layout, node.id, Math.max(.05, Math.min(.95, node.ratio + delta))) });
        }}
      ><span /></div>
      <div className="split-child" style={{ flex: `${1 - node.ratio} 1 0%` }}>{renderLayout(node.second)}</div>
    </div>;
    const panel = workspace.panels.find(item => item.id === node.panelId);
    if (!panel) return null;
    const status = statuses[panel.id];
    const index = workspace.panels.findIndex(item => item.id === panel.id);
    return <section key={panel.id} className={`web-panel ${selectedId === panel.id ? 'is-selected' : ''}`} aria-label={`Painel ${index + 1}: ${shortTitle(panel)}`}>
      {editing && <div className="panel-header" onClick={() => setSelectedId(panel.id)}>
        <button className="panel-title" aria-label={`Selecionar ${shortTitle(panel)}`} onClick={() => setSelectedId(panel.id)}>
          <span className="panel-number">{String(index + 1).padStart(2, '0')}</span>
          <span className={`connection-dot ${status?.error ? 'error' : status?.loading ? 'loading' : ''}`} />
          <span>{shortTitle(panel)}</span>
        </button>
        <div className="panel-navigation">
          <button className="icon-button small" aria-label={`Voltar em ${shortTitle(panel)}`} disabled={!status?.canGoBack} onClick={() => navigate(panel.id, 'back')}><ArrowLeft size={14} /></button>
          <button className="icon-button small" aria-label={`Avançar em ${shortTitle(panel)}`} disabled={!status?.canGoForward} onClick={() => navigate(panel.id, 'forward')}><ArrowRight size={14} /></button>
          <button className="icon-button small" aria-label={status?.loading ? `Parar ${shortTitle(panel)}` : `Recarregar ${shortTitle(panel)}`} onClick={() => navigate(panel.id, status?.loading ? 'stop' : 'reload')}>
            {status?.loading ? <X size={14} /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>}
      <div className="panel-viewport" data-panel-id={panel.id} ref={el => { if (el) viewportRefs.current.set(panel.id, el); else viewportRefs.current.delete(panel.id); }}>
        <div className={`panel-placeholder ${status?.error ? 'failed' : ''}`}>
          {status?.error ? <><Globe2 size={28} /><strong>Não foi possível abrir esta página</strong><p>{status.error}</p><button className="button button-secondary" onClick={() => navigate(panel.id, 'reload')}><RefreshCw size={15} />Tentar novamente</button></>
            : <><Globe2 size={30} /><strong>{shortTitle(panel)}</strong><span>{hostName(panel.url)}</span>{status?.loading && !dragging && <LoaderCircle className="spinner" size={18} />}{dragging && <span className="resize-caption">Ajustando o espaço da página</span>}</>}
        </div>
      </div>
    </section>;
  };

  if (fatalError) return <main className="boot-screen"><Brand /><Monitor size={44} /><h1>Seu espaço para a web.</h1><p role="alert">{fatalError}</p><code>npm run dev</code></main>;
  if (!state) return <main className="boot-screen"><Brand /><LoaderCircle className="spinner" size={26} /><p>Preparando seu espaço…</p></main>;

  return <div className={`app-shell ${editing ? 'mode-edit' : 'mode-present'} ${dragging ? 'is-resizing' : ''}`}>
    {editing && <>
      <header className="app-header">
        <Brand />
        <div className="header-divider" />
        <span className="workspace-name">Meu painel <span className="workspace-pill">PESSOAL</span></span>
        <div className="header-actions">
          <span className="autosave"><span className={`save-dot ${saving ? 'saving' : ''}`} />{saving ? 'Salvando…' : 'Salvo neste computador'}</span>
          <button className="icon-button header-icon" aria-label="Ajuda e atalhos" onClick={() => setHelpOpen(true)}><CircleHelp size={19} /></button>
          <button className="icon-button header-icon" aria-label="Configurações" onClick={() => setSettingsOpen(true)}><Settings2 size={19} /></button>
          <button className="button button-primary present-button" onClick={() => setMode('present')} disabled={!workspace.panels.length || saving}><Play size={15} fill="currentColor" />Exibir painel</button>
        </div>
      </header>
      <div className="workspace-toolbar">
        <div className="toolbar-title"><Layers3 size={17} /><strong>Área de trabalho</strong><span className="count-tag">{workspace.panels.length} {workspace.panels.length === 1 ? 'página' : 'páginas'}</span></div>
        <div className="toolbar-actions">
          <button className="button button-secondary compact" onClick={() => openAdd()} disabled={saving}><Plus size={16} />Adicionar página</button>
          <div className="toolbar-rule" />
          <button className="icon-button" aria-label="Dividir lado a lado" title="Dividir lado a lado" disabled={!selected || saving} onClick={() => openAdd('row')}><Columns2 size={18} /></button>
          <button className="icon-button" aria-label="Dividir em cima e embaixo" title="Dividir em cima e embaixo" disabled={!selected || saving} onClick={() => openAdd('column')}><Rows2 size={18} /></button>
          <div className="toolbar-rule" />
          <button className="icon-button" aria-label={sidebarOpen ? 'Ocultar propriedades' : 'Mostrar propriedades'} title={sidebarOpen ? 'Ocultar propriedades' : 'Mostrar propriedades'} onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button>
        </div>
      </div>
    </>}

    <main className="workspace-body">
      <div className="canvas-wrap">
        <div className={`canvas ${workspace.panels.length ? 'has-panels' : ''}`} ref={canvasRef}>
          {workspace.layout ? renderLayout(workspace.layout) : <section className="empty-state">
            <div className="empty-illustration" aria-hidden="true">
              <div className="illustration-frame"><div className="illustration-top"><i /><i /><i /></div><div className="illustration-body"><div className="illustration-block big"><MonitorPlay size={34} strokeWidth={1.2} /></div><div className="illustration-stack"><div className="illustration-block"><span /><span /><span /></div><div className="illustration-block"><i /><i /><i /><i /></div></div></div></div>
              <span className="illustration-plus"><Plus size={19} /></span>
            </div>
            <span className="eyebrow">UM MONITOR. MUITAS POSSIBILIDADES.</span>
            <h1>A web, do seu jeito.</h1>
            <p>Reúna as páginas que importam em uma só tela.<br />Divida, ajuste e deixe tudo à vista.</p>
            <button className="button button-primary large" onClick={() => openAdd()}><Plus size={18} />Adicionar primeira página</button>
            <div className="empty-features"><span><MousePointer2 size={14} />Páginas interativas</span><span><Maximize2 size={14} />Sem barras do navegador</span><span><Check size={14} />Layout salvo automaticamente</span></div>
          </section>}
        </div>
        {editing && <div className="canvas-caption"><span><MousePointer2 size={13} />{workspace.panels.length > 1 ? 'Arraste as divisões para ajustar o espaço de cada página.' : 'Adicione páginas e organize seu monitor como preferir.'}</span><span className="canvas-platform"><Monitor size={13} />{state.displays.find(display => display.id === state.config.targetDisplayId)?.label || 'Monitor principal'}</span></div>}
      </div>

      {editing && sidebarOpen && <aside className="inspector" aria-label="Propriedades do painel">
        <div className="inspector-heading"><SlidersHorizontal size={16} /><h2>{selected ? 'Propriedades da página' : 'Seu próximo painel'}</h2></div>
        {selected ? <>
          <div className="selected-page-intro"><span className="page-icon"><Globe2 size={21} /></span><div><strong>{shortTitle(selected)}</strong><span>{hostName(selected.url)}</span></div></div>
          <form className="panel-form" onSubmit={savePanel}>
            <label className="field-label" htmlFor="panel-title">Nome da página</label>
            <input id="panel-title" value={panelDraft.title} placeholder="Ex.: Indicadores de vendas" maxLength={120} onChange={e => setPanelDraft({ ...panelDraft, title: e.target.value })} />
            <label className="field-label" htmlFor="panel-url">Endereço da página</label>
            <div className="input-with-icon"><Globe2 size={15} /><input id="panel-url" required value={panelDraft.url} placeholder="https://exemplo.com" onChange={e => setPanelDraft({ ...panelDraft, url: e.target.value })} /></div>
            <p className="field-hint">Esta é a página aberta ao iniciar o Mosaico.</p>
            {statuses[selected.id]?.url && statuses[selected.id].url !== selected.url && <p className="current-location">Navegando em: <span title={statuses[selected.id].url}>{statuses[selected.id].url}</span></p>}
            <div className="field-divider" />
            <label className="field-label" htmlFor="panel-zoom">Zoom da página <span>{panelDraft.zoom}%</span></label>
            <input className="zoom-range" id="panel-zoom" type="range" min="25" max="300" step="5" value={panelDraft.zoom} onChange={e => setPanelDraft({ ...panelDraft, zoom: e.target.value })} />
            <div className="range-labels"><span>25%</span><button type="button" onClick={() => setPanelDraft({ ...panelDraft, zoom: '100' })}>Restaurar 100%</button><span>300%</span></div>
            <label className="field-label" htmlFor="panel-refresh">Atualizar automaticamente</label>
            <div className="input-with-unit"><input id="panel-refresh" type="number" min="0" step="1" value={panelDraft.refresh} onChange={e => setPanelDraft({ ...panelDraft, refresh: e.target.value })} /><span>segundos</span></div>
            <p className="field-hint">0 desativa. Intervalo mínimo: 10 segundos.<br />Uma atualização pode interromper formulários.</p>
            <button className="button button-primary full-width" type="submit" disabled={saving}><Check size={16} />Aplicar alterações</button>
          </form>
          <div className="inspector-section"><p className="section-label">ORGANIZAR ESPAÇO</p><div className="split-buttons"><button className="split-choice" disabled={saving} onClick={() => openAdd('row')}><Columns2 size={23} /><span>Lado a lado</span></button><button className="split-choice" disabled={saving} onClick={() => openAdd('column')}><Rows2 size={23} /><span>Em cima e embaixo</span></button></div><p className="field-hint">Cada divisão recebe uma nova página.</p></div>
          <button className="remove-page" disabled={saving} onClick={() => setDeleteOpen(true)}><Trash2 size={15} />Remover esta página</button>
        </> : <div className="inspector-empty">
          <div className="sidebar-step"><span>01</span><div><strong>Escolha suas páginas</strong><p>Dashboards, sistemas, vídeos ou qualquer endereço da web.</p></div></div>
          <div className="sidebar-step"><span>02</span><div><strong>Encontre a divisão ideal</strong><p>Coloque lado a lado ou empilhe. Arraste as bordas para ajustar.</p></div></div>
          <div className="sidebar-step"><span>03</span><div><strong>Deixe em exibição</strong><p>Um clique para ocupar a tela inteira, sem distrações.</p></div></div>
          <div className="sidebar-tip"><Power size={19} /><strong>Pronto quando você estiver</strong><p>Ative a inicialização com o Windows nas configurações. Seu painel volta exatamente como você deixou.</p><button onClick={() => setSettingsOpen(true)}>Abrir configurações <ArrowRight size={14} /></button></div>
        </div>}
        <div className="inspector-bottom"><ShieldCheck size={14} /><span>Seus dados ficam neste computador.</span></div>
      </aside>}
    </main>

    {editing && <footer className="statusbar"><span><span className={`connection-dot ${readyCount ? '' : 'neutral'}`} />{workspace.panels.length ? `${readyCount} de ${workspace.panels.length} páginas sem erro de carregamento` : 'Seu espaço está pronto para começar'}</span>{message ? <span className={`status-message ${message.error ? 'is-error' : ''}`} role={message.error ? 'alert' : 'status'}>{message.text}</span> : <span><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd><span className="shortcut-label">editar / exibir</span></span>}<span className="version-label">Mosaico {state.version}</span></footer>}

    {!editing && <div className={`presentation-edge ${presentationControls ? 'revealed' : ''}`} onMouseEnter={() => setPresentationControls(true)} onMouseLeave={() => setPresentationControls(false)} onFocus={() => setPresentationControls(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPresentationControls(false); }}>
      <div className="presentation-controls"><Brand compact /><span>{workspace.panels.length} {workspace.panels.length === 1 ? 'página' : 'páginas'} em exibição</span><button className="button button-secondary compact" onClick={() => setMode('edit')}><SlidersHorizontal size={15} />Editar painel <kbd>Ctrl + Shift + E</kbd></button></div>
      <button className="presentation-reveal" aria-label="Mostrar controles do painel" onClick={() => setPresentationControls(true)} tabIndex={presentationControls ? -1 : 0} />
    </div>}

    {addDialog && <Modal title={workspace.panels.length ? 'Mais uma página no seu painel.' : 'Sua primeira página.'} eyebrow="CONSTRUA SEU MOSAICO" onClose={closeAdd}>
      <p className="modal-description">Cole um endereço da web. Você poderá navegar e interagir normalmente.</p>
      <form onSubmit={addPage}>
        <label className="field-label" htmlFor="new-url">Endereço da página <span className="required-label">obrigatório</span></label>
        <div className="input-with-icon"><Globe2 size={17} /><input id="new-url" autoFocus required placeholder="https://exemplo.com" value={newUrl} onChange={e => setNewUrl(e.target.value)} /></div>
        <label className="field-label" htmlFor="new-title">Nome da página <span className="optional-label">opcional</span></label>
        <input id="new-title" placeholder="Ex.: Painel de vendas" maxLength={120} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        {!!workspace.panels.length && <><label className="field-label">Como dividir o espaço selecionado?</label><div className="modal-split-options"><button type="button" className={`split-option ${addDialog.direction === 'row' ? 'active' : ''}`} onClick={() => setAddDialog({ ...addDialog, direction: 'row' })}><Columns2 size={26} /><span>Lado a lado</span>{addDialog.direction === 'row' && <Check size={15} />}</button><button type="button" className={`split-option ${addDialog.direction === 'column' ? 'active' : ''}`} onClick={() => setAddDialog({ ...addDialog, direction: 'column' })}><Rows2 size={26} /><span>Em cima e embaixo</span>{addDialog.direction === 'column' && <Check size={15} />}</button></div></>}
        {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        <div className="modal-footer"><button className="button button-ghost" type="button" onClick={closeAdd}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}><Plus size={16} />{saving ? 'Adicionando…' : 'Adicionar página'}</button></div>
      </form>
    </Modal>}

    {settingsOpen && <Modal title="Do seu jeito, sempre." eyebrow="CONFIGURAÇÕES" onClose={closeSettings}>
      <div className="setting-row"><span className="setting-icon"><Power size={20} /></span><div><strong>Abrir com o Windows</strong><p>Seu painel inicia em tela cheia ao entrar na sua conta.</p></div><button className={`switch ${state.config.launchAtLogin ? 'checked' : ''}`} type="button" role="switch" aria-label="Abrir com o Windows" aria-checked={state.config.launchAtLogin} disabled={!state.launchAtLoginSupported || saving} onClick={async () => {
        setSaving(true);
        try { acceptState(await window.mosaico.setLaunchAtLogin(!state.config.launchAtLogin)); }
        catch (error) { notify(errorText(error), true); }
        finally { setSaving(false); }
      }}><span /></button></div>
      {!state.launchAtLoginSupported && <p className="setting-notice">Disponível no aplicativo instalado no Windows.</p>}
      <div className="field-divider" />
      <label className="field-label" htmlFor="display-select"><Monitor size={16} />Monitor ao iniciar com o Windows</label>
      <select id="display-select" value={state.config.targetDisplayId ?? state.displays.find(display => display.primary)?.id ?? ''} disabled={saving} onChange={async e => {
        setSaving(true);
        try { acceptState(await window.mosaico.setTargetDisplay(Number(e.target.value))); }
        catch (error) { notify(errorText(error), true); }
        finally { setSaving(false); }
      }}>{state.displays.map(display => <option key={display.id} value={display.id}>{display.label} — {display.width} × {display.height}{display.primary ? ' (principal)' : ''}</option>)}</select>
      <p className="field-hint">A escolha é salva e usada ao iniciar com o Windows e ao reabrir o Mosaico. A mudança também é aplicada agora. Se o monitor estiver desconectado, o principal será usado.</p>
      <div className="field-divider" />
      <div className="settings-subtitle"><strong>Leve seu layout com você</strong><p>Exporte páginas e divisões para outro computador.<br />Logins e senhas não fazem parte do arquivo.</p></div>
      <div className="settings-file-actions"><button className="button button-secondary" onClick={async () => {
        try { const result = await window.mosaico.exportWorkspace(); if (result.error) throw new Error(result.error); if (!result.cancelled) notify('Layout exportado.'); }
        catch (error) { notify(errorText(error), true); }
      }}><Download size={16} />Exportar layout</button><button className="button button-secondary" onClick={async () => {
        try { const result = await window.mosaico.importWorkspace(); if (result.error) throw new Error(result.error); if (!result.cancelled) { acceptState(await window.mosaico.getState()); notify('Layout importado.'); closeSettings(); } }
        catch (error) { notify(errorText(error), true); }
      }}><Upload size={16} />Importar layout</button></div>
      {state.warning && <p className="form-error" role="alert">{state.warning}</p>}
      {message?.error && <p className="form-error" role="alert">{message.text}</p>}
      <div className="modal-footer settings-footer"><button className="button button-danger-ghost" onClick={() => window.mosaico.quit().catch(error => notify(errorText(error), true))}><Power size={15} />Fechar Mosaico</button><button className="button button-primary" onClick={closeSettings}>Concluído <Check size={15} /></button></div>
    </Modal>}

    {helpOpen && <Modal title="Seu painel, sem complicação." eyebrow="UM GUIA RÁPIDO" onClose={closeHelp}>
      <div className="help-list"><div><span className="help-icon"><Plus size={19} /></span><p><strong>Adicione e divida</strong>Use “Adicionar página” para inserir um endereço. Cada nova página divide o painel selecionado.</p></div><div><span className="help-icon"><GripVertical size={19} /></span><p><strong>Ajuste o espaço</strong>Arraste a linha entre as páginas. Você também pode focar a linha com Tab e usar as setas do teclado.</p></div><div><span className="help-icon"><MousePointer2 size={19} /></span><p><strong>Use as páginas normalmente</strong>Cliques, navegação e logins funcionam dentro de cada painel. Os acessos ficam salvos neste computador.</p></div><div><span className="help-icon"><Expand size={19} /></span><p><strong>Exiba em tela cheia</strong>O botão “Exibir painel” esconde os controles. Mova o mouse até a borda inferior para editar novamente.</p></div></div>
      <div className="keyboard-help"><span>Editar / exibir</span><div><kbd>Ctrl</kbd><b>+</b><kbd>Shift</kbd><b>+</b><kbd>E</kbd></div></div>
      <div className="keyboard-help"><span>Voltar à edição</span><kbd>Esc</kbd></div>
      <p className="help-note">Adicione quantas páginas precisar. O desempenho depende da memória do computador e dos sites abertos.</p>
      <div className="modal-footer"><button className="button button-primary" onClick={closeHelp}>Entendi <Check size={15} /></button></div>
    </Modal>}

    {deleteOpen && selected && <Modal title="Remover esta página?" onClose={closeDelete}><p className="modal-description"><strong>{shortTitle(selected)}</strong> sairá deste layout. O espaço será ocupado pela página ao lado.</p><div className="modal-footer"><button className="button button-ghost" onClick={closeDelete}>Cancelar</button><button className="button button-danger" disabled={saving} onClick={removePage}><Trash2 size={15} />Remover página</button></div></Modal>}
  </div>;
}
