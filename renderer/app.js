// ── Agent definitions ──
const AGENTS = [
  { id: 'chatgpt',    name: 'ChatGPT',      url: 'https://chat.openai.com',           tag: 'OpenAI',      requiresExternal: false },
  { id: 'claude',     name: 'Claude',       url: 'https://claude.ai',                 tag: 'Anthropic',   requiresExternal: false },
  { id: 'deepseek',   name: 'DeepSeek',     url: 'https://chat.deepseek.com',         tag: 'DeepSeek',    requiresExternal: false },
  { id: 'gemini',     name: 'Gemini',       url: 'https://gemini.google.com',         tag: 'Google',      requiresExternal: false },
  { id: 'grok',       name: 'Grok',         url: 'https://grok.com',                  tag: 'xAI',         requiresExternal: false },
  { id: 'mistral',    name: 'Mistral',      url: 'https://chat.mistral.ai',           tag: 'Mistral',     requiresExternal: false },
  { id: 'copilot',    name: 'Copilot',      url: 'https://copilot.microsoft.com',     tag: 'Microsoft',   requiresExternal: false },
  { id: 'perplexity', name: 'Perplexity',   url: 'https://www.perplexity.ai',         tag: 'Perplexity',  requiresExternal: false },
  { id: 'huggingchat',name: 'HuggingChat',  url: 'https://huggingface.co/chat',       tag: 'HuggingFace', requiresExternal: false },
  { id: 'meta',       name: 'Meta AI',      url: 'https://www.meta.ai',               tag: 'Meta',        requiresExternal: false },
  { id: 'ideogram',   name: 'Ideogram',     url: 'https://ideogram.ai',               tag: 'Ideogram',    requiresExternal: false },
  { id: 'midjourney', name: 'Midjourney',   url: 'https://www.midjourney.com',        tag: 'Midjourney',  requiresExternal: false },
  { id: 'suno',       name: 'Suno',         url: 'https://suno.com',                  tag: 'Suno',        requiresExternal: false },
  { id: 'elevenlabs', name: 'ElevenLabs',   url: 'https://elevenlabs.io',             tag: 'ElevenLabs',  requiresExternal: false }
];

// ── Theme definitions ──
const THEMES = [
  { id: 'dark',       label: 'Dark',       sidebarBg: '#1e1e1e', mainBg: '#121212', accent: '#3daee9' },
  { id: 'light',      label: 'Light',      sidebarBg: '#ffffff', mainBg: '#f3f4f6', accent: '#2563eb' },
  { id: 'nord',       label: 'Nord',       sidebarBg: '#3b4252', mainBg: '#2e3440', accent: '#88c0d0' },
  { id: 'catppuccin', label: 'Catppuccin', sidebarBg: '#181825', mainBg: '#1e1e2e', accent: '#cba6f7' },
  { id: 'solarized',  label: 'Solarized',  sidebarBg: '#eee8d5', mainBg: '#fdf6e3', accent: '#268bd2' },
  { id: 'gruvbox',    label: 'Gruvbox',    sidebarBg: '#3c3836', mainBg: '#282828', accent: '#d79921' },
];

// ── State ──
const state = {
  activeAgentId: null,
  openTabs: [],
  loadedWebviews: new Set(),
  currentTheme: 'dark',
  searchQuery: '',
  favorites: []
};

// ── DOM refs ──
const body           = document.body;
const sidebar        = document.getElementById('sidebar');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebarReopen  = document.getElementById('sidebar-reopen');
const agentList      = document.getElementById('agent-list');
const welcomeScreen  = document.getElementById('welcome-screen');
const webviewCont    = document.getElementById('webview-container');
const webviews       = document.getElementById('webviews');
const tabBar         = document.getElementById('tab-bar');
const navBack        = document.getElementById('nav-back');
const navForward     = document.getElementById('nav-forward');
const navReload      = document.getElementById('nav-reload');
const navUrl         = document.getElementById('nav-url-display');
const navClear       = document.getElementById('nav-clear-session');
const themeBtn       = document.getElementById('theme-btn');
const settingsBtn    = document.getElementById('settings-btn');
const themeModal     = document.getElementById('theme-modal');
const settingsModal  = document.getElementById('settings-modal');
const searchInput    = document.getElementById('search-input');
const welcomeChips   = document.getElementById('welcome-chips');
const offlineBanner  = document.getElementById('offline-banner');
const offlineScreen  = document.getElementById('offline-screen');
const loadingOverlay = document.getElementById('webview-loading-overlay');

