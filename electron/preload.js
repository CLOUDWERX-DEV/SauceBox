const { contextBridge, ipcRenderer } = require('electron');

const invokeChannels = new Set([
  'backup-state',
  'check-managed-binaries',
  'delete-file',
  'delete-files',
  'download-managed-binaries',
  'download-video',
  'find-duplicates',
  'find-orphans',
  'get-binary-versions',
  'get-default-download-path',
  'get-disk-space',
  'get-entry-thumbnails',
  'get-local-ip',
  'get-local-metadata',
  'get-local-thumbnail',
  'get-pin-reset-info',
  'get-playlist-info',
  'get-video-info',
  'get-video-path',
  'load-state',
  'minimize-window',
  'maximize-window',
  'close-window',
  'open-external',
  'open-folder',
  'open-video',
  'pause-download',
  'remove-state',
  'save-state',
  'save-stream-playlist',
  'select-file',
  'select-folder',
  'select-import-files',
  'select-import-folder',
  'start-media-server',
  'stop-media-server',
  'trim-video',
  'update-managed-ytdlp',
  'verify-database',
]);

const sendChannels = new Set([
  'register-stealth-hotkey',
  'update-binary-paths',
]);

const listenChannels = new Set([
  'broadcast-log',
  'download-progress',
  'external-add-url',
  'panic-stealth',
  'playlist-thumbnails-progress',
  'provision-log',
  'provision-progress',
]);

const listenerMap = new WeakMap();

contextBridge.exposeInMainWorld('saucebox', {
  platform: process.platform,
  invoke: (channel, ...args) => {
    if (!invokeChannels.has(channel)) {
      return Promise.reject(new Error(`IPC invoke channel not allowed: ${channel}`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel, ...args) => {
    if (!sendChannels.has(channel)) {
      throw new Error(`IPC send channel not allowed: ${channel}`);
    }
    ipcRenderer.send(channel, ...args);
  },
  on: (channel, listener) => {
    if (!listenChannels.has(channel) || typeof listener !== 'function') return;
    const wrapped = (_event, ...args) => listener(...args);
    listenerMap.set(listener, wrapped);
    ipcRenderer.on(channel, wrapped);
  },
  removeListener: (channel, listener) => {
    if (!listenChannels.has(channel) || typeof listener !== 'function') return;
    const wrapped = listenerMap.get(listener);
    if (wrapped) {
      ipcRenderer.removeListener(channel, wrapped);
      listenerMap.delete(listener);
    }
  },
});
