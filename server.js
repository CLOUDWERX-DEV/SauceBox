const express = require('express');
const path = require('path');
const fs = require('fs');

// Determine data directory
const dataDir = process.env.SAUCEBOX_DATA || path.join(__dirname, 'saucebox_data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure binaries directory exists
const binariesDir = path.join(dataDir, 'binaries');
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Setup IPC Mocking layer for Headless execution
const ipcHandlers = new Map();
const connections = new Set();

const mockElectron = {
  ipcMain: {
    handle: (channel, listener) => ipcHandlers.set(channel, listener),
    on: (channel, listener) => {} 
  },
  app: {
    getPath: (name) => {
      if (name === 'userData') return dataDir;
      return path.join(dataDir, name);
    },
    isPackaged: true,
    whenReady: () => Promise.resolve(),
    on: () => {}
  },
  dialog: {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] })
  },
  BrowserWindow: {
    getAllWindows: () => [{}]
  },
  session: {
    defaultSession: { webRequest: { onBeforeSendHeaders: () => {} } }
  },
  protocol: {
    registerSchemesAsPrivileged: () => {},
    registerFileProtocol: () => {}
  },
  nativeImage: { createFromPath: () => {} }
};

// Intercept 'electron' requires
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === 'electron') return mockElectron;
  return originalRequire.apply(this, arguments);
};

// Setup Mock Window to handle webContents.send broadcasts via SSE
const state = require('./electron/state');

state.mainWindow = {
  webContents: {
    send: (channel, ...args) => {
      const payload = JSON.stringify({ channel, args });
      for (const client of connections) {
        client.write(`data: ${payload}\n\n`);
      }
    }
  }
};

// Initialize backend modules
require('./electron/modules/system').setupSystemHandlers();
require('./electron/modules/filesystem').setupFileSystemHandlers();
require('./electron/modules/binaries').setupBinaryHandlers();
require('./electron/modules/mediaServer').setupMediaServerHandlers();
require('./electron/modules/downloader').setupDownloaderHandlers();
require('./electron/modules/metadata').setupMetadataHandlers();
require('./electron/modules/ffmpegProcessing').setupFfmpegHandlers();
require('./electron/modules/storage').setupStorageHandlers();
require('./electron/modules/provisioning').setupProvisioningHandlers();

const app = express();

// Enable CORS for Chrome Extension
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// API: IPC Invoke Bridge
app.post('/api/invoke', async (req, res) => {
  const { channel, args } = req.body;
  if (ipcHandlers.has(channel)) {
    try {
      const result = await ipcHandlers.get(channel)({ sender: state.mainWindow.webContents }, ...(args || []));
      res.json({ result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(404).json({ error: `Channel ${channel} not found` });
  }
});

// Chrome Extension Endpoint
app.post('/add-download', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (state.mainWindow) {
    state.mainWindow.webContents.send('external-add-url', url);
  }
  res.json({ success: true });
});

// API: IPC Send Bridge
app.post('/api/send', (req, res) => {
  res.json({ success: true });
});

// API: Server-Sent Events Bridge
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  connections.add(res);
  req.on('close', () => connections.delete(res));
});

// Serve frontend build
const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

// Fallback for React Router
app.use((req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SauceBox Headless Server running on port ${PORT}`);
  console.log(`Data Directory: ${dataDir}`);
});
