import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import VideoThumbnail from '../VideoThumbnail';
import { useStore } from '../../store';
import { theme } from '../../theme';
import VideoPlayer from '../VideoPlayer';
import ConfirmModal from '../ConfirmModal';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function QueueTab() {
  const downloads = useStore(state => state.downloads);
  const settings  = useStore(state => state.settings);
  const updateDownload = useStore(state => state.updateDownload);
  const removeDownload = useStore(state => state.removeDownload);
  const clearQueue = useStore(state => state.clearQueue);
  const addToHistory = useStore(state => state.addToHistory);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

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
      setSelectedVideo({ path: videoPath, title: download.title });
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

  const renderDownloadCard = (download) => (
    <TouchableOpacity 
      key={download.id} 
      style={[
        styles.downloadCard,
        download.status === 'completed' && styles.downloadCardCompleted
      ]}
      onPress={() => handlePlayVideo(download)}
      disabled={download.status !== 'completed'}
    >
      <View style={styles.cardContent}>
        <View style={styles.thumbnailContainer}>
          <VideoThumbnail
            uri={download.thumbnail}
            style={styles.thumbnail}
          />
          {download.status === 'completed' && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.downloadInfo}>
          <View style={styles.downloadHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              {(() => {
                try {
                  const urlObj = new URL(download.url);
                  let domain = urlObj.hostname.replace('www.', '');
                  domain = domain.substring(0, domain.lastIndexOf('.'));
                  if (domain) {
                    const formattedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
                    return (
                      <View style={styles.providerBadge}>
                        <Text style={styles.providerBadgeText}>{formattedDomain}</Text>
                      </View>
                    );
                  }
                } catch (e) {}
                return null;
              })()}
              <Text style={styles.downloadTitle} numberOfLines={2}>
                {download.title}
              </Text>
              {download.uploader && download.uploader !== 'Unknown' && (
                <Text style={styles.uploaderName}>
                  👤 {download.uploader}
                </Text>
              )}
            </View>
            <View style={styles.headerButtons}>
              {download.status === 'completed' && (
                <TouchableOpacity 
                  style={styles.folderButton}
                  onPress={() => handleOpenFolder(download)}
                >
                  <Text style={styles.folderButtonText}>📁</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeDownload(download.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.downloadMeta}>
            {formatDuration(download.duration)}
            {download.resolution && ` • ${download.resolution}`}
            {download.filesize && ` • ${formatFileSize(download.filesize)}`}
          </Text>
          
          <View style={styles.progressSection}>
            {download.status !== 'completed' && (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${download.progress}%`,
                      backgroundColor: getStatusColor(download.status)
                    }
                  ]} 
                />
              </View>
            )}
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: getStatusColor(download.status) }]}>
                {getStatusIcon(download.status)} {download.status}
              </Text>
              {download.status === 'downloading' && download.speed && (
                <View style={styles.statsContainer}>
                  <Text style={styles.speedText}>⚡ {download.speed}</Text>
                  {download.eta && (
                    <Text style={styles.etaText}>⏱️ {download.eta}</Text>
                  )}
                  <Text style={styles.progressText}>
                    {Math.round(download.progress)}%
                  </Text>
                </View>
              )}
              {download.status === 'downloading' && (
                <TouchableOpacity 
                  style={styles.pauseButton}
                  onPress={() => handlePauseDownload(download)}
                >
                  <Text style={styles.pauseButtonText}>⏸️ Pause</Text>
                </TouchableOpacity>
              )}
              {(download.status === 'pending' || download.status === 'paused') && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleStartDownload(download)}
                >
                  <Text style={styles.actionButtonText}>▶ {download.status === 'paused' ? 'Resume' : 'Start'}</Text>
                </TouchableOpacity>
              )}
              {download.status === 'failed' && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => handleRetryDownload(download)}
                >
                  <Text style={styles.retryButtonText}>🔄 Retry</Text>
                </TouchableOpacity>
              )}
              {download.status === 'completed' && (
                <Text style={styles.completedText}>🎉 Click to watch</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Queue is Empty</Text>
          <Text style={styles.emptyText}>Add some downloads to get started!</Text>
          <Text style={styles.emptyHint}>Head over to the Download tab to add videos</Text>
        </View>
      ) : (
        <View style={styles.sectionsContainer}>
          {activeDownloads.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏳ Active Downloads</Text>
              <View style={styles.downloadsList}>
                {activeDownloads.map(renderDownloadCard)}
              </View>
            </View>
          )}

          {completedDownloads.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Completed</Text>
              <View style={styles.downloadsList}>
                {completedDownloads.map(renderDownloadCard)}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>

    <VideoPlayer 
      visible={!!selectedVideo}
      videoPath={selectedVideo?.path}
      videoTitle={selectedVideo?.title}
      onClose={() => setSelectedVideo(null)}
    />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  content: {
    padding: 32,
  },
  header: {
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  clearButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  downloadsList: {
    gap: 16,
  },
  downloadCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  downloadCardCompleted: {
    cursor: 'pointer',
    borderColor: theme.colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 192,
    height: 108,
  },
  thumbnail: {
    width: 192,
    height: 108,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: '#fff',
    marginLeft: 3,
  },
  downloadInfo: {
    flex: 1,
  },
  providerBadge: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  providerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    textTransform: 'uppercase',
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  folderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  folderButtonText: {
    fontSize: 16,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  downloadMeta: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginBottom: 16,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseButton: {
    backgroundColor: `${theme.colors.surfaceLight}`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: '#555',
  },
  pauseButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  retryButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  }
});
