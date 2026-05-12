import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { theme } from '../theme';

export default function VideoPreviewModal({ visible, videoInfo, onClose, onDownload }) {
  if (!visible || !videoInfo) return null;

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📹 Video Preview</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body: thumbnail left, info right */}
          <View style={styles.body}>
            {/* Left: Thumbnail */}
            <View style={styles.thumbnailWrapper}>
              {videoInfo.thumbnail ? (
                <Image
                  source={{ uri: videoInfo.thumbnail }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailPlaceholderIcon}>🎬</Text>
                  <Text style={styles.thumbnailPlaceholderText}>No Preview</Text>
                </View>
              )}
            </View>

            {/* Right: Info */}
            <View style={styles.infoPanel}>
              <Text style={styles.videoTitle} numberOfLines={3}>
                {videoInfo.title}
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>⏱️ Duration</Text>
                  <Text style={styles.infoValue}>{formatDuration(videoInfo.duration)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>🎬 Quality</Text>
                  <Text style={styles.infoValue}>{videoInfo.resolution || 'Best'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>💾 Size</Text>
                  <Text style={styles.infoValue}>{formatFileSize(videoInfo.filesize)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>👤 Uploader</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {videoInfo.uploader || 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* Actions inside info panel at bottom */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
                  <Text style={styles.downloadButtonText}>🚀 Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modal: {
    width: '100%',
    maxWidth: 920,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    minHeight: 320,
  },
  thumbnailWrapper: {
    width: 380,
    flexShrink: 0,
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    gap: 12,
  },
  thumbnailPlaceholderIcon: {
    fontSize: 48,
  },
  thumbnailPlaceholderText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  infoPanel: {
    flex: 1,
    padding: 28,
    justifyContent: 'space-between',
    gap: 20,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 26,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  infoItem: {
    width: 'calc(50% - 6px)',
    backgroundColor: theme.colors.surfaceLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  downloadButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
