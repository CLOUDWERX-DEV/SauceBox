const { app, BrowserWindow, globalShortcut, session } = require('electron');
const path = require('path');
const state = require('./state');

const { startExtensionServer } = require('./modules/extensionServer');
const { setupSystemHandlers } = require('./modules/system');
const { setupFileSystemHandlers } = require('./modules/filesystem');
const { setupBinaryHandlers } = require('./modules/binaries');
const { setupMediaServerHandlers } = require('./modules/mediaServer');
const { setupDownloaderHandlers } = require('./modules/downloader');
const { setupMetadataHandlers } = require('./modules/metadata');
const { setupFfmpegHandlers } = require('./modules/ffmpegProcessing');

function createWindow() {
  const isLinux = process.platform === 'linux';

  state.mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    // titleBarStyle 'hidden' is macOS-only; on Linux it conflicts with frame:false
    // and causes the window to vanish from the taskbar on minimize.
    titleBarStyle: isLinux ? undefined : 'hidden',
    frame: false,
    show: true,
    skipTaskbar: false,
    icon: path.join(__dirname, '../build/icons/256x256.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  if (app.isPackaged) {
    state.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    state.mainWindow.loadURL('http://localhost:8081');
  }

  // Ensure the window is always restored to the taskbar when minimized
  state.mainWindow.on('minimize', () => {
    // No-op — just ensuring the event doesn't trigger any hide behavior
  });
}

if (app) {
  app.whenReady().then(() => {
    createWindow();
    
    // Start local HTTP Server for Chrome Extension
    startExtensionServer();

    // Inject Referer headers for adult video CDNs to bypass hotlink protection.
    const cdnRefererMap = [
      { pattern: '*://*.phncdn.com/*',        referer: 'https://www.pornhub.com/' },
      { pattern: '*://*.pornhub.com/*',        referer: 'https://www.pornhub.com/' },
      { pattern: '*://*.xvideos-cdn.com/*',    referer: 'https://www.xvideos.com/' },
      { pattern: '*://*.xvideos.com/*',        referer: 'https://www.xvideos.com/' },
      { pattern: '*://*.xhamster.com/*',       referer: 'https://xhamster.com/' },
      { pattern: '*://*.xhamster3.com/*',      referer: 'https://xhamster.com/' },
      { pattern: '*://*.redtubefiles.com/*',   referer: 'https://www.redtube.com/' },
      { pattern: '*://*.redtube.com/*',        referer: 'https://www.redtube.com/' },
      { pattern: '*://*.youporn.com/*',        referer: 'https://www.youporn.com/' },
      { pattern: '*://*.ypncdn.com/*',         referer: 'https://www.youporn.com/' },
      { pattern: '*://*.thumbs.redditmedia.com/*', referer: 'https://www.reddit.com/' },
    ];

    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: cdnRefererMap.map(e => e.pattern) },
      (details, callback) => {
        try {
          const reqUrl = new URL(details.url);
          for (const { pattern, referer } of cdnRefererMap) {
            const domain = pattern.replace('*://*.', '').replace('/*', '').split('/')[0];
            if (reqUrl.hostname === domain || reqUrl.hostname.endsWith('.' + domain)) {
              details.requestHeaders['Referer'] = referer;
              break;
            }
          }
        } catch (_) { /* malformed URL — skip */ }
        callback({ requestHeaders: details.requestHeaders });
      }
    );

    // Setup modular IPC handlers
    setupSystemHandlers();
    setupFileSystemHandlers();
    setupBinaryHandlers();
    setupMediaServerHandlers();
    setupDownloaderHandlers();
    setupMetadataHandlers();
    setupFfmpegHandlers();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