// ── Confirm modal elements ──
const confirmModal   = document.getElementById('confirm-modal');
const confirmTitle   = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmCancel  = document.getElementById('confirm-cancel');
const confirmOk      = document.getElementById('confirm-ok');
let confirmCallback  = null;

// ── Init ──
function init() {
  buildSidebar();
  buildWelcomeChips();
  buildWelcomeHotkeys();
  buildThemeGrid();
  buildSessionsList();
  bindEvents();
  checkNetworkStatus();

  if (window.electronAPI) {
    window.electronAPI.onAppStateLoaded((loadedState) => {
      applyTheme(loadedState.savedTheme || 'dark');
      if (loadedState.sidebarOpen === false) sidebar.classList.add('collapsed');
      state.favorites = loadedState.favorites || [];
      buildSidebar();
      if (loadedState.savedTabs && loadedState.savedTabs.length > 0) {
        loadedState.savedTabs.forEach(tab => openAgent(tab.agentId, true));
        switchToAgent(loadedState.savedTabs[loadedState.savedTabs.length - 1].agentId);
      }
      window.electronAPI.getDataPath().then(path => {
        document.getElementById('data-location-path').textContent = path;
      });
    });
  } else {
    applyTheme('dark');
  }
}

// ── Go Home ──
function goHome() {
  state.activeAgentId = null;
  webviewCont.classList.add('hidden');
  hideLoadingOverlay();
  if (navigator.onLine) {
    welcomeScreen.classList.remove('hidden');
    offlineScreen.classList.add('hidden');
  } else {
    welcomeScreen.classList.add('hidden');
    offlineScreen.classList.remove('hidden');
  }
  document.querySelectorAll('.agent-item.active, .tab.active, webview.active').forEach(el => el.classList.remove('active'));
  buildSidebar(state.searchQuery);
}

// ── Network Status ──
function checkNetworkStatus() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    body.classList.remove('offline');
    offlineBanner.classList.add('hidden');
    if (!state.activeAgentId) {
      offlineScreen.classList.add('hidden');
      welcomeScreen.classList.remove('hidden');
    }
  } else {
    body.classList.add('offline');
    offlineBanner.classList.remove('hidden');
    if (!state.activeAgentId) {
      welcomeScreen.classList.add('hidden');
      offlineScreen.classList.remove('hidden');
    }
  }
}

// ── Sidebar ──
function buildSidebar(filter = '') {
  agentList.innerHTML = '';
  const query = filter.toLowerCase();
  const filtered = AGENTS.filter(a =>
    !query || a.name.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query)
  );

  const favs = filtered.filter(a => state.favorites.includes(a.id));
  const others = filtered.filter(a => !state.favorites.includes(a.id));

  if (favs.length > 0) {
    const label = document.createElement('div');
    label.className = 'agent-section-label';
    label.textContent = 'Favorites';
    agentList.appendChild(label);
    favs.forEach(agent => agentList.appendChild(createAgentItem(agent, true)));
  }

  if (others.length > 0) {
    if (favs.length > 0) {
      const label = document.createElement('div');
      label.className = 'agent-section-label';
      label.textContent = 'All Agents';
      agentList.appendChild(label);
    }
    others.forEach(agent => agentList.appendChild(createAgentItem(agent, false)));
  }

  if (filtered.length === 0) {
    agentList.innerHTML = `<div style="padding:20px 12px;color:var(--text-muted);font-size:13px;text-align:center">No agents found</div>`;
  }
}

function createAgentItem(agent, isFavorite) {
  const item = document.createElement('div');
  item.className = 'agent-item' +
    (state.activeAgentId === agent.id ? ' active' : '') +
    (state.loadedWebviews.has(agent.id) ? ' loaded' : '');
  item.dataset.agentId = agent.id;
  item.title = agent.name;

  const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(agent.url).hostname}&sz=64`;

  const externalIcon = '';

  const starIcon = `<svg class="agent-fav-star ${isFavorite ? 'faved' : ''}" data-fav-id="${agent.id}" viewBox="0 0 20 20" fill="none" stroke="currentColor">
    <path d="M10 1l2.39 5.22L18 7.22l-4 4.17.86 5.61L10 14.5l-4.86 2.5.86-5.61L2 7.22l5.61-.61L10 1z" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;

  item.innerHTML = `
    <img class="agent-icon" src="${iconUrl}" alt="${agent.name}">
    <div class="agent-info">
      <div class="agent-name">${agent.name} ${externalIcon}</div>
      <div class="agent-tag">${agent.tag}</div>
    </div>
    ${starIcon}
    <div class="agent-active-dot"></div>
  `;

  item.addEventListener('click', (e) => {
    if (e.target.closest('.agent-fav-star')) return;
    openAgent(agent.id);
  });

  const starEl = item.querySelector('.agent-fav-star');
  starEl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(agent.id);
  });

  return item;
}

