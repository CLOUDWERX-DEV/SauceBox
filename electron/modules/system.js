const { ipcMain, globalShortcut, shell } = require('electron');
const state = require('../state');

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

  ipcMain.handle('open-video', async (event, payload) => {
    let filepath = typeof payload === 'string' ? payload : payload.filepath;
    let customPlayerPath = typeof payload === 'string' ? null : payload.customPlayerPath;
  
    if (customPlayerPath && customPlayerPath.trim() !== '') {
      const { spawn } = require('child_process');
      try {
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
    const path = require('path');
    const folderPath = path.dirname(filepath);
    shell.showItemInFolder(filepath);
  });

  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
  });
}

module.exports = { setupSystemHandlers };
