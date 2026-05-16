import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { theme } from '../theme';

const STANDARD_QUALITIES = [
  { label: 'Best', value: 'best', desc: 'Highest quality the site offers' },
  { label: '4K',   value: '2160', desc: 'Ultra HD (2160p)' },
  { label: '2K',   value: '1440', desc: 'Quad HD (1440p)' },
  { label: '1080p', value: '1080', desc: 'Full HD' },
  { label: '720p',  value: '720',  desc: 'HD' },
  { label: '480p',  value: '480',  desc: 'SD' },
  { label: '360p',  value: '360',  desc: 'Low' },
  { label: '240p',  value: '240',  desc: 'Very low' },
];

// Build the chip list for a given video.
// If availableQualities (array of heights like [720, 480, 240]) is provided,
// we show Best + every standard level that is within the available set.
// Options that are exactly available get a confirmed indicator.
function buildQualityOptions(availableQualities) {
  if (!availableQualities || availableQualities.length === 0) {
    // No format info — show the default standard list without badges
    return STANDARD_QUALITIES.map(q => ({ ...q, confirmed: false }));
  }

  const availSet = new Set(availableQualities.map(h => String(h)));
  // Always include Best, then include each standard level whose value is in the available set
  return STANDARD_QUALITIES
    .filter(q => q.value === 'best' || availSet.has(q.value))
    .map(q => ({ ...q, confirmed: q.value !== 'best' && availSet.has(q.value) }));
}

export default function VideoPreviewModal({ visible, videoInfo, defaultQuality = 'best', onClose, onDownload }) {
  const [selectedQuality, setSelectedQuality] = React.useState(defaultQuality);

  React.useEffect(() => {
    if (visible) {
      setSelectedQuality(defaultQuality);
    }
  }, [visible, defaultQuality]);

  if (!visible || !videoInfo) return null;

  const qualityOptions = buildQualityOptions(videoInfo.availableQualities);

  // If the persisted defaultQuality is no longer in the current option list, fall back to 'best'
  const validatedQuality = qualityOptions.find(o => o.value === selectedQuality)
    ? selectedQuality
    : 'best';

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

            {/* Right: Info + Quality + Actions */}
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
                  <Text style={styles.infoLabel}>🎬 Source Quality</Text>
                  <Text style={styles.infoValue}>{videoInfo.resolution || 'Unknown'}</Text>
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

              {/* Quality picker */}
              <View style={styles.qualitySection}>
                <View style={styles.qualityLabelRow}>
                  <Text style={styles.qualityLabel}>⚙️ Download Quality</Text>
                  {videoInfo.availableQualities && videoInfo.availableQualities.length > 0 && (
                    <Text style={styles.qualityAvailBadge}>
                      ✓ {videoInfo.availableQualities.length} resolutions detected
                    </Text>
                  )}
                </View>
                <View style={styles.qualityRow}>
                  {qualityOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.qualityChip,
                        validatedQuality === opt.value && styles.qualityChipActive,
                        opt.confirmed && validatedQuality !== opt.value && styles.qualityChipConfirmed,
                      ]}
                      onPress={() => setSelectedQuality(opt.value)}
                    >
                      <View style={styles.qualityChipInner}>
                        {opt.confirmed && (
                          <View style={[
                            styles.qualityDot,
                            validatedQuality === opt.value && styles.qualityDotActive,
                          ]} />
                        )}
                        <Text style={[
                          styles.qualityChipText,
                          validatedQuality === opt.value && styles.qualityChipTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.qualityHint}>
                  {qualityOptions.find(o => o.value === validatedQuality)?.desc}
                  {validatedQuality !== 'best' && ' — falls back to best available if not offered'}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadButton} onPress={() => onDownload(selectedQuality)}>
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
    minHeight: 360,
  },
  thumbnailWrapper: {
    width: 340,
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
    padding: 24,
    gap: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    width: 'calc(50% - 5px)',
    backgroundColor: theme.colors.surfaceLight,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '700',
  },
  qualitySection: {
    gap: 8,
  },
  qualityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qualityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  qualityAvailBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.3,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  qualityChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    cursor: 'pointer',
  },
  qualityChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  qualityChipConfirmed: {
    borderColor: '#22c55e44',
    backgroundColor: '#22c55e12',
  },
  qualityChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  qualityDotActive: {
    backgroundColor: '#000',
  },
  qualityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  qualityChipTextActive: {
    color: '#000',
  },
  qualityHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
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
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
