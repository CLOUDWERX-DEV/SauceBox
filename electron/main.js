const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');

function decodeHTMLEntities(text) {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hidden',
    frame: false,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadURL('http://localhost:8081');
}

if (app) {
  app.whenReady().then(() => {
    createWindow();

    // Start local HTTP Server for Chrome Extension
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/add-download') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const { url } = JSON.parse(body);
            if (url && mainWindow) {
              mainWindow.webContents.send('external-add-url', url);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(13337, '127.0.0.1');

    // Inject Referer headers for adult video CDNs to bypass hotlink protection.
    // Without this, thumbnail images return 403 because the CDN checks Referer.
    const { session } = require('electron');
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
            // Convert glob pattern to a simple hostname suffix check
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
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

let currentStealthHotkey = null;
ipcMain.on('register-stealth-hotkey', (event, hotkey) => {
  if (currentStealthHotkey) {
    globalShortcut.unregister(currentStealthHotkey);
  }
  
  if (hotkey) {
    try {
      globalShortcut.register(hotkey, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isVisible()) {
            mainWindow.webContents.send('panic-stealth');
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        }
      });
      currentStealthHotkey = hotkey;
      console.log('Registered stealth hotkey:', hotkey);
    } catch (e) {
      console.error('Failed to register hotkey:', hotkey, e);
    }
  }
});

let currentYtDlpPath = 'yt-dlp';
let currentFfmpegPath = 'ffmpeg';

ipcMain.on('update-binary-paths', (event, { ytdlpPath, ffmpegPath }) => {
  if (ytdlpPath) currentYtDlpPath = ytdlpPath;
  else currentYtDlpPath = 'yt-dlp';
  
  if (ffmpegPath) currentFfmpegPath = ffmpegPath;
  else currentFfmpegPath = 'ffmpeg';
  
  console.log('Updated binary paths:', { ytdlpPath: currentYtDlpPath, ffmpegPath: currentFfmpegPath });
});

ipcMain.handle('get-binary-versions', async () => {
  const getVersion = (binPath, arg = '--version') => new Promise(resolve => {
    try {
      const proc = spawn(binPath, [arg]);
      let out = '';
      proc.stdout.on('data', d => out += d.toString());
      proc.on('close', code => {
        if (code === 0) resolve(out.trim().split('\n')[0]);
        else resolve('Not Found/Error');
      });
      proc.on('error', () => resolve('Not Found'));
    } catch (e) {
      resolve('Not Found');
    }
  });

  const [ytVersion, ffmpegVersion] = await Promise.all([
    getVersion(currentYtDlpPath, '--version'),
    getVersion(currentFfmpegPath, '-version')
  ]);

  return { ytDlp: ytVersion, ffmpeg: ffmpegVersion };
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

const activeDownloads = new Map();

ipcMain.handle('download-video', async (event, { id, url, outputPath, resume = false, speedLimit, container = 'mp4', proxy }) => {
  console.log('Starting download for:', url, 'Resume:', resume, 'ID:', id);
  return new Promise((resolve, reject) => {
    const downloadsDir = outputPath || path.join(os.homedir(), 'Downloads', 'LocalFap');
    console.log('Download directory:', downloadsDir);
    
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
      console.log('Created download directory');
    }

    let formatArgs = [];
    if (container === 'mkv') {
      formatArgs = ['-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mkv'];
    } else if (container === 'webm') {
      formatArgs = ['-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/best', '--merge-output-format', 'webm'];
    } else if (container === 'any') {
      formatArgs = ['-f', 'bestvideo+bestaudio/best'];
    } else {
      formatArgs = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4'];
    }

    const extTemplate = container === 'any' ? '%(ext)s' : container;

    const args = [
      ...formatArgs,
      '-o', path.join(downloadsDir, `%(title)s.${extTemplate}`),
      '--newline',
      '--no-playlist',
      '--concurrent-fragments', '3',
    ];
    
    // Add resume/continue flags
    if (resume) {
      args.push('--continue');
      args.push('--no-overwrites');
    }
    
    // Add retry and timeout options for network resilience
    args.push('--retries', '10');
    args.push('--fragment-retries', '10');
    args.push('--retry-sleep', '5');
    
    if (speedLimit && speedLimit > 0) {
      args.push('--limit-rate', `${speedLimit}K`);
    }

    if (proxy && proxy.trim() !== '') {
      args.push('--proxy', proxy.trim());
    }
    
    args.push(url);

    const ytDlp = spawn(currentYtDlpPath, args);
    activeDownloads.set(id, { process: ytDlp, killedByUser: false });

    let progress = '';
    
    ytDlp.stdout.on('data', (data) => {
      progress = data.toString();
      console.log('yt-dlp output:', progress);
      
      // Parse progress percentage
      const match = progress.match(/(\d+\.?\d*)%/);
      if (match) {
        mainWindow.webContents.send('download-progress', {
          id,
          progress: parseFloat(match[1]),
          status: 'downloading'
        });
      }
      
      // Parse download speed
      const speedMatch = progress.match(/([\d.]+)(K|M|G)iB\/s/);
      if (speedMatch) {
        mainWindow.webContents.send('download-speed', {
          id,
          speed: `${speedMatch[1]}${speedMatch[2]}iB/s`
        });
      }
      
      // Parse ETA
      const etaMatch = progress.match(/ETA\s+([\d:]+)/);
      if (etaMatch) {
        mainWindow.webContents.send('download-eta', {
          id,
          eta: etaMatch[1]
        });
      }
    });

    ytDlp.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytDlp.on('close', (code) => {
      console.log('Download finished with code:', code, 'ID:', id);
      const downloadInfo = activeDownloads.get(id);
      
      if (downloadInfo && downloadInfo.killedByUser) {
        mainWindow.webContents.send('download-progress', {
          id,
          status: 'paused'
        });
        activeDownloads.delete(id);
        return resolve({ success: false, paused: true });
      }
      
      activeDownloads.delete(id);

      if (code === 0) {
        mainWindow.webContents.send('download-progress', {
          id,
          progress: 100,
          status: 'completed'
        });
        resolve({ success: true, path: downloadsDir });
      } else {
        mainWindow.webContents.send('download-progress', {
          id,
          progress: 0,
          status: 'failed'
        });
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
});

ipcMain.handle('pause-download', async (event, id) => {
  const downloadInfo = activeDownloads.get(id);
  if (downloadInfo) {
    console.log('Pausing download ID:', id);
    downloadInfo.killedByUser = true;
    downloadInfo.process.kill();
    return true;
  }
  return false;
});

ipcMain.handle('get-video-info', async (event, url) => {
  console.log('Getting video info for:', url);
  return new Promise((resolve, reject) => {
    const ytDlp = spawn(currentYtDlpPath, ['--dump-json', '--no-playlist', url]);
    let output = '';
    let errorOutput = '';
    
    ytDlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('yt-dlp stderr:', data.toString());
    });

    ytDlp.on('close', (code) => {
      console.log('yt-dlp exited with code:', code);
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          console.log('Video info parsed:', info.title);
          resolve({
            title: decodeHTMLEntities(info.title),
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            resolution: info.resolution || `${info.width}x${info.height}`,
            format: info.format_note || info.ext,
            filesize: info.filesize || info.filesize_approx
          });
        } catch (e) {
          console.error('Failed to parse video info:', e);
          reject(e);
        }
      } else {
        console.error('yt-dlp failed:', errorOutput);
        reject(new Error('Failed to get video info: ' + errorOutput));
      }
    });
  });
});

ipcMain.handle('get-playlist-info', async (event, url) => {
  console.log('Getting playlist info for:', url);
  return new Promise((resolve, reject) => {
    const ytDlp = spawn(currentYtDlpPath, ['--flat-playlist', '-J', '--no-warnings', url]);
    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('yt-dlp playlist stderr:', data.toString());
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(output);
          // Normalize entries — flat-playlist gives id/url/title/duration per entry
          const entries = (info.entries || []).map((entry, idx) => ({
            index: idx,
            id: entry.id,
            url: entry.url || entry.webpage_url || `${url.split('?')[0]}?v=${entry.id}`,
            title: decodeHTMLEntities(entry.title || entry.id || `Video ${idx + 1}`),
            duration: entry.duration || null,
            thumbnail: entry.thumbnail ||
              (entry.thumbnails && entry.thumbnails.length > 0
                ? entry.thumbnails[entry.thumbnails.length - 1].url
                : null),
            uploader: entry.uploader || info.uploader || null,
          }));
          resolve({
            isPlaylist: info._type === 'playlist' || entries.length > 1,
            title: decodeHTMLEntities(info.title || info.playlist_title || 'Playlist'),
            uploader: info.uploader || info.channel || null,
            count: entries.length,
            entries,
            // Also return single-video info if it turns out not to be a playlist
            singleVideo: info._type !== 'playlist' && entries.length <= 1 ? {
              title: decodeHTMLEntities(info.title),
              duration: info.duration,
              thumbnail: info.thumbnail,
              uploader: info.uploader,
              resolution: info.resolution || (info.width ? `${info.width}x${info.height}` : null),
              format: info.format_note || info.ext,
              filesize: info.filesize || info.filesize_approx,
            } : null,
          });
        } catch (e) {
          console.error('Failed to parse playlist info:', e);
          reject(new Error('Failed to parse playlist info: ' + e.message));
        }
      } else {
        console.error('yt-dlp playlist failed:', errorOutput);
        reject(new Error('Failed to get playlist info: ' + errorOutput));
      }
    });
  });
});


