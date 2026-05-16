const { ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const state = require('../state');

function setupDownloaderHandlers() {
  ipcMain.handle('download-video', async (event, { id, url, outputPath, resume = false, speedLimit, container = 'mp4', proxy, quality = 'best' }) => {
    console.log('Starting download for:', url, 'Resume:', resume, 'ID:', id, 'Quality:', quality);
    return new Promise((resolve, reject) => {
      const downloadsDir = outputPath || path.join(os.homedir(), 'Downloads', 'SauceBox');
      
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
        console.log('Created download directory');
      }

      let formatArgs = [];
      const qualityHeight = (quality && quality !== 'best')
        ? String(quality).replace(/p$/i, '')
        : null;

      let videoQualityStr;
      let fallbackStr;

      if (qualityHeight) {
        videoQualityStr = `${qualityHeight}p/bestvideo[height<=${qualityHeight}]+bestaudio/best[height<=${qualityHeight}]/best`;
      } else {
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
        formatArgs = ['-f', videoQualityStr, '--merge-output-format', 'mp4'];
      }

      const extTemplate = container === 'any' ? '%(ext)s' : container;
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
        '--replace-in-metadata', 'title,uploader,channel,creator', '\\+', ' ',
        '--no-mtime',
      ];
      
      if (resume) {
        args.push('--continue');
        args.push('--no-overwrites');
      }
      
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

      const ytDlp = spawn(state.ytDlpPath, args);
      state.activeDownloads.set(id, { process: ytDlp, killedByUser: false });

      let progress    = '';
      let stderrBuf   = '';
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

          if (hasUpdate && state.mainWindow) {
            state.mainWindow.webContents.send('download-progress', payload);
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
        const downloadInfo = state.activeDownloads.get(id);

        if (downloadInfo && downloadInfo.killedByUser) {
          state.mainWindow.webContents.send('download-progress', { id, status: 'paused' });
          state.activeDownloads.delete(id);
          return resolve({ success: false, paused: true });
        }

        state.activeDownloads.delete(id);

        const isRenameOnlyFailure = code !== 0
          && stderrBuf.includes('Unable to rename file')
          && (() => {
              const m = stderrBuf.match(/Unable to rename file:.*?->\s*'([^']+)'/);
              return m && fs.existsSync(m[1]);
            })();

        if (code === 0 || isRenameOnlyFailure) {
          if (isRenameOnlyFailure) {
            console.log('yt-dlp rename-only failure detected');
          }
          state.mainWindow.webContents.send('download-progress', {
            id, progress: 100, status: 'completed'
          });
          resolve({ success: true, path: downloadsDir });
        } else {
          state.mainWindow.webContents.send('download-progress', {
            id, progress: 0, status: 'failed'
          });
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });
    });
  });

  ipcMain.handle('pause-download', async (event, id) => {
    const downloadInfo = state.activeDownloads.get(id);
    if (downloadInfo) {
      console.log('Pausing download ID:', id);
      downloadInfo.killedByUser = true;
      downloadInfo.process.kill();
      return true;
    }
    return false;
  });
}

module.exports = { setupDownloaderHandlers };
