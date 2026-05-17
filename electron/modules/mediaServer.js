const { ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const express = require('express');
const serveIndex = require('serve-index');
const basicAuth = require('basic-auth');
const { spawn } = require('child_process');
const state = require('../state');

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

function setupMediaServerHandlers() {
  ipcMain.handle('get-local-ip', () => getLocalIp());

  ipcMain.handle('save-stream-playlist', async (event, { playlist, serverName, localIp, port, downloadPath, transcodeEnabled }) => {
    if (!Array.isArray(playlist) || playlist.length === 0) {
      return { success: false, error: 'Playlist is empty' };
    }

    const servePath = downloadPath || path.join(os.homedir(), 'Downloads', 'SauceBox');
    let m3u = '#EXTM3U\n';
    m3u += `#PLAYLIST:${serverName || 'SauceBox Media Server'}\n`;

    for (const item of playlist) {
      const tagLine = item.tags && item.tags.length > 0 ? ` group-title="${item.tags[0]}"` : ' group-title="SauceBox"';
      let thumbUrl = '';
      let extArt = '';
      if (item.thumbnail) {
        const thumbName = path.basename(item.thumbnail);
        const fullThumbUrl = `http://${localIp}:${port}/${encodeURIComponent(thumbName)}`;
        thumbUrl = ` tvg-logo="${fullThumbUrl}"`;
        extArt = `#EXTART:${fullThumbUrl}\n`;
      }
      m3u += `#EXTINF:${Math.round(item.duration || -1)}${tagLine}${thumbUrl},${item.title}\n`;
      if (extArt) m3u += extArt;
      const filename = path.basename(item.path || '');
      const urlSuffix = transcodeEnabled ? '?transcode=1' : '';
      m3u += `http://${localIp}:${port}/${encodeURIComponent(filename)}${urlSuffix}\n`;
    }

    try {
      fs.mkdirSync(servePath, { recursive: true });
      const m3uPath = path.join(servePath, 'stream.m3u');
      fs.writeFileSync(m3uPath, m3u, 'utf8');
      return { success: true, path: m3uPath, url: `http://${localIp}:${port}/stream.m3u` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

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
            if (state.mainWindow) {
              const ip = req.ip || req.socket.remoteAddress;
              const logKey = `${ip}-${req.path}`;
              const now = Date.now();
              
              if (!recentLogs.has(logKey) || now - recentLogs.get(logKey) > 10000) {
                recentLogs.set(logKey, now);
                state.mainWindow.webContents.send('broadcast-log', {
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
              ffmpegProc.stderr.on('data', () => {});

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
}

module.exports = { setupMediaServerHandlers };