function toggleFavorite(agentId) {
  const idx = state.favorites.indexOf(agentId);
  if (idx === -1) {
    state.favorites.push(agentId);
  } else {
    state.favorites.splice(idx, 1);
  }
  if (window.electronAPI) window.electronAPI.saveFavorites(state.favorites);
  buildSidebar(state.searchQuery);
  buildWelcomeChips();
}

// ── Welcome chips ──
function buildWelcomeChips() {
  welcomeChips.innerHTML = '';
  const favAgents = AGENTS.filter(a => state.favorites.includes(a.id));
  if (favAgents.length === 0) {
    welcomeChips.innerHTML = `<p style="color:var(--text-muted); font-size:13px; margin-top:16px;">No favorite agents yet.<br>Star them in the sidebar to add here.</p>`;
    return;
  }
  favAgents.forEach(agent => {
    const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(agent.url).hostname}&sz=32`;
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.innerHTML = `<img class="chip-icon" src="${iconUrl}" alt="icon">${agent.name}`;
    chip.addEventListener('click', () => openAgent(agent.id));
    welcomeChips.appendChild(chip);
  });
}

// ── Welcome hotkeys ──
function buildWelcomeHotkeys() {
  const container = document.getElementById('welcome-hotkeys');
  if (!container) return;
  container.innerHTML = `
    <div class="welcome-hotkeys-title">Keyboard Shortcuts</div>
    <div class="hotkey-row"><span class="hotkey-icon"><kbd>Ctrl</kbd> + <kbd>F</kbd></span> Search agent</div>
    <div class="hotkey-row"><span class="hotkey-icon"><kbd>Ctrl</kbd> + <kbd>R</kbd></span> Reload active agent</div>
    <div class="hotkey-row"><span class="hotkey-icon"><kbd>Esc</kbd></span> Close modals / Back to home</div>
  `;
}

// ── Open / switch agent ──
function openAgent(agentId, isRestore = false) {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return;

  if (!state.openTabs.find(t => t.agentId === agentId)) {
    state.openTabs.push({ agentId });
    createWebview(agent);
    addTab(agent);
    if (!isRestore && window.electronAPI) window.electronAPI.saveTabs(state.openTabs);
  }
  if (!isRestore) switchToAgent(agentId);
}

function switchToAgent(agentId) {
  state.activeAgentId = agentId;
  document.querySelectorAll('.agent-item').forEach(el => {
    el.classList.toggle('active', el.dataset.agentId === agentId);
  });
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.toggle('active', el.dataset.agentId === agentId);
  });
  document.querySelectorAll('webview').forEach(wv => {
    wv.classList.toggle('active', wv.dataset.agentId === agentId);
  });

  const activeWV = getActiveWebview();
  if (activeWV && activeWV.isLoading) showLoadingOverlay();
  else hideLoadingOverlay();

  if (navigator.onLine) {
    welcomeScreen.classList.add('hidden');
    offlineScreen.classList.add('hidden');
    webviewCont.classList.remove('hidden');
  }
  updateNavBar();
}

function closeTab(agentId, e) {
  e.stopPropagation();
  const idx = state.openTabs.findIndex(t => t.agentId === agentId);
  if (idx === -1) return;
  state.openTabs.splice(idx, 1);
  if (window.electronAPI) window.electronAPI.saveTabs(state.openTabs);

  const tab = tabBar.querySelector(`[data-agent-id="${agentId}"]`);
  if (tab) tab.remove();
  const wv = webviews.querySelector(`webview[data-agent-id="${agentId}"]`);
  if (wv) wv.remove();
  state.loadedWebviews.delete(agentId);
  buildSidebar(state.searchQuery);

  if (state.activeAgentId === agentId) {
    if (state.openTabs.length > 0) {
      const newIdx = Math.min(idx, state.openTabs.length - 1);
      switchToAgent(state.openTabs[newIdx].agentId);
    } else {
      state.activeAgentId = null;
      webviewCont.classList.add('hidden');
      hideLoadingOverlay();
      if (navigator.onLine) welcomeScreen.classList.remove('hidden');
      else offlineScreen.classList.remove('hidden');
    }
  }
}

// ── Webview & Loading ──
function showLoadingOverlay() { loadingOverlay.classList.remove('hidden'); }
function hideLoadingOverlay() { loadingOverlay.classList.add('hidden'); }

function createWebview(agent) {
  const wv = document.createElement('webview');
  wv.dataset.agentId = agent.id;
  wv.setAttribute('src', agent.url);
  wv.setAttribute('partition', `persist:${agent.id}`);
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('preload', 'webview-preload.js');
  wv.setAttribute('useragent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  wv.addEventListener('did-start-loading', () => {
    if (state.activeAgentId === agent.id) showLoadingOverlay();
    wv.isLoading = true;
  });
  wv.addEventListener('did-stop-loading', () => {
    wv.isLoading = false;
    state.loadedWebviews.add(agent.id);
    buildSidebar(state.searchQuery);
    if (state.activeAgentId === agent.id) {
      hideLoadingOverlay();
      updateNavBar();
    }
  });
  wv.addEventListener('dom-ready', () => injectThemeIntoWebview(wv));
  wv.addEventListener('did-navigate', () => { if (state.activeAgentId === agent.id) updateNavBar(); });
  wv.addEventListener('did-navigate-in-page', () => { if (state.activeAgentId === agent.id) updateNavBar(); });
  webviews.appendChild(wv);
}

function injectThemeIntoWebview(wv) {
  const isDark = state.currentTheme !== 'light' && state.currentTheme !== 'solarized';
  const mode = isDark ? 'dark' : 'light';
  const bg = isDark ? '#121212' : '#f3f4f6';
  const code = `
    document.documentElement.style.colorScheme = '${mode}';
    document.documentElement.style.backgroundColor = '${bg}';
    if ('${mode}' === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  `;
  wv.executeJavaScript(code).catch(() => {});
}

// ── Tabs ──
function addTab(agent) {
  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.dataset.agentId = agent.id;
  const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(agent.url).hostname}&sz=32`;
  tab.innerHTML = `
    <img class="tab-icon" src="${iconUrl}" alt="icon">
    <span class="tab-name">${agent.name}</span>
    <span class="tab-close" data-close-id="${agent.id}">
      <svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </span>
  `;
  tab.addEventListener('click', (e) => {
    if (e.target.closest('.tab-close')) return;
    switchToAgent(agent.id);
  });
  tab.querySelector('.tab-close').addEventListener('click', (e) => closeTab(agent.id, e));
  tabBar.appendChild(tab);
  tab.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
}

// ── Nav bar ──
function updateNavBar() {
  const wv = getActiveWebview();
  if (!wv) return;
  try {
    navBack.disabled = !wv.canGoBack();
    navForward.disabled = !wv.canGoForward();
    navUrl.textContent = wv.getURL() || '';
  } catch {}
}

function getActiveWebview() {
  return webviews.querySelector(`webview[data-agent-id="${state.activeAgentId}"]`);
}

// ── Theme ──
function applyTheme(themeId) {
  THEMES.forEach(t => body.classList.remove(`theme-${t.id}`));
  body.classList.add(`theme-${themeId}`);
  state.currentTheme = themeId;
  if (window.electronAPI) window.electronAPI.saveTheme(themeId);
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.themeId === themeId);
  });
  document.querySelectorAll('webview').forEach(wv => injectThemeIntoWebview(wv));
}

