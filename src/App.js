import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import AppLock from './components/AppLock';

import { useStore } from './store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function App() {
  const [activeTab, setActiveTab] = useState('download');
  const downloads = useStore(state => state.downloads);
  const maxConcurrentDownloads = useStore(state => state.settings.maxConcurrentDownloads);
  const updateDownload = useStore(state => state.updateDownload);
  const [isUnlocked, setIsUnlocked] = useState(() => !useStore.getState().settings.vaultEnabled);
  const vaultEnabled = useStore(state => state.settings.vaultEnabled);
  const stealthHotkey = useStore(state => state.settings.stealthHotkey);

  useEffect(() => {
    if (ipcRenderer && stealthHotkey) {
      ipcRenderer.send('register-stealth-hotkey', stealthHotkey);
    }
  }, [stealthHotkey]);

  useEffect(() => {
    if (ipcRenderer) {
      const externalAddHandler = (event, url) => {
        useStore.getState().addDownload({ url, title: 'Fetching metadata...' });
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

      const progressHandler = (event, data) => {
        const store = useStore.getState();
        const download = store.downloads.find(d => d.id === data.id);
        if (download) {
          store.updateDownload(download.id, { 
            progress: data.progress, 
            status: data.status 
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
            if (currentSettings.autoTagDomainUploader) {
              const generatedTags = [];
              try {
                const urlObj = new URL(download.url);
                let domain = urlObj.hostname.replace('www.', '');
                // Try to get just the main name (e.g. pornhub.com -> pornhub)
                domain = domain.substring(0, domain.lastIndexOf('.'));
                if (domain) generatedTags.push(domain);
              } catch (e) {}
              if (download.uploader && download.uploader !== 'Unknown') {
                generatedTags.push(download.uploader);
              }
              download.tags = [...new Set([...(download.tags || []), ...generatedTags])];
            }
            store.addToHistory(download);
            
            if (canNotify() && window.Notification) {
              new Notification('Download Complete', {
                body: `${download.title} has finished downloading.`,
                icon: 'logo.png'
              });
            }

            if (store.settings.autoClearCompleted) {
              store.removeDownload(download.id);
            }
          } else if (data.status === 'failed') {
            if (canNotify() && window.Notification) {
              new Notification('Download Failed', {
                body: `${download.title} failed to download.`,
                icon: 'logo.png'
              });
            }
          }
        }
      };
      
      const speedHandler = (event, data) => {
        const download = useStore.getState().downloads.find(d => d.id === data.id);
        if (download) {
          useStore.getState().updateDownload(download.id, { speed: data.speed });
        }
      };
      
      const etaHandler = (event, data) => {
        const download = useStore.getState().downloads.find(d => d.id === data.id);
        if (download) {
          useStore.getState().updateDownload(download.id, { eta: data.eta });
        }
      };
      
      ipcRenderer.on('external-add-url', externalAddHandler);
      ipcRenderer.on('panic-stealth', panicStealthHandler);
      ipcRenderer.on('download-progress', progressHandler);
      ipcRenderer.on('download-speed', speedHandler);
      ipcRenderer.on('download-eta', etaHandler);
      
      return () => {
        ipcRenderer.removeListener('external-add-url', externalAddHandler);
        ipcRenderer.removeListener('panic-stealth', panicStealthHandler);
        ipcRenderer.removeListener('download-progress', progressHandler);
        ipcRenderer.removeListener('download-speed', speedHandler);
        ipcRenderer.removeListener('download-eta', etaHandler);
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
              updateDownload(d.id, {
                uploader: info.uploader || d.uploader,
                resolution: info.resolution || d.resolution,
                format: info.format || d.format,
                filesize: info.filesize || d.filesize,
                duration: info.duration || d.duration,
                thumbnail: info.thumbnail || d.thumbnail
              });
            } catch (e) {
              console.warn('Could not fetch rich video info before download', e);
            }
          }
          
          const currentSettings = useStore.getState().settings;
          const os = window.require ? window.require('os') : null;
          const defaultPath = os ? `${os.homedir()}/Downloads/LocalFap` : '';
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
            outputPath: currentSettings.downloadPath
          });
        } catch (err) {
          console.error(err);
          updateDownload(d.id, { status: 'failed' });
        }
      });
    }
  }, [downloads, maxConcurrentDownloads, updateDownload]);

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
        <MainContent activeTab={activeTab} />
      </View>
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
