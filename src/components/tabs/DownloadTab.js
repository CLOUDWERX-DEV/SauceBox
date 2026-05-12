import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../../store';
import { theme } from '../../theme';
import BatchDownloadModal from '../BatchDownloadModal';
import VideoPreviewModal from '../VideoPreviewModal';
import PlaylistModal from '../PlaylistModal';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

const funnyPlaceholders = [
  "Paste that spicy link here... 🌶️",
  "Drop the URL like it's hot 🔥",
  "Your secret's safe with us 🤫",
  "Time to expand the collection 📚",
  "What are we downloading today? 😏",
  "Another one for the vault 🔐",
  "Building that library 📖",
  "Quality content incoming 💎"
];

export default function DownloadTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewInfo, setPreviewInfo] = useState(null);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);

  const addDownload = useStore(state => state.addDownload);
  const settings = useStore(state => state.settings);
  const addToHistory = useStore(state => state.addToHistory);

  // Unified URL resolver — detects playlist vs single video
  const resolveUrl = async (targetUrl) => {
    setLoading(true);
    setLoadingMsg('🔍 Fetching info...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', targetUrl);
      return info;
    } finally {
      setLoadingMsg('');
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingMsg('🔍 Fetching info...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', url.trim());

      if (info.isPlaylist && info.entries.length > 1) {
        setPlaylistInfo({ ...info, url: url.trim() });
        setPlaylistModalVisible(true);
      } else {
        // Single video — use existing preview modal
        // If singleVideo data came back from flat-playlist, use it; otherwise fetch full info
        let videoData = info.singleVideo;
        if (!videoData) {
          videoData = await ipcRenderer?.invoke('get-video-info', url.trim());
        }
        setPreviewInfo({ ...videoData, url: url.trim() });
        setPreviewModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to get info:', error);
      alert('Failed to load info: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleDownloadFromPreview = () => {
    setPreviewModalVisible(false);
    queueDownload(previewInfo.url);
    setUrl('');
  };

  // Queue a single video download
  const queueDownload = async (urlToDownload) => {
    setLoading(true);
    try {
      // Check for duplicates
      const existingDownload = useStore.getState().history.find(h => h.url === urlToDownload);
      if (existingDownload) {
        const confirmDownload = window.confirm(
          `You already downloaded this video on ${new Date(existingDownload.timestamp).toLocaleDateString()}!\n\n` +
          `Title: ${existingDownload.title}\n\nDo you want to download it again?`
        );
        if (!confirmDownload) return;
      }

      const info = await ipcRenderer?.invoke('get-video-info', urlToDownload);

      const download = {
        url: urlToDownload,
        title: info?.title || 'Unknown Title',
        thumbnail: info?.thumbnail,
        duration: info?.duration,
        uploader: info?.uploader,
        resolution: info?.resolution,
        format: info?.format,
        filesize: info?.filesize
      };

      addDownload(download);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setLoadingMsg('🔍 Detecting URL type...');
    try {
      const info = await ipcRenderer?.invoke('get-playlist-info', url.trim());

      if (info.isPlaylist && info.entries.length > 1) {
        // Playlist — open selection modal
        setPlaylistInfo({ ...info, url: url.trim() });
        setPlaylistModalVisible(true);
        setLoading(false);
        setLoadingMsg('');
        return;
      }

      // Single video — queue with full metadata
      const existingDownload = useStore.getState().history.find(h => h.url === url.trim());
      if (existingDownload) {
        const confirmDownload = window.confirm(
          `You already downloaded this video on ${new Date(existingDownload.timestamp).toLocaleDateString()}!\n\n` +
          `Title: ${existingDownload.title}\n\nDo you want to download it again?`
        );
        if (!confirmDownload) return;
      }

      // Always use get-video-info for single videos to guarantee thumbnail
      setLoadingMsg('📡 Fetching video info...');
      const videoData = await ipcRenderer?.invoke('get-video-info', url.trim());

      const download = {
        url: url.trim(),
        title: videoData?.title || 'Unknown Title',
        thumbnail: videoData?.thumbnail,
        duration: videoData?.duration,
        uploader: videoData?.uploader,
        resolution: videoData?.resolution,
        format: videoData?.format,
        filesize: videoData?.filesize
      };

      addDownload(download);

      setUrl('');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Called when user confirms selection in PlaylistModal
  const handleDownloadFromPlaylist = async (selectedEntries) => {
    setPlaylistModalVisible(false);
    setUrl('');

    for (const entry of selectedEntries) {
      try {
        const download = {
          url: entry.url,
          title: entry.title || 'Unknown Title',
          thumbnail: entry.thumbnail || null,
          duration: entry.duration || null,
          uploader: entry.uploader || null,
          resolution: null,
          format: null,
          filesize: null,
        };

        addDownload(download);
      } catch (error) {
        console.error(`Failed to queue ${entry.title}:`, error);
      }
    }
  };

  const handleBatchDownload = async (urls) => {
    for (const batchUrl of urls) {
      try {
        const info = await ipcRenderer?.invoke('get-video-info', batchUrl);

        const download = {
          url: batchUrl,
          title: info?.title || 'Unknown Title',
          thumbnail: info?.thumbnail,
          duration: info?.duration,
          uploader: info?.uploader,
          resolution: info?.resolution,
          format: info?.format,
          filesize: info?.filesize
        };

        addDownload(download);
      } catch (error) {
        console.error('Failed to add batch download:', error);
      }
    }
  };

  const randomPlaceholder = funnyPlaceholders[Math.floor(Math.random() * funnyPlaceholders.length)];

  return (
    <>
      <div className="main-content-wrapper">
        <div style={styles.content}>
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📎 Video URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={randomPlaceholder}
                placeholderTextColor="#555"
                value={url}
                onChangeText={setUrl}
                onSubmitEditing={() => handleDownload()}
              />
              <TouchableOpacity
                style={[styles.previewButton, loading && styles.downloadButtonDisabled]}
                onPress={handlePreview}
                disabled={loading}
              >
                <Text style={styles.previewButtonText}>
                  {loading ? '⏳' : '👁️'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.downloadButton, loading && styles.downloadButtonDisabled]}
                onPress={() => handleDownload()}
                disabled={loading}
              >
                <Text style={styles.downloadButtonText}>
                  {loading ? (loadingMsg || '⏳ Fetching...') : '🚀 Download'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Supports most major video platforms &amp; playlists • Press Enter to download
            </Text>
          </View>

          <View style={styles.batchSection}>
            <View style={styles.batchInfo}>
              <Text style={styles.batchTitle}>Need to download multiple videos?</Text>
              <Text style={styles.batchDesc}>Use batch mode to queue multiple URLs at once</Text>
            </View>
            <TouchableOpacity
              style={styles.batchButton}
              onPress={() => setBatchModalVisible(true)}
            >
              <Text style={styles.batchButtonIcon}>📦</Text>
              <Text style={styles.batchButtonText}>Open Batch Mode</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>Paste a playlist URL and select exactly which videos to download</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>Use Batch Mode to download multiple videos simultaneously</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>Works with most major adult sites and video platforms</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>Downloads are saved to ~/Downloads/LocalFap by default</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>Click on any video in the Gallery to watch it instantly</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tip}>All your data is saved locally and persists between sessions</Text>
            </View>
          </View>
        </View>
        </div>
      </div>

      <BatchDownloadModal
        visible={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        onSubmit={handleBatchDownload}
      />

      <VideoPreviewModal
        visible={previewModalVisible}
        videoInfo={previewInfo}
        onClose={() => setPreviewModalVisible(false)}
        onDownload={handleDownloadFromPreview}
      />

      <PlaylistModal
        visible={playlistModalVisible}
        playlistInfo={playlistInfo}
        onClose={() => setPlaylistModalVisible(false)}
        onDownloadSelected={handleDownloadFromPlaylist}
      />
    </>
  );
}

const styles = {
  content: {
    padding: 32,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 18,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
  },
  inputHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  downloadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 180,
    cursor: 'pointer',
  },
  previewButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  previewButtonText: {
    fontSize: 20,
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  downloadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  batchSection: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  batchInfo: {
    marginBottom: 16,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  batchDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  batchButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  batchButtonIcon: {
    fontSize: 20,
  },
  batchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 32,
    display: 'none',
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 20,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
  },
  tipBullet: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  tip: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: '22px',
  }
};
