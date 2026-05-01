const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window ─────────────────────────────────
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  // ── Persist state ──────────────────────────
  saveTheme:     (theme) => ipcRenderer.send('save-theme',     theme),
  saveTabs:      (tabs)  => ipcRenderer.send('save-tabs',      tabs),
  saveSidebar:   (open)  => ipcRenderer.send('save-sidebar',   open),
  saveFavorites: (ids)   => ipcRenderer.send('save-favorites', ids),

  // ── Data ───────────────────────────────────
  getDataPath:  ()          => ipcRenderer.invoke('get-data-path'),
  clearAllData: ()          => ipcRenderer.invoke('clear-all-data'),
  clearSession: (partition) => ipcRenderer.send('clear-session', partition),

  // ── Callbacks ──────────────────────────────
  onSessionCleared: (cb) => ipcRenderer.on('session-cleared',  (_, p)     => cb(p)),
  onAppStateLoaded: (cb) => ipcRenderer.on('app-state-loaded', (_, state) => cb(state)),

  // ── Misc ───────────────────────────────────
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