function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';
  THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (state.currentTheme === theme.id ? ' selected' : '');
    card.dataset.themeId = theme.id;
    card.innerHTML = `
      <div class="theme-preview">
        <div class="theme-preview-sidebar" style="background:${theme.sidebarBg}"></div>
        <div class="theme-preview-main" style="background:${theme.mainBg};display:flex;align-items:center;justify-content:center">
          <div style="width:24px;height:24px;border-radius:50%;background:${theme.accent};opacity:0.8"></div>
        </div>
      </div>
      <div class="theme-label">${theme.label}</div>
    `;
    card.addEventListener('click', () => applyTheme(theme.id));
    grid.appendChild(card);
  });
}

// ── Sessions list ──
function buildSessionsList() {
  const list = document.getElementById('sessions-list');
  list.innerHTML = '';
  AGENTS.forEach(agent => {
    const item = document.createElement('div');
    item.className = 'session-item';
    const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(agent.url).hostname}&sz=32`;
    item.innerHTML = `
      <img class="session-icon" src="${iconUrl}" alt="icon">
      <span class="session-name">${agent.name}</span>
      <button class="session-clear-btn" data-agent-id="${agent.id}">Clear</button>
    `;
    item.querySelector('.session-clear-btn').addEventListener('click', () => {
      if (window.electronAPI) window.electronAPI.clearSession(agent.id);
    });
    list.appendChild(item);
  });
}

// ── Confirm modal ──
function showConfirm(title, message, onConfirm) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmCallback = onConfirm;
  confirmModal.classList.remove('hidden');
}

function hideConfirm() {
  confirmModal.classList.add('hidden');
  confirmCallback = null;
}

// ── Event binding ──
function bindEvents() {
  window.addEventListener('online', checkNetworkStatus);
  window.addEventListener('offline', checkNetworkStatus);
  document.getElementById('offline-retry').addEventListener('click', () => window.location.reload());

  document.getElementById('btn-close').addEventListener('click', () => window.electronAPI?.close());
  document.getElementById('btn-min').addEventListener('click',   () => window.electronAPI?.minimize());
  document.getElementById('btn-max').addEventListener('click',   () => window.electronAPI?.maximize());

  document.getElementById('logo-home').addEventListener('click', goHome);

  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarReopen.addEventListener('click', toggleSidebar);

  navBack.addEventListener('click', () => getActiveWebview()?.goBack());
  navForward.addEventListener('click', () => getActiveWebview()?.goForward());
  navReload.addEventListener('click', () => getActiveWebview()?.reload());
  navClear.addEventListener('click', () => {
    if (!state.activeAgentId) return;
    if (confirm('Clear session and reload? You will be logged out.')) {
      window.electronAPI?.clearSession(state.activeAgentId);
      setTimeout(() => getActiveWebview()?.reload(), 500);
    }
  });

  themeBtn.addEventListener('click', () => { buildThemeGrid(); themeModal.classList.remove('hidden'); });
  document.getElementById('theme-modal-close').addEventListener('click', () => themeModal.classList.add('hidden'));
  themeModal.addEventListener('click', e => { if (e.target === themeModal) themeModal.classList.add('hidden'); });

  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  document.getElementById('settings-modal-close').addEventListener('click', () => settingsModal.classList.add('hidden'));
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    showConfirm(
      'Clear All Data & Reset',
      'This will remove all saved sessions, preferences, and tab history. The app will restart with factory defaults. Are you sure?',
      async () => {
        hideConfirm();
        if (window.electronAPI) {
          const result = await window.electronAPI.clearAllData();
          if (result.ok) window.location.reload();
          else alert('Error: ' + result.error);
        }
      }
    );
  });

  confirmCancel.addEventListener('click', hideConfirm);
  confirmOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
  });
  confirmModal.addEventListener('click', e => {
    if (e.target === confirmModal) hideConfirm();
  });

  document.getElementById('data-path-copy').addEventListener('click', () => {
    const pathEl = document.getElementById('data-location-path');
    navigator.clipboard.writeText(pathEl.textContent).then(() => {
      const btn = document.getElementById('data-path-copy');
      btn.style.color = 'var(--accent)';
      setTimeout(() => btn.style.color = '', 1000);
    });
  });

  searchInput.addEventListener('input', e => {
    state.searchQuery = e.target.value;
    buildSidebar(state.searchQuery);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.code === 'Escape') {
      if (!themeModal.classList.contains('hidden')) { themeModal.classList.add('hidden'); return; }
      if (!settingsModal.classList.contains('hidden')) { settingsModal.classList.add('hidden'); return; }
      if (!confirmModal.classList.contains('hidden')) { hideConfirm(); return; }
      goHome();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyR') {
      e.preventDefault();
      getActiveWebview()?.reload();
    }
  });

  if (window.electronAPI) {
    window.electronAPI.onSessionCleared((agentId) => {
      const wv = webviews.querySelector(`webview[data-agent-id="${agentId}"]`);
      if (wv) wv.reload();
    });
  }
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  const isOpen = !sidebar.classList.contains('collapsed');
  if (window.electronAPI) window.electronAPI.saveSidebar(isOpen);
}

init();
