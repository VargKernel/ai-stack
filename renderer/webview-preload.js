// ── navigator.webdriver ──────────────────────────────────
try {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
} catch (e) {}

// ── window.chrome ────────────────────────────────────────
try {
  window.chrome = {
    app: {
      isInstalled: false,
      InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
      RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
      getDetails: () => null,
      getIsInstalled: () => false,
      runningState: () => 'cannot_run',
    },
    runtime: {
      id:               undefined,
      connect:          () => {},
      sendMessage:      () => {},
      onConnect:        { addListener: () => {}, removeListener: () => {}, hasListener: () => false },
      onMessage:        { addListener: () => {}, removeListener: () => {}, hasListener: () => false },
      onInstalled:      { addListener: () => {} },
    },
    loadTimes: () => ({
      requestTime:          performance.timeOrigin / 1000,
      startLoadTime:        performance.timeOrigin / 1000,
      commitLoadTime:       performance.timeOrigin / 1000 + 0.05,
      finishDocumentLoadTime: performance.timeOrigin / 1000 + 0.3,
      finishLoadTime:       performance.timeOrigin / 1000 + 0.5,
      firstPaintTime:       performance.timeOrigin / 1000 + 0.2,
      firstPaintAfterLoadTime: 0,
      navigationType:       'Other',
      wasFetchedViaSpdy:    false,
      wasNpnNegotiated:     true,
      npnNegotiatedProtocol:'h2',
      wasAlternateProtocolAvailable: false,
      connectionInfo:       'h2',
    }),
    csi: () => ({
      startE:  performance.timeOrigin,
      onloadT: performance.timeOrigin + 400,
      pageT:   performance.now(),
      tran:    15,
    }),
  };
} catch (e) {}

// ── Permissions ──────────────────────────────────────────
try {
  const _origQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (params) => {
    if (params.name === 'notifications') {
      return Promise.resolve({ state: Notification.permission, onchange: null });
    }
    return _origQuery(params);
  };
} catch (e) {}

// ── Plugins ─────────────────────────────────────────────
try {
  const fakePlugins = [
    { name: 'Chrome PDF Plugin',   filename: 'internal-pdf-viewer',              description: 'Portable Document Format',  length: 1 },
    { name: 'Chrome PDF Viewer',   filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '',                          length: 1 },
    { name: 'Native Client',       filename: 'internal-nacl-plugin',             description: '',                          length: 2 },
  ];
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const list = Object.assign([], fakePlugins);
      list.item        = (i)    => list[i] ?? null;
      list.namedItem   = (name) => list.find(p => p.name === name) ?? null;
      list.refresh     = ()    => {};
      return list;
    },
  });

  // MimeTypes
  const fakeMimes = [
    { type: 'application/x-google-chrome-pdf',  description: 'Portable Document Format', suffixes: 'pdf' },
    { type: 'application/pdf',                   description: 'Portable Document Format', suffixes: 'pdf' },
  ];
  Object.defineProperty(navigator, 'mimeTypes', {
    get: () => {
      const list = Object.assign([], fakeMimes);
      list.item      = (i)    => list[i] ?? null;
      list.namedItem = (type) => list.find(m => m.type === type) ?? null;
      return list;
    },
  });
} catch (e) {}

