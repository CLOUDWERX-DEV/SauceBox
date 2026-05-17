import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import AppLock from './components/AppLock';
import BootScreen from './components/BootScreen';
import logoSrc from '../public/logo.png';

import { useStore } from './store';
import VideoPlayer from './components/VideoPlayer';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function App() {
  const [activeTab, setActiveTab] = useState('download');
  const downloads = useStore(state => state.downloads);
  const maxConcurrentDownloads = useStore(state => state.settings.maxConcurrentDownloads);
  const updateDownload = useStore(state => state.updateDownload);
  const [isUnlocked, setIsUnlocked] = useState(() => !useStore.getState().settings.vaultEnabled);
  const vaultEnabled = useStore(state => state.settings.vaultEnabled);
  const stealthHotkey = useStore(state => state.settings.stealthHotkey);
  const autoStartBroadcast = useStore(state => state.settings.autoStartBroadcast);
  const quickCastVideo = useStore(state => state.quickCastVideo);
  const activeBuiltinVideo = useStore(state => state.activeBuiltinVideo);
  const setActiveBuiltinVideo = useStore(state => state.setActiveBuiltinVideo);
  
  const [isBooting, setIsBooting] = useState(true);
  const [needsProvisioning, setNeedsProvisioning] = useState(false);

  // Engine Provisioning Check
  useEffect(() => {
    const checkStartup = async () => {
      const currentSettings = useStore.getState().settings;
      const mode = currentSettings.binaryManagementMode || 'managed';

      if (mode === 'managed') {
        const info = await ipcRenderer?.invoke('check-managed-binaries');
        if (!info || !info.allPresent) {
          setNeedsProvisioning(true);
          return; // Stay in booting state, BootScreen will render
        } else {
          // Check for auto update quietly in background
          if (currentSettings.autoUpdateBinaries !== false) {
            ipcRenderer?.invoke('update-managed-ytdlp').catch(() => {});
          }
          await ipcRenderer?.send('update-binary-paths', {
            ytdlpPath: info.managedPaths.ytdlpPath,
            ffmpegPath: info.managedPaths.ffmpegPath
          });
        }
      } else {
        await ipcRenderer?.send('update-binary-paths', {
          ytdlpPath: mode === 'system' ? '' : currentSettings.ytdlpPath,
          ffmpegPath: mode === 'system' ? '' : currentSettings.ffmpegPath
        });
      }
      setIsBooting(false);
    };

    if (ipcRenderer) checkStartup();
    else setIsBooting(false);
  }, []);
  
  useEffect(() => {
    if (quickCastVideo) {
      setActiveTab('broadcast');
    }
  }, [quickCastVideo]);

  useEffect(() => {
    if (ipcRenderer && stealthHotkey) {
      ipcRenderer.send('register-stealth-hotkey', stealthHotkey);
    }
  }, [stealthHotkey]);

  useEffect(() => {
    if (ipcRenderer) {
      const externalAddHandler = async (event, url) => {
        const store = useStore.getState();
        
        // Check for duplicates in history
        const existingDownload = store.history.find(h => h.url === url);
        if (existingDownload) {
          const confirmDownload = window.confirm(
            `You already downloaded this video on ${new Date(existingDownload.timestamp).toLocaleDateString()}!\n\n` +
            `Title: ${existingDownload.title}\n\nDo you want to download it again?`
          );
          if (!confirmDownload) return;
        }

        // Add a temporary entry so the UI responds immediately
        store.addDownload({ url, title: 'Fetching metadata...' });
        
        try {
          const info = await ipcRenderer?.invoke('get-video-info', url);
          const settings = useStore.getState().settings;
          const settingsQualityHeight = settings.quality !== 'best'
            ? String(settings.quality).replace(/p$/i, '')
            : null;

          const bestAvailHeight = Array.isArray(info?.availableQualities) && info.availableQualities.length > 0
            ? info.availableQualities[0]
            : null;

          const resolutionHint = settingsQualityHeight
            ? `${settingsQualityHeight}p`
            : (bestAvailHeight ? `${bestAvailHeight}p` : null);

          // Find the temp entry and update it
          const currentStore = useStore.getState();
          const target = currentStore.downloads.find(d => d.url === url && d.title === 'Fetching metadata...');
          if (target) {
            currentStore.updateDownload(target.id, {
              title: info?.title || 'Unknown Title',
              thumbnail: info?.thumbnail,
              duration: info?.duration,
              uploader: info?.uploader,
              resolution: resolutionHint,
              format: info?.format,
              filesize: info?.filesize,
              quality: settingsQualityHeight || 'best'
            });
          }
        } catch (e) {
          console.error("Failed to fetch info for external url:", e);
          const currentStore = useStore.getState();
          const target = currentStore.downloads.find(d => d.url === url && d.title === 'Fetching metadata...');
          if (target) {
            currentStore.updateDownload(target.id, {
              title: url,
              quality: currentStore.settings.quality || 'best'
            });
          }
        }
      };
      
      const panicStealthHandler = () => {
        setIsUnlocked(false);
        const store = useStore.getState();
        if (store.settings.stealthPauseDownloads) {
          store.downloads.forEach(d => {
            if (d.status === 'downloading') {
              ipcRenderer.invoke('pause-download', d.id);
              store.updateDownload(d.id, { status: 'paused', speed: null, eta: null });
            }
          });
        }
      };

      const progressHandler = async (event, data) => {
        const store = useStore.getState();
        const download = store.downloads.find(d => d.id === data.id);
        if (download) {
          store.updateDownload(download.id, { 
            ...(data.progress !== undefined && { progress: data.progress }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.speed !== undefined && { speed: data.speed }),
            ...(data.eta !== undefined && { eta: data.eta })
          });
          
          const canNotify = () => {
            const currentStore = useStore.getState();
            if (!currentStore.settings.systemNotifications) return false;
            // If vault is enabled and app is locked (in stealth/panic), check mute setting
            if (currentStore.settings.vaultEnabled && !isUnlocked && currentStore.settings.stealthMuteNotifications) return false;
            return true;
          };

          if (data.status === 'completed') {
            const currentSettings = store.settings;
            try {
              const videoPath = await ipcRenderer?.invoke('get-video-path', {
                filename: `${download.title}.mp4`,
                downloadPath: currentSettings.downloadPath,
              });
              if (videoPath) {
                const meta = await ipcRenderer?.invoke('get-local-metadata', videoPath);
                // Build the real-metadata update object — override whatever yt-dlp
                // reported at queue time with what ffmpeg actually sees in the file.
                const realMeta = { path: videoPath };
                if (meta?.resolution)              realMeta.resolution = meta.resolution;
                if (meta?.filesize)                realMeta.filesize   = meta.filesize;
                if (meta?.duration && !download.duration) realMeta.duration = meta.duration;
                // Push into store so the Queue card updates its displayed values immediately
                store.updateDownload(download.id, realMeta);
                // Also update local copy so addToHistory gets the corrected data
                Object.assign(download, realMeta);
              }
            } catch (e) {}
            if (currentSettings.autoTagDomainUploader) {
              const generatedTags = [];
              try {
                const urlObj = new URL(download.url);
                let domain = urlObj.hostname.replace('www.', '');
                // Try to get just the main name (e.g. pornhub.com -> pornhub)
                domain = domain.substring(0, domain.lastIndexOf('.'));
                if (domain) {
                  const formattedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
                  generatedTags.push(formattedDomain);
                }
              } catch (e) {}
              download.tags = [...new Set([...(download.tags || []), ...generatedTags])];
            }
            store.addToHistory(download);
            
            if (canNotify() && window.Notification) {
              new Notification('Download Complete', {
                body: `${download.title} has finished downloading.`,
                icon: logoSrc
              });
            }

            if (store.settings.autoClearCompleted) {
              store.removeDownload(download.id);
            }
          } else if (data.status === 'failed') {
            if (canNotify() && window.Notification) {
              new Notification('Download Failed', {
                body: `${download.title} failed to download.`,
                icon: logoSrc
              });
            }
          }
        }
      };
      
      const broadcastLogHandler = (event, log) => {
        useStore.getState().addBroadcastLog(log);
      };
      
      ipcRenderer.on('external-add-url', externalAddHandler);
      ipcRenderer.on('panic-stealth', panicStealthHandler);
      ipcRenderer.on('download-progress', progressHandler);
      ipcRenderer.on('broadcast-log', broadcastLogHandler);
      
      return () => {
        ipcRenderer.removeListener('external-add-url', externalAddHandler);
        ipcRenderer.removeListener('panic-stealth', panicStealthHandler);
        ipcRenderer.removeListener('download-progress', progressHandler);
        ipcRenderer.removeListener('broadcast-log', broadcastLogHandler);
      };
    }
  }, [isUnlocked]);

  // On App Mount, reset any "downloading" items that got stuck because the app was closed
  useEffect(() => {
    const currentDownloads = useStore.getState().downloads;
    currentDownloads.forEach(d => {
      if (d.status === 'downloading') {
        useStore.getState().updateDownload(d.id, { status: 'paused', speed: null, eta: null });
      }
    });

    // Check if we should auto-start the broadcast server on app launch
    const currentSettings = useStore.getState().settings;
    if (currentSettings.autoStartBroadcast) {
      const config = {
        port: parseInt(currentSettings.broadcastPort, 10) || 6969,
        authEnabled: currentSettings.broadcastAuth || false,
        username: currentSettings.broadcastUsername || 'admin',
        password: currentSettings.broadcastPassword || '',
        dlnaEnabled: currentSettings.broadcastDlna !== false,
        transcodeEnabled: currentSettings.broadcastTranscode || false,
        downloadPath: currentSettings.downloadPath,
        ffmpegPath: currentSettings.ffmpegPath
      };
      if (ipcRenderer) {
        ipcRenderer.invoke('start-media-server', config).then(res => {
           if (res && res.success) {
             useStore.getState().setServerStatus({ running: true, url: `http://${res.ip || '127.0.0.1'}:${config.port}` });
           }
        }).catch(err => console.error(err));
      }
    } else {
      // If we shouldn't auto-start, forcefully reset the persisted serverStatus state
      useStore.getState().setServerStatus({ running: false, url: null });
    }
  }, []);

  // Queue Manager
  useEffect(() => {
    const activeDownloads = downloads.filter(d => d.status === 'downloading').length;
    const queuedDownloads = downloads.filter(d => d.status === 'queued');
    
    const max = maxConcurrentDownloads || 0;
    
    let availableSlots = max === 0 ? queuedDownloads.length : max - activeDownloads;
    
    if (availableSlots > 0 && queuedDownloads.length > 0) {
      const toStart = queuedDownloads.slice(0, availableSlots);
      toStart.forEach(async d => {
        // Set to starting/downloading immediately to prevent double-starts
        updateDownload(d.id, { status: 'downloading', isRetry: false });
        
        try {
          if (!d.resolution || !d.uploader || d.uploader === 'Unknown') {
            try {
              const info = await ipcRenderer?.invoke('get-video-info', d.url);
              // Only update fields that were missing at queue time.
              // NEVER touch resolution here — it is set correctly at queue time from
              // the selected quality or availableQualities. Overwriting it with
              // get-video-info data would show the best-format dimensions (e.g. "1920x1080")
              // instead of the actually selected quality.
              updateDownload(d.id, {
                uploader:  info.uploader  || d.uploader,
                format:    info.format    || d.format,
                filesize:  info.filesize  || info.filesize_approx || d.filesize,
                duration:  info.duration  || d.duration,
                thumbnail: info.thumbnail || d.thumbnail,
              });
            } catch (e) {
              console.warn('Could not fetch rich video info before download', e);
            }
          }
          
          const currentSettings = useStore.getState().settings;
          const os = window.require ? window.require('os') : null;
          const defaultPath = os ? `${os.homedir()}/Downloads/SauceBox` : '';
          const checkPath = currentSettings.downloadPath || defaultPath;
          
          if (currentSettings.minFreeSpaceGB > 0 && checkPath) {
            try {
              const diskSpace = await ipcRenderer?.invoke('get-disk-space', checkPath);
              if (diskSpace && diskSpace.success && diskSpace.free < currentSettings.minFreeSpaceGB * 1024 * 1024 * 1024) {
                updateDownload(d.id, { status: 'failed', error: `Disk space low (<${currentSettings.minFreeSpaceGB}GB)` });
                if (currentSettings.systemNotifications && window.Notification) {
                  new Notification('Download Stopped', { body: `Disk space is critically low. (${currentSettings.minFreeSpaceGB}GB minimum)` });
                }
                return; // Stop here, don't download
              }
            } catch (e) {
              console.warn('Could not check disk space', e);
            }
          }

          await ipcRenderer?.invoke('download-video', { 
            id: d.id, 
            url: d.url, 
            resume: d.isRetry,
            speedLimit: currentSettings.downloadSpeedLimit,
            container: currentSettings.preferredContainer,
            proxy: currentSettings.proxyString,
            outputPath: currentSettings.downloadPath,
            quality: d.quality || currentSettings.quality || 'best',
          });
        } catch (err) {
          console.error(err);
          updateDownload(d.id, { status: 'failed' });
        }
      });
    }
  }, [downloads, maxConcurrentDownloads, updateDownload]);

  if (isBooting) {
    if (needsProvisioning) {
      return (
        <BootScreen onComplete={() => {
          ipcRenderer?.invoke('check-managed-binaries').then(info => {
            if (info && info.allPresent) {
               ipcRenderer?.send('update-binary-paths', {
                 ytdlpPath: info.managedPaths.ytdlpPath,
                 ffmpegPath: info.managedPaths.ffmpegPath
               });
            }
          });
          setIsBooting(false);
        }} />
      );
    }
    return <View style={styles.container}><TitleBar /></View>;
  }

  if (vaultEnabled && !isUnlocked) {
    return (
      <View style={styles.container}>
        <TitleBar />
        <AppLock onUnlock={() => setIsUnlocked(true)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TitleBar vaultEnabled={vaultEnabled} onLock={() => setIsUnlocked(false)} />
      <View style={styles.content}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <MainContent activeTab={activeTab} onNavigate={setActiveTab} />
      </View>
      <VideoPlayer 
        visible={!!activeBuiltinVideo}
        videoPath={activeBuiltinVideo?.path}
        videoTitle={activeBuiltinVideo?.title}
        originalItem={activeBuiltinVideo}
        onClose={() => setActiveBuiltinVideo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 'calc(100vh - 40px)',
  }
});
