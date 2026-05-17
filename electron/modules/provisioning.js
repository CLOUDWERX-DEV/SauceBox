const { ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const extract = require('extract-zip');
const { spawn } = require('child_process');

const BINARY_DIR = path.join(app.getPath('userData'), 'binaries');
const DOWNLOAD_TIMEOUT_MS = 120000;

function ensureDir() {
  if (!fs.existsSync(BINARY_DIR)) {
    fs.mkdirSync(BINARY_DIR, { recursive: true });
  }
}

function getSystemInfo() {
  const platform = process.platform;
  const arch = process.arch;
  return { platform, arch };
}

function getFfmpegUrl(platform, arch) {
  let ffbinariesKey = '';
  if (platform === 'win32') {
    ffbinariesKey = arch === 'x64' ? 'windows-64' : 'windows-64';
  } else if (platform === 'darwin') {
    ffbinariesKey = 'osx-64'; // They only provide osx-64 right now, it runs via rosetta on M1 if not universal
  } else if (platform === 'linux') {
    if (arch === 'arm64') ffbinariesKey = 'linux-arm64';
    else if (arch === 'arm') ffbinariesKey = 'linux-armel';
    else ffbinariesKey = 'linux-64';
  }
  return new Promise((resolve, reject) => {
    https.get('https://ffbinaries.com/api/v1/version/latest', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.bin[ffbinariesKey].ffmpeg);
        } catch (e) {
          reject('Failed to parse ffbinaries JSON');
        }
      });
    }).on('error', reject);
  });
}

function getYtdlpUrl(platform) {
  if (platform === 'win32') return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  if (platform === 'darwin') return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
  return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
}

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') {
        reject(new Error('Binary downloads must use HTTPS'));
        return;
      }
    } catch (error) {
      reject(new Error('Invalid download URL'));
      return;
    }

    const tempDest = `${dest}.download`;
    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        request.destroy();
        return downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with HTTP ${response.statusCode}`));
        response.resume();
        return;
      }
      
      const file = fs.createWriteStream(tempDest);
      const len = parseInt(response.headers['content-length'], 10);
      let cur = 0;

      response.pipe(file);
      response.on('data', (chunk) => {
        cur += chunk.length;
        if (onProgress && len) {
          onProgress(cur, len);
        }
      });

      file.on('finish', () => {
        file.close(() => {
          fs.rename(tempDest, dest, (renameError) => {
            if (renameError) reject(renameError);
            else resolve(dest);
          });
        });
      });
      file.on('error', (err) => {
        fs.unlink(tempDest, () => reject(err));
      });
    }).on('error', (err) => {
      fs.unlink(tempDest, () => reject(err));
    });
    request.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
      request.destroy(new Error('Download timed out'));
    });
  });
}

function setupProvisioningHandlers() {
  ipcMain.handle('check-managed-binaries', async () => {
    const platform = process.platform;
    const ytdlpName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    
    const ytPath = path.join(BINARY_DIR, ytdlpName);
    const ffPath = path.join(BINARY_DIR, ffmpegName);
    
    const missing = [];
    if (!fs.existsSync(ytPath)) missing.push('yt-dlp');
    if (!fs.existsSync(ffPath)) missing.push('ffmpeg');
    
    return {
      allPresent: missing.length === 0,
      missing,
      managedPaths: {
        ytdlpPath: fs.existsSync(ytPath) ? ytPath : null,
        ffmpegPath: fs.existsSync(ffPath) ? ffPath : null,
      }
    };
  });

  ipcMain.handle('download-managed-binaries', async (event) => {
    ensureDir();
    const { platform, arch } = getSystemInfo();
    const isWin = platform === 'win32';
    
    const ytdlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    
    const ytDest = path.join(BINARY_DIR, ytdlpName);
    const ffmpegZip = path.join(BINARY_DIR, 'ffmpeg.zip');
    const ffmpegDest = path.join(BINARY_DIR, ffmpegName);

    const sendLog = (msg) => event.sender.send('provision-log', msg);

    try {
      // 1. Download yt-dlp
      if (!fs.existsSync(ytDest)) {
        sendLog('Locating latest yt-dlp release...');
        const ytUrl = getYtdlpUrl(platform);
        sendLog(`Downloading yt-dlp from ${ytUrl}...`);
        await downloadFile(ytUrl, ytDest, (cur, len) => {
          event.sender.send('provision-progress', { tool: 'yt-dlp', progress: (cur / len) * 100, cur, len });
        });
        if (!isWin) fs.chmodSync(ytDest, 0o755);
        sendLog('yt-dlp downloaded successfully.');
      } else {
        sendLog('yt-dlp already exists.');
      }

      // 2. Download ffmpeg
      if (!fs.existsSync(ffmpegDest)) {
        sendLog('Locating ffmpeg release...');
        const ffUrl = await getFfmpegUrl(platform, arch);
        sendLog(`Downloading ffmpeg from ${ffUrl}...`);
        await downloadFile(ffUrl, ffmpegZip, (cur, len) => {
          event.sender.send('provision-progress', { tool: 'ffmpeg', progress: (cur / len) * 100, cur, len });
        });
        
        sendLog('Extracting ffmpeg...');
        await extract(ffmpegZip, { dir: BINARY_DIR });
        fs.unlinkSync(ffmpegZip); // Cleanup zip
        if (!isWin) {
          // ensure executable
          if (fs.existsSync(ffmpegDest)) fs.chmodSync(ffmpegDest, 0o755);
        }
        sendLog('ffmpeg extracted successfully.');
      } else {
        sendLog('ffmpeg already exists.');
      }

      return { success: true, paths: { ytdlpPath: ytDest, ffmpegPath: ffmpegDest } };
    } catch (err) {
      console.error(err);
      sendLog(`Error: ${err.message || err}`);
      return { success: false, error: err.message || err };
    }
  });

  ipcMain.handle('update-managed-ytdlp', async (event) => {
    const platform = process.platform;
    const ytdlpName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytPath = path.join(BINARY_DIR, ytdlpName);
    
    if (!fs.existsSync(ytPath)) return { success: false, error: 'yt-dlp not found' };
    
    return new Promise((resolve) => {
      const proc = spawn(ytPath, ['-U']);
      let out = '';
      proc.stdout.on('data', d => out += d.toString());
      proc.stderr.on('data', d => out += d.toString());
      
      proc.on('close', code => {
        resolve({ success: code === 0, log: out });
      });
      proc.on('error', err => {
        resolve({ success: false, log: err.message, error: err.message });
      });
    });
  });
}

module.exports = { setupProvisioningHandlers, BINARY_DIR };
