import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';
import EditVideoModal from './EditVideoModal';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// VideoPlayer now accepts the full `originalItem` object from the gallery
// so we can pre-fill clip metadata and handle post-clip actions.
export default function VideoPlayer({ visible, videoPath, videoTitle, originalItem, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trimMode, setTrimMode] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');
  const [trimming, setTrimming] = useState(false);

  // Clip options
  const [addToGallery, setAddToGallery] = useState(true);
  const [deleteOriginalGallery, setDeleteOriginalGallery] = useState(false);
  const [deleteOriginalDisk, setDeleteOriginalDisk] = useState(false);

  // Post-clip metadata editing
  const [clipItem, setClipItem] = useState(null);

  const addToHistory = useStore(state => state.addToHistory);
  const removeFromHistory = useStore(state => state.removeFromHistory);
  const updateHistoryItem = useStore(state => state.updateHistoryItem);

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

  useEffect(() => {
    if (visible && videoPath) {
      setLoading(true);
      setError(null);
      if (videoRef.current) {
        const safePath = videoPath.split('/').map(encodeURIComponent).join('/');
        videoRef.current.src = `file://${safePath}`;
        videoRef.current.load();
      }
    }
  }, [visible, videoPath]);

  // Sync deleteOriginalDisk to also set deleteOriginalGallery
  useEffect(() => {
    if (deleteOriginalDisk) setDeleteOriginalGallery(true);
  }, [deleteOriginalDisk]);

  const handleLoadedData = () => {
    setLoading(false);
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Playback error:', err);
        setError('Failed to play video');
      });
    }
  };

  const handleError = (e) => {
    console.error('Video error:', e);
    setError('Unable to load video file. Make sure the download completed successfully.');
    setLoading(false);
  };

  const handleOpenExternal = async () => {
    try {
      await ipcRenderer?.invoke('open-video', videoPath);
    } catch (error) {
      console.error('Failed to open video:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await ipcRenderer?.invoke('open-folder', videoPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open folder.');
    }
  };

  // Parse HH:MM:SS or plain seconds into seconds number
  const parseTime = (str) => {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const handleSaveClip = async () => {
    if (!startTime || !endTime) return alert('Enter valid start and end times');
    const startSec = parseTime(startTime);
    const endSec = parseTime(endTime);
    if (endSec <= startSec) return alert('End time must be after start time');
    const durationSec = endSec - startSec;

    try {
      setTrimming(true);
      const ext = videoPath.split('.').pop();
      const newPath = videoPath.replace(`.${ext}`, `_clip_${Date.now()}.${ext}`);
      await ipcRenderer?.invoke('trim-video', {
        inputPath: videoPath,
        outputPath: newPath,
        startTime,
        duration: durationSec.toString(),
      });

      // Generate a fresh thumbnail for the clip from its actual frames
      let clipThumbnail = null;
      try {
        // get-local-thumbnail returns a string URI directly, not an object
        const thumbResult = await ipcRenderer?.invoke('get-local-thumbnail', newPath);
        if (thumbResult && typeof thumbResult === 'string') clipThumbnail = thumbResult;
      } catch (e) {
        console.warn('Could not generate clip thumbnail:', e);
      }

      // Handle gallery addition
      if (addToGallery) {
        const newItem = {
          ...(originalItem || {}),
          id: Date.now(),
          timestamp: Date.now(),
          path: newPath,
          title: `${videoTitle || 'Clip'} (clip)`,
          duration: durationSec,
          filesize: null,
          thumbnail: clipThumbnail,
          tags: [...(originalItem?.tags || [])],
          rating: originalItem?.rating || 0,
          status: 'completed',
        };
        addToHistory(newItem);
        setClipItem(newItem); // triggers EditVideoModal
      }

      // Handle original deletion
      if (deleteOriginalDisk && videoPath) {
        await ipcRenderer?.invoke('delete-file', videoPath);
      }
      if (deleteOriginalGallery && originalItem?.id) {
        removeFromHistory(originalItem.id);
      }

      if (!addToGallery) {
        alert('Clip saved to:\n' + newPath);
      }

      setTrimMode(false);
      if (!addToGallery) return;

    } catch (err) {
      alert('Failed to trim video:\n' + err.message);
    } finally {
      setTrimming(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Modal transparent visible={visible} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.playerContainer}>
            <View style={styles.header}>
              <View style={styles.titleSection}>
                <Text style={styles.title} numberOfLines={1}>{videoTitle || 'Unknown Video'}</Text>
                {originalItem && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {formatDuration(originalItem.duration)}
                    {originalItem.resolution && ` • ${originalItem.resolution}`}
                    {originalItem.filesize && ` • ${formatFileSize(originalItem.filesize)}`}
                    {originalItem.uploader && originalItem.uploader !== 'Unknown' && ` • 👤 ${originalItem.uploader}`}
                  </Text>
                )}
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleOpenExternal}>
                  <Text style={styles.actionButtonText}>🎬 Open Player</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleOpenFolder}>
                  <Text style={styles.actionButtonText}>📁 Open Folder</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.trimToggleButton} onPress={() => setTrimMode(!trimMode)}>
                  <Text style={styles.trimToggleButtonText}>✂️ Clip Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {trimMode && (
              <View style={styles.trimPanel}>
                <View style={styles.trimInputsRow}>
                  <View style={styles.trimInputGroup}>
                    <Text style={styles.trimLabel}>Start (HH:MM:SS)</Text>
                    <input
                      style={styles.trimInput}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </View>
                  <View style={styles.trimInputGroup}>
                    <Text style={styles.trimLabel}>End (HH:MM:SS)</Text>
                    <input
                      style={styles.trimInput}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveClipButton, trimming && { opacity: 0.5 }]}
                    onPress={handleSaveClip}
                    disabled={trimming}
                  >
                    <Text style={styles.saveClipButtonText}>{trimming ? '✂️ Clipping...' : '💾 Save Clip'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Clip options */}
                <View style={styles.clipOptions}>
                  <TouchableOpacity style={styles.optionRow} onPress={() => setAddToGallery(!addToGallery)}>
                    <View style={[styles.checkbox, addToGallery && styles.checkboxOn]}>
                      {addToGallery && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.optionLabel}>Add clip to Gallery (opens editor to review metadata)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setDeleteOriginalGallery(!deleteOriginalGallery)}
                  >
                    <View style={[styles.checkbox, deleteOriginalGallery && styles.checkboxOn]}>
                      {deleteOriginalGallery && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.optionLabel}>Remove original from Gallery after clipping</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setDeleteOriginalDisk(!deleteOriginalDisk)}
                  >
                    <View style={[styles.checkbox, deleteOriginalDisk && styles.checkboxDanger]}>
                      {deleteOriginalDisk && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.optionLabel, deleteOriginalDisk && { color: theme.colors.error }]}>
                      Also permanently delete original file from disk
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.videoContainer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <Text style={styles.loadingText}>⏳ Loading video...</Text>
                </View>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.externalButton} onPress={handleOpenExternal}>
                    <Text style={styles.externalButtonText}>🎬 Open in External Player</Text>
                  </TouchableOpacity>
                </View>
              ) : (() => {
                const safeSrc = videoPath
                  ? videoPath.split('/').map(encodeURIComponent).join('/')
                  : '';
                return (
                  <video
                    ref={videoRef}
                    controls
                    style={styles.video}
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                  >
                    <source src={`file://${safeSrc}`} type="video/mp4" />
                    <source src={`file://${safeSrc}`} type="video/webm" />
                    <source src={`file://${safeSrc}`} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Post-clip metadata editor */}
      {clipItem && (
        <EditVideoModal
          visible={!!clipItem}
          video={clipItem}
          onSave={(updatedVideo) => {
            updateHistoryItem(updatedVideo.id, updatedVideo);
            setClipItem(null);
            onClose();
          }}
          onClose={() => {
            setClipItem(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    marginTop: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  playerContainer: {
    width: '90vw',
    height: '90vh',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexShrink: 0,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  actionButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  trimToggleButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    cursor: 'pointer',
  },
  trimToggleButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
  trimPanel: {
    backgroundColor: theme.colors.surfaceLight,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
    flexShrink: 0,
  },
  trimInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
  },
  trimInputGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  trimLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  trimInput: {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 6,
    color: theme.colors.text,
    padding: '8px 12px',
    fontSize: 14,
    width: 140,
    outline: 'none',
  },
  saveClipButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  saveClipButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  clipOptions: {
    gap: 8,
    paddingTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: {
    backgroundColor: theme.colors.primary,
  },
  checkboxDanger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  checkmark: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  optionLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000',
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    backgroundColor: '#000',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 500,
  },
  externalButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    cursor: 'pointer',
  },
  externalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
