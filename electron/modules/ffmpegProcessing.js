const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const state = require('../state');

function setupFfmpegHandlers() {
  ipcMain.handle('get-local-metadata', async (event, filePath) => {
    return new Promise((resolve) => {
      const ffmpeg = spawn(state.ffmpegPath, ['-i', filePath]);
      let output = '';

      ffmpeg.stderr.on('data', d => { output += d.toString(); });

      ffmpeg.on('close', () => {
        let duration = null;
        let resolution = null;

        const durMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.\d{2}/);
        if (durMatch) {
          duration = parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60 + parseInt(durMatch[3], 10);
        }

        const resMatch = output.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
        if (resMatch) {
          const h = parseInt(resMatch[2], 10);
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

      const ffmpeg = spawn(state.ffmpegPath, [
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
          const ffmpegFallback = spawn(state.ffmpegPath, [
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

  ipcMain.handle('trim-video', async (event, { inputPath, outputPath, startTime, duration }) => {
    return new Promise((resolve, reject) => {
      const parseHMS = (str) => {
        const parts = str.toString().split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0] || 0;
      };
      const startSec = parseHMS(startTime);
      const durationSec = parseFloat(duration);
      const endSec = startSec + durationSec;

      const args = [
        '-y',
        '-i', inputPath,
        '-ss', startSec.toString(),
        '-to', endSec.toString(),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        '-map', '0',
        outputPath
      ];

      const proc = spawn(state.ffmpegPath, args);
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
}

module.exports = { setupFfmpegHandlers };
