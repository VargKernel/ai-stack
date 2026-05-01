const { app, BrowserWindow, ipcMain, session, shell, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'WebDriver,IsolateOrigins,site-per-process');
app.commandLine.appendSwitch('user-agent', CHROME_UA);
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('no-first-run');
app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');

// ── Persistent store ──────────────────────────────────────
const store = new Store({
  name: 'ai-stack-config',
  cwd: app.getPath('userData'),
  defaults: {
    theme: 'dark',
    openTabs: [],
    sidebarOpen: true,
    favorites: [],
    windowBounds: { width: 1280, height: 800 },
  },
});

let mainWindow;

const ALL_PARTITIONS = [
  'chatgpt', 'claude', 'deepseek', 'gemini', 'grok', 'mistral', 'copilot',
  'perplexity', 'huggingchat', 'meta', 'ideogram', 'midjourney', 'suno', 'elevenlabs'
];

// ─────────────────────────────────────────────────────────
function createWindow() {
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width:     bounds.width  || 1280,
    height:    bounds.height || 800,
    x:         bounds.x,
    y:         bounds.y,
    minWidth:  940,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: true,
      webgl: true,
      plugins: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  // Bootstrap renderer with all saved state
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('app-state-loaded', {
      savedTheme:  store.get('theme'),
      savedTabs:   store.get('openTabs'),
      sidebarOpen: store.get('sidebarOpen'),
      favorites:   store.get('favorites'),
      dataPath:    app.getPath('userData'),
    });
  });

  // Main window popups: allow inside Electron, block truly external
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const dest = new URL(url);
      // Allow about:blank and known service domains in-app
      if (dest.protocol === 'about:') return { action: 'allow' };
      return { action: 'allow' };
    } catch {
      return { action: 'deny' };
    }
  });
}

// ── Webview hooks ─────────────────────────────────────────
app.on('web-contents-created', (_, contents) => {
  if (contents.getType() !== 'webview') return;

  // Right-click context menu
  contents.on('context-menu', (event, params) => {
    const template = [
      { label: 'Cut',          role: 'cut',       enabled: params.editFlags.canCut   },
      { label: 'Copy',         role: 'copy',      enabled: params.editFlags.canCopy  },
      { label: 'Paste',        role: 'paste',     enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { label: 'Select All',   role: 'selectAll' },
      { type: 'separator' },
      { label: 'Reload Agent', click: () => contents.reload() },
      { type: 'separator' },
      { label: 'Print',        role: 'print' },
    ];
    Menu.buildFromTemplate(template).popup();
  });

  // ── All popups stay inside Electron — no shell.openExternal ──
  contents.setWindowOpenHandler(({ url }) => {
    try {
      // about:blank and blob URLs are fine inline
      if (url.startsWith('about:') || url.startsWith('blob:')) {
        return { action: 'allow' };
      }
      return { action: 'allow' };
    } catch {
      return { action: 'deny' };
    }
  });

  // ── All navigation stays inside the webview ───────────────
  // No external redirects — every URL is handled inside the app
  contents.on('will-navigate', (_event, _url) => {
    // Allow all navigations within webviews unconditionally
  });
});

// ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  for (const partition of ALL_PARTITIONS) {
    const ses = session.fromPartition(`persist:${partition}`);

    // ── Critical: set session-level UA so Electron is never exposed ──
    ses.setUserAgent(CHROME_UA);

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const h = details.requestHeaders;

      // Strip any Electron / Node identifiers
      delete h['X-Electron-Version'];

      // Enforce clean Chrome identity on every request
      h['User-Agent']          = CHROME_UA;
      h['sec-ch-ua']           = '"Not A(Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"';
      h['sec-ch-ua-platform']  = '"Windows"';
      h['sec-ch-ua-mobile']    = '?0';
      h['sec-ch-ua-full-version-list'] =
        '"Not A(Brand";v="99.0.0.0", "Chromium";v="124.0.6367.119", "Google Chrome";v="124.0.6367.119"';

      callback({ requestHeaders: h });
    });

    // ── Remove headers that reveal WebView / embedded context ──
    ses.webRequest.onHeadersReceived((details, callback) => {
      const h = details.responseHeaders || {};
      // Allow all responses through; strip X-Frame-Options so auth iframes work
      delete h['x-frame-options'];
      delete h['X-Frame-Options'];
      callback({ responseHeaders: h });
    });
  }

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ──────────────────────────────────────────
ipcMain.on('save-theme',     (_, v) => store.set('theme',       v));
ipcMain.on('save-tabs',      (_, v) => store.set('openTabs',    v));
ipcMain.on('save-sidebar',   (_, v) => store.set('sidebarOpen', v));
ipcMain.on('save-favorites', (_, v) => store.set('favorites',   v));

ipcMain.handle('get-data-path', () => app.getPath('userData'));

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () =>
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window-close',    () => mainWindow.close());

// Clear single agent session
ipcMain.on('clear-session', async (event, partition) => {
  const ses = session.fromPartition(`persist:${partition}`);
  await ses.clearStorageData();
  // Re-apply UA after clearing
  ses.setUserAgent(CHROME_UA);
  event.reply('session-cleared', partition);
});

// Clear ALL user data and reset to defaults
ipcMain.handle('clear-all-data', async () => {
  try {
    for (const id of ALL_PARTITIONS) {
      try {
        const ses = session.fromPartition(`persist:${id}`);
        await ses.clearStorageData();
      } catch {}
    }
    store.clear();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Kept for any remaining calls, but webviews no longer use it
ipcMain.on('open-external', (_, url) => shell.openExternal(url));
