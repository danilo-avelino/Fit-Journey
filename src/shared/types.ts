export type Mode = 'edit' | 'present';
export type Direction = 'row' | 'column';

export interface Panel {
  id: string;
  title: string;
  url: string;
  zoomFactor: number;
  reloadIntervalSec: number;
}

export type LayoutNode =
  | { type: 'leaf'; panelId: string }
  | { type: 'split'; id: string; direction: Direction; ratio: number; first: LayoutNode; second: LayoutNode };

export interface Workspace {
  panels: Panel[];
  layout: LayoutNode | null;
}

export interface AppConfig extends Workspace {
  version: 1;
  launchAtLogin: boolean;
  targetDisplayId: number | null;
}

export interface PanelStatus {
  panelId: string;
  url: string;
  title: string;
  loading: boolean;
  error: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface DisplayInfo {
  id: number;
  label: string;
  width: number;
  height: number;
  primary: boolean;
}

export interface AppState {
  config: AppConfig;
  mode: Mode;
  statuses: PanelStatus[];
  displays: DisplayInfo[];
  platform: string;
  version: string;
  launchAtLoginSupported: boolean;
  warning: string | null;
}

export interface PanelBounds {
  panelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FileResult {
  cancelled: boolean;
  error?: string;
}

export interface MosaicoAPI {
  getState(): Promise<AppState>;
  saveWorkspace(workspace: Workspace): Promise<AppState>;
  setMode(mode: Mode): Promise<AppState>;
  setLaunchAtLogin(enabled: boolean): Promise<AppState>;
  setTargetDisplay(id: number): Promise<AppState>;
  syncBounds(payload: { panels: PanelBounds[]; hidden: boolean }): void;
  navigatePanel(payload: { id: string; action: 'back' | 'forward' | 'reload' | 'stop' }): Promise<void>;
  importWorkspace(): Promise<FileResult>;
  exportWorkspace(): Promise<FileResult>;
  quit(): Promise<void>;
  onState(callback: (state: AppState) => void): () => void;
  onPanelStatus(callback: (status: PanelStatus) => void): () => void;
}

declare global {
  interface Window {
    mosaico: MosaicoAPI;
  }
}
