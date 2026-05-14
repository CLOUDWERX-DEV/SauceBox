const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const express = require('express');
const serveIndex = require('serve-index');
const basicAuth = require('basic-auth');

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

let mediaServerApp = null;
let mediaServerInstance = null;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

ipcMain.handle('get-local-ip', () => getLocalIp());

ipcMain.handle('start-media-server', async (event, config) => {
  if (mediaServerInstance) {
    mediaServerInstance.close();
  }
  
  return new Promise((resolve, reject) => {
    mediaServerApp = express();
    
    if (config.authEnabled && config.username) {
      mediaServerApp.use((req, res, next) => {
        const user = basicAuth(req);
        if (!user || user.name !== config.username || user.pass !== config.password) {
          res.set('WWW-Authenticate', 'Basic realm="SauceBox Media Server"');
          return res.status(401).send('Authentication required.');
        }
        next();
      });
    }

    const recentLogs = new Map();

    mediaServerApp.use((req, res, next) => {
      if (req.path !== '/' && req.path !== '/favicon.ico') {
        const ext = path.extname(req.path).toLowerCase();
        if (['.m3u', '.mp4', '.mkv', '.webm', '.jpg', '.jpeg', '.png'].includes(ext)) {
          if (mainWindow) {
            const ip = req.ip || req.socket.remoteAddress;
            const logKey = `${ip}-${req.path}`;
            const now = Date.now();
            
            if (!recentLogs.has(logKey) || now - recentLogs.get(logKey) > 10000) {
              recentLogs.set(logKey, now);
              mainWindow.webContents.send('broadcast-log', {
                time: now,
                ip: ip,
                file: decodeURIComponent(req.path.slice(1))
              });
            }
          }
        }
      }
      next();
    });

    const servePath = config.downloadPath || path.join(os.homedir(), 'Downloads', 'SauceBox');

    mediaServerApp.use((req, res, next) => {
      if (req.query.transcode === '1' && config.transcodeEnabled && config.ffmpegPath) {
        const ext = path.extname(req.path).toLowerCase();
        if (ext === '.mkv' || ext === '.webm' || ext === '.avi') {
          const filePath = path.join(servePath, decodeURIComponent(req.path));
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'video/mp4');
            // Allow seeking in the transcoded stream if possible, but fragmented MP4 is continuous
            const ffmpegArgs = [
              '-i', filePath,
              '-c:v', 'libx264',
              '-preset', 'ultrafast',
              '-tune', 'zerolatency',
              '-c:a', 'aac',
              '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
              '-f', 'mp4',
              'pipe:1'
            ];
            const ffmpegProc = spawn(config.ffmpegPath, ffmpegArgs);
            
            ffmpegProc.stdout.pipe(res);
            
            ffmpegProc.stderr.on('data', (d) => {
               // Silently drop ffmpeg logs to prevent console spam
            });

            req.on('close', () => {
              ffmpegProc.kill('SIGKILL');
            });
            return;
          }
        }
      }
      next();
    });

    mediaServerApp.use('/', express.static(servePath), serveIndex(servePath, { 'icons': true, 'view': 'details' }));

    try {
      mediaServerInstance = mediaServerApp.listen(config.port, '0.0.0.0', () => {
        resolve({ success: true, ip: getLocalIp() });
      }).on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

ipcMain.handle('stop-media-server', async () => {
  if (mediaServerInstance) {
    mediaServerInstance.close();
    mediaServerInstance = null;
  }
  return { success: true };
});

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

const activeDownloads = new Map();

ipcMain.handle('download-video', async (event, { id, url, outputPath, resume = false, speedLimit, container = 'mp4', proxy, quality = 'best' }) => {
  console.log('Starting download for:', url, 'Resume:', resume, 'ID:', id, 'Quality:', quality);
  return new Promise((resolve, reject) => {
    const downloadsDir = outputPath || path.join(os.homedir(), 'Downloads', 'SauceBox');
    console.log('Download directory:', downloadsDir);
    
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
      console.log('Created download directory');
    }

    let formatArgs = [];

    // Build quality-aware format selector.
    // Strip any trailing 'p' from quality (e.g. "720p" → "720") so height filters are valid.
    // yt-dlp format filters require bare numbers: [height<=720] not [height<=720p].
    const qualityHeight = (quality && quality !== 'best')
      ? String(quality).replace(/p$/i, '')
      : null;

    let videoQualityStr;
    let fallbackStr;

    if (qualityHeight) {
      // Format selector strategy for constrained quality:
      //
      // 1. Try the DIRECT FORMAT ID first (e.g. "480p").
      //    Sites like PornHub label their pre-muxed direct-download formats exactly this way
      //    ("240p", "480p", "720p", "1080p"). These formats have height=None in yt-dlp metadata
      //    (since they're pre-muxed and size isn't known until fetched), so height-based filters
      //    can't match them. But the format ID string matches perfectly.
      //
      // 2. Fall back to height-constrained DASH/HLS stream selection.
      //    bestvideo[height<=N]+bestaudio covers sites that offer separate video/audio streams.
      //
      // 3. Fall back to best pre-muxed stream at or below height N.
      //    Covers sites with combined streams that DO have height metadata.
      //
      // 4. Last resort: bare best. Prevents a hard download failure if nothing else matches.
      //    This is intentional — a successful download at wrong quality beats a failed download.
      videoQualityStr = `${qualityHeight}p/bestvideo[height<=${qualityHeight}]+bestaudio/best[height<=${qualityHeight}]/best`;
    } else {
      // 'best' quality: pick highest available video + best audio, no height cap.
      videoQualityStr = `bestvideo+bestaudio/best`;
    }

    if (container === 'mkv') {
      formatArgs = ['-f', videoQualityStr, '--merge-output-format', 'mkv'];
    } else if (container === 'webm') {
      if (qualityHeight) {
        fallbackStr = `${qualityHeight}p/bestvideo[height<=${qualityHeight}][ext=webm]+bestaudio[ext=webm]/best[height<=${qualityHeight}][ext=webm]/best[ext=webm]/best`;
      } else {
        fallbackStr = `bestvideo[ext=webm]+bestaudio[ext=webm]/best[ext=webm]/best`;
      }
      formatArgs = ['-f', fallbackStr, '--merge-output-format', 'webm'];
    } else if (container === 'any') {
      formatArgs = ['-f', videoQualityStr];
    } else {
      // mp4 (default): use the clean selector + remux to mp4
      formatArgs = ['-f', videoQualityStr, '--merge-output-format', 'mp4'];
    }

    const extTemplate = container === 'any' ? '%(ext)s' : container;

    // Output filename format: "Title [Uploader].ext"
    // This is intentional — the importer parses this exact format to auto-fill
    // title and creator fields when importing SauceBox-downloaded files.
    // %(uploader,channel,creator|Unknown)s uses the first non-empty of those fields.
    const outputTemplate = path.join(
      downloadsDir,
      `%(title)s [%(uploader,channel,creator|Unknown)s].${extTemplate}`
    );

    const args = [
      ...formatArgs,
      '-o', outputTemplate,
      '--newline',
      '--no-playlist',
      '--concurrent-fragments', '3',
      // Replace + signs in title/uploader metadata (some sites URL-encode spaces as +)
      '--replace-in-metadata', 'title,uploader,channel,creator', '\\+', ' ',
      // Prevent yt-dlp from touching the file modification time
      '--no-mtime',
      // NOTE: --no-restrict-filenames is intentionally NOT used — it causes yt-dlp's
      // internal .part temp-file rename to fail when the path contains !, ?, etc.
      // yt-dlp on Linux already preserves spaces and [brackets] without it.
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

    let progress    = '';
    let stderrBuf   = '';  // accumulate for post-exit analysis
    let lastSendTime = 0;
    ytDlp.stdout.on('data', (data) => {
      progress = data.toString();
      
      const now = Date.now();
      if (now - lastSendTime > 500) {
        lastSendTime = now;
        
        const payload = { id };
        let hasUpdate = false;
        
        const match = progress.match(/(\d+\.?\d*)%/);
        if (match) {
          payload.progress = parseFloat(match[1]);
          payload.status = 'downloading';
          hasUpdate = true;
        }
        
        const speedMatch = progress.match(/([\d.]+)(K|M|G)iB\/s/);
        if (speedMatch) {
          payload.speed = `${speedMatch[1]}${speedMatch[2]}iB/s`;
          hasUpdate = true;
        }
        
        const etaMatch = progress.match(/ETA\s+([\d:]+)/);
        if (etaMatch) {
          payload.eta = etaMatch[1];
          hasUpdate = true;
        }

        if (hasUpdate && mainWindow) {
          mainWindow.webContents.send('download-progress', payload);
        }
      }
    });

    ytDlp.stderr.on('data', (data) => {
      const line = data.toString();
      stderrBuf += line;
      console.error('yt-dlp stderr:', line);
    });

    ytDlp.on('close', (code) => {
      console.log('Download finished with code:', code, 'ID:', id);
      const downloadInfo = activeDownloads.get(id);

      if (downloadInfo && downloadInfo.killedByUser) {
        mainWindow.webContents.send('download-progress', { id, status: 'paused' });
        activeDownloads.delete(id);
        return resolve({ success: false, paused: true });
      }

      activeDownloads.delete(id);

      // yt-dlp sometimes exits with code 1 solely because it couldn't rename
      // the .part temp file — even though the final file is already on disk.
      // Detect this benign "rename-only" failure and treat it as success:
      //   stderr contains "Unable to rename file" AND the target .mp4 path exists.
      const isRenameOnlyFailure = code !== 0
        && stderrBuf.includes('Unable to rename file')
        && (() => {
            // Try to find the target path from the rename error line
            // Pattern: Unable to rename file: ... 'src' -> 'dst'
            const m = stderrBuf.match(/Unable to rename file:.*?->\s*'([^']+)'/);
            return m && fs.existsSync(m[1]);
          })();

      if (code === 0 || isRenameOnlyFailure) {
        if (isRenameOnlyFailure) {
          console.log('yt-dlp rename-only failure detected — file exists, treating as success');
        }
        mainWindow.webContents.send('download-progress', {
          id, progress: 100, status: 'completed'
        });
        resolve({ success: true, path: downloadsDir });
      } else {
        mainWindow.webContents.send('download-progress', {
          id, progress: 0, status: 'failed'
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

          // Extract distinct available video heights from the formats array so the
          // UI can show only quality options that actually exist for this video.
          let availableQualities = [];
          if (Array.isArray(info.formats)) {
            const heights = new Set();
            for (const fmt of info.formats) {
              // Only consider formats that carry video (not audio-only)
              if (fmt.height && fmt.height > 0 && fmt.vcodec && fmt.vcodec !== 'none') {
                heights.add(fmt.height);
              }
            }
            // Sort descending (e.g. [1080, 720, 480, 360, 240])
            availableQualities = Array.from(heights).sort((a, b) => b - a);
          }

          resolve({
            title: decodeHTMLEntities(info.title),
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader,
            // Only return resolution if yt-dlp gives us a clean 'Np' string (e.g. "1080p").
            // We intentionally do NOT return `${width}x${height}` because that value is always
            // the BEST available format's dimensions and misleads the UI into showing "1920x1080"
            // regardless of what quality the user actually selected.
            resolution: info.resolution && /^\d+p$/i.test(info.resolution) ? info.resolution : null,
            format: info.format_note || info.ext,
            filesize: info.filesize || info.filesize_approx,
            availableQualities,
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


ipcMain.handle('get-video-path', async (event, arg) => {
  // arg can be a plain filename string (legacy) or { filename, downloadPath }
  const filename   = typeof arg === 'string' ? arg : arg.filename;
  const customPath = typeof arg === 'string' ? null : arg.downloadPath;

  const defaultDir = path.join(os.homedir(), 'Downloads', 'SauceBox');

  // Build the ordered list of directories to search: configured path first, then default.
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

    // 1. Exact match
    const exactPath = path.join(dir, filename);
    if (fs.existsSync(exactPath)) return exactPath;

    // 2. Extension variants
    for (const ext of extensions) {
      const testPath = path.join(dir, baseName + ext);
      if (fs.existsSync(testPath)) return testPath;
    }

    // 3. Fuzzy match (handles yt-dlp filename sanitization differences)
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fileExt = path.extname(file);
      if (extensions.includes(fileExt)) {
        let fileBase = path.basename(file, fileExt);
        // Strip the trailing [Uploader] or [ID] bracket group before comparing
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

ipcMain.handle('open-video', async (event, payload) => {
  const { shell } = require('electron');
  
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
  const { shell } = require('electron');
  const folderPath = path.dirname(filepath);
  shell.showItemInFolder(filepath);
});

// Open URLs in the system default browser, not in Electron's internal window
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
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

ipcMain.handle('select-file', async (event, title) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
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
    // ffmpeg exits with code 1 when given -i with no output, but still dumps metadata to stderr
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

      // Match WxH from the Video stream line — handles any reasonable resolution
      // Looks for patterns like "854x480", "1280x720", "3840x2160", etc.
      const resMatch = output.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
      if (resMatch) {
        const w = parseInt(resMatch[1], 10);
        const h = parseInt(resMatch[2], 10);
        // Use height-only label (e.g. "480p") — matches how yt-dlp labels quality levels
        // and is more readable on gallery/queue cards than "854x480"
        resolution = `${h}p`;
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

// startTime = HH:MM:SS string, duration = seconds as string
ipcMain.handle('trim-video', async (event, { inputPath, outputPath, startTime, duration }) => {
  return new Promise((resolve, reject) => {
    // Calculate end time in seconds for -to flag
    const parseHMS = (str) => {
      const parts = str.toString().split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return parts[0] || 0;
    };
    const startSec = parseHMS(startTime);
    const durationSec = parseFloat(duration);
    const endSec = startSec + durationSec;

    // Correct arg order: -i first, then -ss/-to AFTER input so ffmpeg decodes
    // from the start to hit an exact keyframe. -c copy + -avoid_negative_ts
    // make_zero prevents timestamp corruption that breaks VLC and HTML5 playback.
    const args = [
      '-y',                              // overwrite without prompting
      '-i', inputPath,
      '-ss', startSec.toString(),
      '-to', endSec.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-map', '0',
      outputPath
    ];

    const proc = spawn(currentFfmpegPath, args);
    let errOutput = '';
    proc.stderr.on('data', d => { errOutput += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ success: true, path: outputPath });
      else reject(new Error('ffmpeg trim failed: ' + errOutput.slice(-500)));
    });
    proc.on('error', (err) => {
      reject(new Error('Failed to spawn ffmpeg. Is it installed in PATH? ' + err.message));
    });
  });
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

