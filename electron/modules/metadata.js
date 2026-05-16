const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const state = require('../state');
const { decodeHTMLEntities } = require('./utils');

function setupMetadataHandlers() {
  ipcMain.handle('get-video-info', async (event, url) => {
    console.log('Getting video info for:', url);
    return new Promise((resolve, reject) => {
      const ytDlp = spawn(state.ytDlpPath, ['--dump-json', '--no-playlist', url]);
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

            let availableQualities = [];
            if (Array.isArray(info.formats)) {
              const heights = new Set();
              for (const fmt of info.formats) {
                if (fmt.height && fmt.height > 0 && fmt.vcodec && fmt.vcodec !== 'none') {
                  heights.add(fmt.height);
                }
              }
              availableQualities = Array.from(heights).sort((a, b) => b - a);
            }

            resolve({
              title: decodeHTMLEntities(info.title),
              duration: info.duration,
              thumbnail: info.thumbnail,
              uploader: info.uploader,
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
      const ytDlp = spawn(state.ytDlpPath, ['--flat-playlist', '-J', '--no-warnings', url]);
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

  ipcMain.handle('get-entry-thumbnails', async (event, entries) => {
    const BATCH_SIZE = 5;
    const TIMEOUT_MS = 20000;
    const allResults = [];

    const fetchOne = ({ index, url }) => new Promise((resolve) => {
      const ytDlp = spawn(state.ytDlpPath, [
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
      if (state.mainWindow && !state.mainWindow.isDestroyed()) {
        state.mainWindow.webContents.send('playlist-thumbnails-progress', batchResults);
      }
    }

    return allResults;
  });
}

module.exports = { setupMetadataHandlers };
