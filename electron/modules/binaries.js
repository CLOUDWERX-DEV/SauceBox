const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const state = require('../state');

function setupBinaryHandlers() {
  ipcMain.on('update-binary-paths', (event, { ytdlpPath, ffmpegPath }) => {
    state.ytDlpPath = ytdlpPath || 'yt-dlp';
    state.ffmpegPath = ffmpegPath || 'ffmpeg';
    console.log('Updated binary paths:', { ytdlpPath: state.ytDlpPath, ffmpegPath: state.ffmpegPath });
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
      getVersion(state.ytDlpPath, '--version'),
      getVersion(state.ffmpegPath, '-version')
    ]);

    return { ytDlp: ytVersion, ffmpeg: ffmpegVersion };
  });
}

module.exports = { setupBinaryHandlers };
