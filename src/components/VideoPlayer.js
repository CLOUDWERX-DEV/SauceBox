import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { theme } from '../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function VideoPlayer({ visible, videoPath, videoTitle, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trimMode, setTrimMode] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:30');
  const [trimming, setTrimming] = useState(false);

  useEffect(() => {
    if (visible && videoPath) {
      setLoading(true);
      setError(null);
      
      // Use Electron's protocol to serve the file
      if (videoRef.current) {
        // Encode each path segment to handle #, ?, +, % in filenames
        const safePath = videoPath.split('/').map(encodeURIComponent).join('/');
        videoRef.current.src = `file://${safePath}`;
        videoRef.current.load();
      }
    }
  }, [visible, videoPath]);

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

  const handleSaveClip = async () => {
    if (!startTime || !duration) return alert("Enter valid start time and duration");
    try {
      setTrimming(true);
      const ext = videoPath.split('.').pop();
      const newPath = videoPath.replace(`.${ext}`, `_clip_${Date.now()}.${ext}`);
      await ipcRenderer?.invoke('trim-video', {
        inputPath: videoPath,
        outputPath: newPath,
        startTime,
        duration
      });
      alert('Clip saved successfully at:\n' + newPath);
      setTrimMode(false);
    } catch (err) {
      alert('Failed to trim video:\n' + err.message);
    } finally {
      setTrimming(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.playerContainer}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Video Player</Text>
              {videoTitle && <Text style={styles.subtitle}>{videoTitle}</Text>}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.trimToggleButton} onPress={() => setTrimMode(!trimMode)}>
                <Text style={styles.trimToggleButtonText}>✂️ Clip Mode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {trimMode && (
            <View style={styles.trimBar}>
              <View style={styles.trimInputGroup}>
                <Text style={styles.trimLabel}>Start Time (HH:MM:SS)</Text>
                <input 
                  style={styles.trimInput} 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                />
              </View>
              <View style={styles.trimInputGroup}>
                <Text style={styles.trimLabel}>Duration (HH:MM:SS or Seconds)</Text>
                <input 
                  style={styles.trimInput} 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                />
              </View>
              <TouchableOpacity 
                style={[styles.saveClipButton, trimming && { opacity: 0.5 }]} 
                onPress={handleSaveClip}
                disabled={trimming}
              >
                <Text style={styles.saveClipButtonText}>{trimming ? '✂️ Trimming...' : '💾 Save Clip'}</Text>
              </TouchableOpacity>
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
            ) : (
              <video
                ref={videoRef}
                controls
                style={styles.video}
                onLoadedData={handleLoadedData}
                onError={handleError}
              >
                <source src={`file://${videoPath}`} type="video/mp4" />
                <source src={`file://${videoPath}`} type="video/webm" />
                <source src={`file://${videoPath}`} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  playerContainer: {
    width: '100%',
    maxWidth: 1200,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 9',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  trimBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    marginTop: 18, // Align with inputs
  },
  saveClipButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  }
});