// ── Languages ────────────────────────────────────────────
try {
  Object.defineProperty(navigator, 'languages',   { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'language',    { get: () => 'en-US' });
} catch (e) {}

// ── Platform / appVersion ────────────────────────────────
try {
  Object.defineProperty(navigator, 'platform',   { get: () => 'Win32' });
  Object.defineProperty(navigator, 'appVersion', {
    get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
} catch (e) {}

// ── userAgentData (Client Hints) ─────────────────────────
try {
  if (navigator.userAgentData) {
    const _orig = navigator.userAgentData.getHighEntropyValues.bind(navigator.userAgentData);
    navigator.userAgentData.getHighEntropyValues = (fields) => {
      const mock = {
        platform:            'Windows',
        platformVersion:     '10.0.0',
        architecture:        'x86',
        bitness:             '64',
        model:               '',
        uaFullVersion:       '124.0.6367.119',
        fullVersionList: [
          { brand: 'Not A(Brand',  version: '99.0.0.0' },
          { brand: 'Chromium',     version: '124.0.6367.119' },
          { brand: 'Google Chrome', version: '124.0.6367.119' },
        ],
        wow64: false,
      };
      const result = {};
      fields.forEach(f => { if (f in mock) result[f] = mock[f]; });
      return Promise.resolve(result);
    };
  }
} catch (e) {}

// ── Hardware concurrency / memory ────────────────────────
try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); } catch (e) {}
try { Object.defineProperty(navigator, 'deviceMemory',        { get: () => 8 }); } catch (e) {}

// ── Connection ───────────────────────────────────────────
try {
  if (navigator.connection) {
    Object.defineProperty(navigator.connection, 'rtt',            { get: () => 50  });
    Object.defineProperty(navigator.connection, 'downlink',       { get: () => 10  });
    Object.defineProperty(navigator.connection, 'effectiveType',  { get: () => '4g' });
    Object.defineProperty(navigator.connection, 'saveData',       { get: () => false });
  }
} catch (e) {}

// ── Screen ───────────────────────────────────────────────
try {
  const _w = window.screen.width;
  const _h = window.screen.height;
  if (_w < 100) {
    // only patch if clearly wrong
    Object.defineProperty(window.screen, 'width',       { get: () => 1920 });
    Object.defineProperty(window.screen, 'height',      { get: () => 1080 });
    Object.defineProperty(window.screen, 'availWidth',  { get: () => 1920 });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040 });
    Object.defineProperty(window.screen, 'colorDepth',  { get: () => 24   });
    Object.defineProperty(window.screen, 'pixelDepth',  { get: () => 24   });
  }
} catch (e) {}

// ── WebGL fingerprint ────────────────────────────────────
try {
  const getCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const ctx = getCtx.call(this, type, ...args);
    if (!ctx) return ctx;
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      const origGetParam = ctx.getParameter.bind(ctx);
      ctx.getParameter = function (pname) {
        if (pname === 37445) return 'Google Inc. (NVIDIA)';                                       // UNMASKED_VENDOR_WEBGL
        if (pname === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)'; // UNMASKED_RENDERER_WEBGL
        if (pname === ctx.VENDOR)   return 'Google Inc. (NVIDIA)';
        if (pname === ctx.RENDERER) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return origGetParam(pname);
      };
      const origGetExt = ctx.getExtension.bind(ctx);
      ctx.getExtension = function (name) {
        if (name === 'WEBGL_debug_renderer_info') {
          return { UNMASKED_VENDOR_WEBGL: 37445, UNMASKED_RENDERER_WEBGL: 37446 };
        }
        return origGetExt(name);
      };
    }
    return ctx;
  };
} catch (e) {}

// ── Canvas noise (anti-fingerprinting) ───────────────────
try {
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    const ctx2d = this.getContext('2d');
    if (ctx2d) {
      const imageData = ctx2d.getImageData(0, 0, this.width || 1, this.height || 1);
      // Add imperceptible noise to break fingerprint without visual change
      for (let i = 0; i < imageData.data.length; i += 100) {
        imageData.data[i] = imageData.data[i] ^ 1;
      }
      ctx2d.putImageData(imageData, 0, 0);
    }
    return origToDataURL.apply(this, args);
  };
} catch (e) {}

// ── AudioContext fingerprint noise ───────────────────────
try {
  const origCreateOscillator = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function (...args) {
    const osc = origCreateOscillator.apply(this, args);
    return osc;
  };
} catch (e) {}

// ── Media autoplay ───────────────────────────────────────
try {
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const p = origPlay.apply(this, arguments);
    if (p && p.catch) return p.catch(() => {});
    return p;
  };
} catch (e) {}

// ── Clean up Electron traces ─────────────────────────────
try { delete window.__electron_ctx_bridge; }         catch (e) {}
try { delete window.__ELECTRON_WEBPACK_HOT_RELOAD__; } catch (e) {}
try { delete window.process; }                        catch (e) {}
try { delete window.require; }                        catch (e) {}
try { delete window.module; }                         catch (e) {}

// ── Timing jitter (defeats some bot-detection timers) ───
try {
  const origNow = performance.now.bind(performance);
  performance.now = () => origNow() + Math.random() * 0.1;
} catch (e) {}
