const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');

function setupStorageHandlers() {
  const userDataPath = app.getPath('userData');
  
  ipcMain.handle('load-state', async (event, name) => {
    const filePath = path.join(userDataPath, `${name}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return data;
      }
      return null;
    } catch (e) {
      console.error(`Failed to load state for ${name}:`, e);
      return null;
    }
  });

  ipcMain.handle('save-state', async (event, { name, value }) => {
    const filePath = path.join(userDataPath, `${name}.json`);
    const tempPath = path.join(userDataPath, `${name}.tmp.json`);
    try {
      // Atomic write: write to a temporary file first, then rename it
      // This prevents corruption if the app crashes or loses power during a write
      fs.writeFileSync(tempPath, value, 'utf8');
      fs.renameSync(tempPath, filePath);
      return { success: true };
    } catch (e) {
      console.error(`Failed to save state for ${name}:`, e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('remove-state', async (event, name) => {
    const filePath = path.join(userDataPath, `${name}.json`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (e) {
      console.error(`Failed to remove state for ${name}:`, e);
      return { success: false, error: e.message };
    }
  });
}

module.exports = { setupStorageHandlers };