ipcMain.handle('get-video-path', async (event, filename) => {
  const downloadsDir = path.join(os.homedir(), 'Downloads', 'LocalFap');
  
  // Try exact match first
  const exactPath = path.join(downloadsDir, filename);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  
  // Try exact match with different extensions
  const baseName = filename.replace(/\.[^/.]+$/, '');
  const extensions = ['.mp4', '.mkv', '.webm', '.avi', '.m4a'];
  
  for (const ext of extensions) {
    const testPath = path.join(downloadsDir, baseName + ext);
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  // If still not found, use fuzzy matching to bypass yt-dlp filename sanitization
  const normalize = (str) => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  };
  
  const targetNormal = normalize(baseName);
  
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir);
    for (const file of files) {
      const fileExt = path.extname(file);
      if (extensions.includes(fileExt)) {
        const fileNormal = normalize(path.basename(file, fileExt));
        if (fileNormal === targetNormal) {
          return path.join(downloadsDir, file);
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

ipcMain.handle('open-video', async (event, filepath) => {
  const { shell } = require('electron');
  shell.openPath(filepath);
});

ipcMain.handle('open-folder', async (event, filepath) => {
  const { shell } = require('electron');
  const folderPath = path.dirname(filepath);
  shell.showItemInFolder(filepath);
});

ipcMain.handle('get-disk-space', async (event, folderPath) => {
  try {
    // If folder doesn't exist, statfs might fail, so we find the closest existing parent
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
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Folder',
    buttonLabel: 'Select Folder'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-import-files', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov'] }]
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('select-import-folder', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
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

ipcMain.handle('get-local-metadata', async (event, filePath) => {
  return new Promise((resolve) => {
    // Note: using ffmpeg -i to dump metadata to stderr and exit
    const ffmpeg = spawn(currentFfmpegPath, ['-i', filePath]);
    let output = '';
    
    ffmpeg.stderr.on('data', d => { output += d.toString(); });
    
    ffmpeg.on('close', () => {
      let duration = null;
      let resolution = null;
      
      const durMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.\d{2}/);
      if (durMatch) {
        duration = parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60 + parseInt(durMatch[3], 10);
      }
      
      const resMatch = output.match(/Video: .*, (\d{3,4}x\d{3,4})/);
      if (resMatch) {
        resolution = resMatch[1];
      }
      
      let filesize = null;
      try {
        filesize = fs.statSync(filePath).size;
      } catch (e) {}
      
      resolve({ duration, resolution, filesize });
    });
    
    ffmpeg.on('error', () => resolve({ duration: null, resolution: null, filesize: null }));
  });
});

ipcMain.handle('get-local-thumbnail', async (event, filePath) => {
  return new Promise((resolve) => {
    const thumbDir = path.join(app.getPath('userData'), 'thumbnails');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    const filename = `thumb_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const outputPath = path.join(thumbDir, filename);

    const ffmpeg = spawn(currentFfmpegPath, [
      '-ss', '00:00:05',
      '-i', filePath,
      '-vframes', '1',
      '-q:v', '2',
      '-y',
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(`file://${outputPath}`);
      } else {
        const ffmpegFallback = spawn(currentFfmpegPath, [
          '-ss', '00:00:01',
          '-i', filePath,
          '-vframes', '1',
          '-q:v', '2',
          '-y',
          outputPath
        ]);
        ffmpegFallback.on('close', (codeFallback) => {
          if (codeFallback === 0 && fs.existsSync(outputPath)) {
             resolve(`file://${outputPath}`);
          } else {
             resolve(null);
          }
        });
      }
    });
  });
});

ipcMain.handle('minimize-window', () => mainWindow.minimize());
ipcMain.handle('maximize-window', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.handle('close-window', () => mainWindow.close());

// Fetches thumbnail URLs for playlist entries in parallel batches.
// Uses yt-dlp --print thumbnail which is much faster than --dump-json.
// Sends 'playlist-thumbnails-progress' events as each batch finishes.
ipcMain.handle('get-entry-thumbnails', async (event, entries) => {
  // entries: [{index, url}, ...]
  const BATCH_SIZE = 5;
  const TIMEOUT_MS = 20000;
  const allResults = [];

  const fetchOne = ({ index, url }) => new Promise((resolve) => {
    const ytDlp = spawn(currentYtDlpPath, [
      '--print', 'thumbnail',
      '--no-playlist',
      '--no-warnings',
      url
    ]);
    let output = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      ytDlp.kill();
      resolve({ index, thumbnail: null });
    }, TIMEOUT_MS);

    ytDlp.stdout.on('data', d => { output += d.toString(); });
    ytDlp.on('close', () => {
      if (killed) return;
      clearTimeout(timer);
      const thumbnail = output.trim() || null;
      resolve({ index, thumbnail });
    });
    ytDlp.on('error', () => {
      clearTimeout(timer);
      resolve({ index, thumbnail: null });
    });
  });

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(fetchOne));
    allResults.push(...batchResults);
    // Send progress so renderer can update thumbnails as they arrive
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('playlist-thumbnails-progress', batchResults);
    }
  }

  return allResults;
});

ipcMain.handle('trim-video', async (event, { inputPath, outputPath, startTime, duration }) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-ss', startTime.toString(),
      '-i', inputPath,
      '-t', duration.toString(),
      '-c', 'copy',
      outputPath
    ];
    const ffmpeg = spawn(currentFfmpegPath, args);
    let errOutput = '';
    ffmpeg.stderr.on('data', d => { errOutput += d.toString(); });
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve({ success: true, path: outputPath });
      else reject(new Error('ffmpeg failed: ' + errOutput));
    });
    ffmpeg.on('error', (err) => {
      reject(new Error('Failed to spawn ffmpeg. Make sure it is installed in PATH. ' + err.message));
    });
  });
});

