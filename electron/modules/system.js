const { ipcMain, globalShortcut, shell } = require('electron');
const os = require('os');
const path = require('path');
const state = require('../state');

function getDefaultDownloadPath() {
  return path.join(os.homedir(), 'Downloads', 'SauceBox');
}

function getPinResetInfo() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const file = path.join(appData, 'saucebox', 'saucebox-settings.json');
    return { os: 'Windows', file, shortPath: '%APPDATA%\\saucebox\\saucebox-settings.json' };
  }
  if (process.platform === 'darwin') {
    const file = path.join(home, 'Library', 'Application Support', 'saucebox', 'saucebox-settings.json');
    return { os: 'macOS', file, shortPath: '~/Library/Application Support/saucebox/saucebox-settings.json' };
  }
  const file = path.join(home, '.config', 'saucebox', 'saucebox-settings.json');
  return { os: 'Linux', file, shortPath: '~/.config/saucebox/saucebox-settings.json' };
}

function setupSystemHandlers() {
  ipcMain.on('register-stealth-hotkey', (event, hotkey) => {
    if (state.currentStealthHotkey) {
      globalShortcut.unregister(state.currentStealthHotkey);
    }
    
    if (hotkey) {
      try {
        globalShortcut.register(hotkey, () => {
          if (state.mainWindow && !state.mainWindow.isDestroyed()) {
            if (state.mainWindow.isVisible()) {
              state.mainWindow.webContents.send('panic-stealth');
              state.mainWindow.hide();
            } else {
              state.mainWindow.show();
            }
          }
        });
        state.currentStealthHotkey = hotkey;
        console.log('Registered stealth hotkey:', hotkey);
      } catch (e) {
        console.error('Failed to register hotkey:', hotkey, e);
      }
    }
  });

  ipcMain.handle('minimize-window', () => state.mainWindow && state.mainWindow.minimize());
  ipcMain.handle('maximize-window', () => state.mainWindow && (state.mainWindow.isMaximized() ? state.mainWindow.unmaximize() : state.mainWindow.maximize()));
  ipcMain.handle('close-window', () => state.mainWindow && state.mainWindow.close());
  ipcMain.handle('get-default-download-path', () => getDefaultDownloadPath());
  ipcMain.handle('get-pin-reset-info', () => getPinResetInfo());

  ipcMain.handle('open-video', async (event, payload) => {
    let filepath = typeof payload === 'string' ? payload : payload.filepath;
    let customPlayerPath = typeof payload === 'string' ? null : payload.customPlayerPath;

    if (!filepath || typeof filepath !== 'string') {
      return { success: false, error: 'Invalid video path' };
    }
  
    if (customPlayerPath && customPlayerPath.trim() !== '') {
      const { spawn } = require('child_process');
      const fs = require('fs');
      try {
        if (!fs.existsSync(customPlayerPath)) {
          return { success: false, error: 'Custom player path does not exist' };
        }
        const child = spawn(customPlayerPath, [filepath], { detached: true, stdio: 'ignore' });
        child.unref();
        return { success: true };
      } catch (e) {
        console.error('Failed to launch custom player:', e);
        shell.openPath(filepath);
        return { success: false, error: e.message };
      }
    } else {
      shell.openPath(filepath);
      return { success: true };
    }
  });

  ipcMain.handle('open-folder', async (event, filepath) => {
    if (!filepath || typeof filepath !== 'string') {
      return { success: false, error: 'Invalid folder path' };
    }
    shell.showItemInFolder(filepath);
    return { success: true };
  });

  ipcMain.handle('open-external', async (event, url) => {
    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        return { success: false, error: 'Unsupported external URL protocol' };
      }
    } catch (error) {
      return { success: false, error: 'Invalid external URL' };
    }
    await shell.openExternal(url);
    return { success: true };
  });
}

module.exports = { setupSystemHandlers };
