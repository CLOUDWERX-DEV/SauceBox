import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

import { useStore } from './store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function App() {
  const [activeTab, setActiveTab] = useState('download');
  const downloads = useStore(state => state.downloads);
  const maxConcurrentDownloads = useStore(state => state.settings.maxConcurrentDownloads);
  const updateDownload = useStore(state => state.updateDownload);

  useEffect(() => {
    if (ipcRenderer) {
      const progressHandler = (event, data) => {
        const download = useStore.getState().downloads.find(d => d.id === data.id);
        if (download) {
          useStore.getState().updateDownload(download.id, { 
            progress: data.progress, 
            status: data.status 
          });
          
          if (data.status === 'completed') {
            useStore.getState().addToHistory(download);
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
      
      ipcRenderer.on('download-progress', progressHandler);
      ipcRenderer.on('download-speed', speedHandler);
      ipcRenderer.on('download-eta', etaHandler);
      
      return () => {
        ipcRenderer.removeListener('download-progress', progressHandler);
        ipcRenderer.removeListener('download-speed', speedHandler);
        ipcRenderer.removeListener('download-eta', etaHandler);
      };
    }
  }, []);

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
          
          await ipcRenderer?.invoke('download-video', { id: d.id, url: d.url, resume: d.isRetry });
        } catch (err) {
          console.error(err);
          updateDownload(d.id, { status: 'failed' });
        }
      });
    }
  }, [downloads, maxConcurrentDownloads, updateDownload]);

  return (
    <View style={styles.container}>
      <TitleBar />
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
