import { contextBridge, ipcRenderer } from 'electron';
import type { MosaicoAPI, AppState, PanelStatus } from '../shared/types';

const api: MosaicoAPI = {
  getState: () => ipcRenderer.invoke('mosaico:get-state'),
  saveWorkspace: workspace => ipcRenderer.invoke('mosaico:save-workspace', workspace),
  setMode: mode => ipcRenderer.invoke('mosaico:set-mode', mode),
  setLaunchAtLogin: enabled => ipcRenderer.invoke('mosaico:set-login', enabled),
  setTargetDisplay: id => ipcRenderer.invoke('mosaico:set-display', id),
  syncBounds: bounds => ipcRenderer.send('mosaico:bounds', bounds),
  navigatePanel: payload => ipcRenderer.invoke('mosaico:navigate', payload),
  importWorkspace: () => ipcRenderer.invoke('mosaico:import'),
  exportWorkspace: () => ipcRenderer.invoke('mosaico:export'),
  quit: () => ipcRenderer.invoke('mosaico:quit'),
  onState: callback => {
    const listener = (_: Electron.IpcRendererEvent, state: AppState) => callback(state);
    ipcRenderer.on('mosaico:state', listener);
    return () => { ipcRenderer.removeListener('mosaico:state', listener); };
  },
  onPanelStatus: callback => {
    const listener = (_: Electron.IpcRendererEvent, status: PanelStatus) => callback(status);
    ipcRenderer.on('mosaico:panel-status', listener);
    return () => { ipcRenderer.removeListener('mosaico:panel-status', listener); };
  },
};
contextBridge.exposeInMainWorld('mosaico', api);
