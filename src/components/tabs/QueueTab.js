import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../../store';
import { theme } from '../../theme';
import ConfirmModal from '../ConfirmModal';

import { queueStyles as styles } from './Queue/QueueStyles';
import EmptyQueueState from './Queue/EmptyQueueState';
import DownloadCard from './Queue/DownloadCard';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function QueueTab({ onNavigate }) {
  const downloads = useStore(state => state.downloads);
  const settings  = useStore(state => state.settings);
  const updateDownload = useStore(state => state.updateDownload);
  const removeDownload = useStore(state => state.removeDownload);
  const clearQueue = useStore(state => state.clearQueue);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  const formatResolutionBadge = (res) => {
    if (!res) return '';
    if (res.includes('2160')) return '4K';
    if (res.includes('1440')) return '2K';
    return res;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    const num = Number(bytes);
    if (!num || isNaN(num)) return null;
    const mb = num / (1024 * 1024);
    const gb = num / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'downloading': return '⏬';
      case 'queued': return '⏳';
      case 'paused': return '⏸️';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'failed': return theme.colors.error;
      case 'downloading': return theme.colors.primary;
      case 'queued': return '#f39c12';
      case 'paused': return '#888888';
      default: return theme.colors.textSecondary;
    }
  };

  const handlePlayVideo = async (download) => {
    if (download.status !== 'completed') return;
    try {
      const videoPath = await ipcRenderer?.invoke('get-video-path', {
        filename: `${download.title}.mp4`,
        downloadPath: settings.downloadPath,
      });
      if (settings.customPlayerPath && settings.customPlayerPath.trim() !== '') {
        await ipcRenderer?.invoke('open-video', { filepath: videoPath, customPlayerPath: settings.customPlayerPath });
      } else {
        useStore.getState().setActiveBuiltinVideo({ path: videoPath, title: download.title });
      }
    } catch (error) {
      console.error('Failed to find video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };

  const handleStartDownload = async (download) => {
    if (download.status === 'downloading' || download.status === 'queued') return;
    updateDownload(download.id, { status: 'queued', progress: download.progress || 0, isRetry: true });
  };

  const handlePauseDownload = async (download) => {
    if (download.status !== 'downloading') return;
    try {
      await ipcRenderer?.invoke('pause-download', download.id);
      updateDownload(download.id, { status: 'paused', speed: null, eta: null });
    } catch (e) {
      console.error('Failed to pause:', e);
    }
  };

  const handleRetryDownload = async (download) => {
    updateDownload(download.id, { status: 'queued', progress: download.progress || 0, isRetry: true });
  };

  const handleOpenFolder = async (download) => {
    try {
      const videoPath = await ipcRenderer?.invoke('get-video-path', {
        filename: `${download.title}.mp4`,
        downloadPath: settings.downloadPath,
      });
      await ipcRenderer?.invoke('open-folder', videoPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open folder. The video file may have been moved or deleted.');
    }
  };

  const activeDownloads = downloads.filter(d => d.status !== 'completed');
  const completedDownloads = downloads.filter(d => d.status === 'completed');

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Download Queue</Text>
            <Text style={styles.subtitle}>
              {downloads.filter(d => d.status !== 'completed').length === 0 
                ? 'No downloads in queue' 
                : `${downloads.filter(d => d.status !== 'completed').length} item(s) in queue 🔥`}
            </Text>
          </View>
          {downloads.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setClearConfirmVisible(true)}>
              <Text style={styles.clearButtonText}>🗑️ Clear Queue</Text>
            </TouchableOpacity>
          )}
        </View>

        {downloads.length === 0 ? (
          <EmptyQueueState onNavigate={onNavigate} />
        ) : (
          <View style={styles.sectionsContainer}>
            {activeDownloads.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Active Downloads</Text>
                <View style={styles.downloadsList}>
                  {activeDownloads.map((download) => (
                    <DownloadCard 
                      key={download.id}
                      download={download}
                      handlePlayVideo={handlePlayVideo}
                      handleOpenFolder={handleOpenFolder}
                      handleStartDownload={handleStartDownload}
                      handlePauseDownload={handlePauseDownload}
                      handleRetryDownload={handleRetryDownload}
                      removeDownload={removeDownload}
                      formatResolutionBadge={formatResolutionBadge}
                      formatDuration={formatDuration}
                      formatFileSize={formatFileSize}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </View>
              </View>
            )}

            {completedDownloads.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Completed</Text>
                <View style={styles.downloadsList}>
                  {completedDownloads.map((download) => (
                    <DownloadCard 
                      key={download.id}
                      download={download}
                      handlePlayVideo={handlePlayVideo}
                      handleOpenFolder={handleOpenFolder}
                      handleStartDownload={handleStartDownload}
                      handlePauseDownload={handlePauseDownload}
                      handleRetryDownload={handleRetryDownload}
                      removeDownload={removeDownload}
                      formatResolutionBadge={formatResolutionBadge}
                      formatDuration={formatDuration}
                      formatFileSize={formatFileSize}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={clearConfirmVisible}
        title="Clear Queue?"
        message="Are you sure you want to clear all downloads from the queue? Active downloads will be stopped and removed."
        confirmText="Clear Queue"
        onConfirm={() => {
          clearQueue();
          setClearConfirmVisible(false);
        }}
        onCancel={() => setClearConfirmVisible(false)}
      />
    </>
  );
}
