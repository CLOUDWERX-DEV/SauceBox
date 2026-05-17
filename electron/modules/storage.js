const { ipcMain, app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function setupStorageHandlers() {
  const userDataPath = app.getPath('userData');
  
  ipcMain.handle('load-state', async (event, name) => {
    try {
      const settingsPath = path.join(userDataPath, 'saucebox-settings.json');
      const galleryPath = path.join(userDataPath, 'saucebox-gallery.json');
      const legacyPath = path.join(userDataPath, `${name}.json`);

      let settingsData = {};
      let galleryData = {};

      if (fs.existsSync(settingsPath) || fs.existsSync(galleryPath)) {
        if (fs.existsSync(settingsPath)) {
          settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        if (fs.existsSync(galleryPath)) {
          galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        }
        
        // Reconstruct the full state object for Zustand
        const combinedState = {
          ...galleryData,
          settings: settingsData.settings || {}
        };
        
        // Zustand's persist middleware expects { state: ..., version: ... }
        return JSON.stringify({ state: combinedState, version: 0 });
      }

      // Legacy migration check: load the old single-file state if split files don't exist yet
      if (fs.existsSync(legacyPath)) {
        return fs.readFileSync(legacyPath, 'utf8');
      }

      return null;
    } catch (e) {
      console.error(`Failed to load split state:`, e);
      return null;
    }
  });

  ipcMain.handle('save-state', async (event, { name, value }) => {
    try {
      const parsed = JSON.parse(value);
      const state = parsed.state || {};
      
      // Split settings out
      const settingsData = { settings: state.settings || {} };
      
      // Everything else (history, downloads, etc.) goes to gallery
      const galleryData = { ...state };
      delete galleryData.settings;

      // Save settings with pretty formatting
      const settingsPath = path.join(userDataPath, 'saucebox-settings.json');
      const settingsTemp = path.join(userDataPath, 'saucebox-settings.tmp.json');
      fs.writeFileSync(settingsTemp, JSON.stringify(settingsData, null, 2), 'utf8');
      fs.renameSync(settingsTemp, settingsPath);

      // Save gallery with pretty formatting
      const galleryPath = path.join(userDataPath, 'saucebox-gallery.json');
      const galleryTemp = path.join(userDataPath, 'saucebox-gallery.tmp.json');
      fs.writeFileSync(galleryTemp, JSON.stringify(galleryData, null, 2), 'utf8');
      fs.renameSync(galleryTemp, galleryPath);

      // Clean up legacy file if it exists so migration is complete
      const legacyPath = path.join(userDataPath, `${name}.json`);
      if (fs.existsSync(legacyPath)) {
        fs.unlinkSync(legacyPath);
      }

      return { success: true };
    } catch (e) {
      console.error(`Failed to save split state:`, e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('remove-state', async (event, name) => {
    try {
      const paths = [
        path.join(userDataPath, 'saucebox-settings.json'),
        path.join(userDataPath, 'saucebox-gallery.json'),
        path.join(userDataPath, `${name}.json`)
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
      return { success: true };
    } catch (e) {
      console.error(`Failed to remove split state:`, e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('backup-state', async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Backup Folder',
        properties: ['openDirectory', 'createDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const backupDir = path.join(result.filePaths[0], `SauceBox_Backup_${Date.now()}`);
      fs.mkdirSync(backupDir, { recursive: true });

      const settingsPath = path.join(userDataPath, 'saucebox-settings.json');
      const galleryPath = path.join(userDataPath, 'saucebox-gallery.json');

      if (fs.existsSync(settingsPath)) {
        fs.copyFileSync(settingsPath, path.join(backupDir, 'saucebox-settings.json'));
      }
      if (fs.existsSync(galleryPath)) {
        fs.copyFileSync(galleryPath, path.join(backupDir, 'saucebox-gallery.json'));
      }

      return { success: true, backupDir };
    } catch (e) {
      console.error('Failed to backup state:', e);
      return { success: false, error: e.message };
    }
  });
}

module.exports = { setupStorageHandlers };
