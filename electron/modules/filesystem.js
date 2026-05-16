const { ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const state = require('../state');

function setupFileSystemHandlers() {
  ipcMain.handle('find-duplicates', async (event, downloadPath) => {
    const targetDir = downloadPath || path.join(os.homedir(), 'Downloads', 'SauceBox');
    if (!fs.existsSync(targetDir)) return [];
    
    const files = fs.readdirSync(targetDir);
    const sizeMap = new Map();
    
    for (const file of files) {
      if (!file.match(/\.(mp4|mkv|webm)$/i)) continue;
      const filePath = path.join(targetDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          if (!sizeMap.has(stats.size)) sizeMap.set(stats.size, []);
          sizeMap.get(stats.size).push(filePath);
        }
      } catch (e) {}
    }
    
    const duplicates = [];
    for (const [size, filePaths] of sizeMap.entries()) {
      if (filePaths.length > 1) {
        duplicates.push({ size, files: filePaths });
      }
    }
    return duplicates;
  });

  ipcMain.handle('find-orphans', async (event, { downloadPath, dbPaths }) => {
    const targetDir = downloadPath || path.join(os.homedir(), 'Downloads', 'SauceBox');
    if (!fs.existsSync(targetDir)) return [];
    
    const files = fs.readdirSync(targetDir);
    const orphans = [];
    const dbPathSet = new Set(dbPaths.map(p => path.normalize(p)));
    
    for (const file of files) {
      if (!file.match(/\.(mp4|mkv|webm)$/i)) continue;
      const filePath = path.normalize(path.join(targetDir, file));
      if (!dbPathSet.has(filePath)) {
        orphans.push(filePath);
      }
    }
    return orphans;
  });

  ipcMain.handle('verify-database', async (event, dbPaths) => {
    const missing = [];
    for (const p of dbPaths) {
      try {
        if (!fs.existsSync(p)) {
          missing.push(p);
        }
      } catch (e) {
        missing.push(p);
      }
    }
    return missing;
  });

  ipcMain.handle('get-video-path', async (event, arg) => {
    const filename   = typeof arg === 'string' ? arg : arg.filename;
    const customPath = typeof arg === 'string' ? null : arg.downloadPath;
    const defaultDir = path.join(os.homedir(), 'Downloads', 'SauceBox');

    const searchDirs = [];
    if (customPath && customPath.trim() !== '' && customPath.trim() !== defaultDir) {
      searchDirs.push(customPath.trim());
    }
    searchDirs.push(defaultDir);

    const baseName  = filename.replace(/\.[^/.]+$/, '');
    const extensions = ['.mp4', '.mkv', '.webm', '.avi', '.m4a'];

    const normalize = (str) => {
      if (!str) return '';
      return str
        .replace(/&amp;/g,  '&')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g,  "'")
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    };

    const targetNormal = normalize(baseName);

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;

      const exactPath = path.join(dir, filename);
      if (fs.existsSync(exactPath)) return exactPath;

      for (const ext of extensions) {
        const testPath = path.join(dir, baseName + ext);
        if (fs.existsSync(testPath)) return testPath;
      }

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fileExt = path.extname(file);
        if (extensions.includes(fileExt)) {
          let fileBase = path.basename(file, fileExt);
          fileBase = fileBase.replace(/\[[^\]]+\]\s*$/, '').trim();
          const fileNormal = normalize(fileBase);
          if (fileNormal === targetNormal) {
            return path.join(dir, file);
          }
        }
      }
    }
    throw new Error('Video file not found');
  });

  ipcMain.handle('read-video-file', async (event, filepath) => {
    try {
      const data = fs.readFileSync(filepath);
      return data.toString('base64');
    } catch (error) {
      throw new Error('Failed to read video file: ' + error.message);
    }
  });

  ipcMain.handle('get-disk-space', async (event, folderPath) => {
    try {
      let checkPath = folderPath;
      while (!fs.existsSync(checkPath) && checkPath !== path.parse(checkPath).root) {
        checkPath = path.dirname(checkPath);
      }
      const stat = await fs.promises.statfs(checkPath);
      const total = stat.blocks * stat.bsize;
      const free = stat.bavail * stat.bsize;
      const used = total - free;
      return { total, free, used, success: true };
    } catch (error) {
      console.error('Failed to get disk space:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('select-folder', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(state.mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Folder',
      buttonLabel: 'Select Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('select-file', async (event, title) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(state.mainWindow, {
      properties: ['openFile'],
      title: title || 'Select File',
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('select-import-files', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(state.mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov'] }]
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('select-import-folder', async () => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(state.mainWindow, {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    
    const dir = result.filePaths[0];
    try {
      const files = fs.readdirSync(dir);
      const exts = ['.mp4', '.mkv', '.webm', '.avi', '.mov'];
      return files
        .filter(f => exts.includes(path.extname(f).toLowerCase()))
        .map(f => path.join(dir, f));
    } catch (e) {
      console.error('Failed to read directory:', e);
      return [];
    }
  });

  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('delete-files', async (event, filePaths) => {
    const results = [];
    for (const fp of filePaths) {
      try {
        await fs.promises.unlink(fp);
        results.push({ path: fp, success: true });
      } catch (err) {
        results.push({ path: fp, success: false, error: err.message });
      }
    }
    return results;
  });
}

module.exports = { setupFileSystemHandlers };
