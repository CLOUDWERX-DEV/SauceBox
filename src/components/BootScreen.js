import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { theme } from '../theme';
import logoSrc from '../../public/logo.png';
import TitleBar from './TitleBar';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function BootScreen({ onComplete }) {
  const [logs, setLogs] = useState([]);
  const [ytProgress, setYtProgress] = useState(null);
  const [ffProgress, setFfProgress] = useState(null);
  const [status, setStatus] = useState('Initializing Runtime Engine...');

  useEffect(() => {
    if (!ipcRenderer) return onComplete();

    const handleLog = (event, msg) => {
      setLogs(prev => [...prev, msg]);
      setStatus(msg);
    };

    const handleProgress = (event, data) => {
      const { tool, progress, cur, len } = data;
      if (tool === 'yt-dlp') setYtProgress({ progress, cur, len });
      if (tool === 'ffmpeg') setFfProgress({ progress, cur, len });
    };

    ipcRenderer.on('provision-log', handleLog);
    ipcRenderer.on('provision-progress', handleProgress);

    // Start download
    ipcRenderer.invoke('download-managed-binaries').then((res) => {
      if (res && res.success) {
        setTimeout(onComplete, 1500); // Give it a second to show completion
      } else {
        setStatus(`Engine Provisioning Failed: ${res?.error}`);
      }
    }).catch(err => {
      setStatus(`Fatal Error: ${err.message || err}`);
    });

    return () => {
      ipcRenderer.removeListener('provision-log', handleLog);
      ipcRenderer.removeListener('provision-progress', handleProgress);
    };
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <TitleBar />
      <View style={styles.content}>
        <img src={logoSrc} alt="SauceBox" style={{ width: 120, height: 120, marginBottom: 24, opacity: 0.9 }} />
        <Text style={styles.title}>Initial Setup</Text>
        <Text style={styles.subtitle}>{status}</Text>
        
        <View style={styles.progressContainer}>
          {ytProgress && (
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.toolName}>yt-dlp Engine</Text>
                <Text style={styles.progressText}>{ytProgress.progress.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${ytProgress.progress}%` }]} />
              </View>
              <Text style={styles.sizeText}>{formatBytes(ytProgress.cur)} / {formatBytes(ytProgress.len)}</Text>
            </View>
          )}

          {ffProgress && (
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.toolName}>FFmpeg Processor</Text>
                <Text style={styles.progressText}>{ffProgress.progress.toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${ffProgress.progress}%` }]} />
              </View>
              <Text style={styles.sizeText}>{formatBytes(ffProgress.cur)} / {formatBytes(ffProgress.len)}</Text>
            </View>
          )}

          {!ytProgress && !ffProgress && (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />
          )}
        </View>

        <View style={styles.logContainer}>
          <ScrollView>
            {logs.map((l, i) => (
              <Text key={i} style={styles.logLine}>{`> ${l}`}</Text>
            ))}
          </ScrollView>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 40,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toolName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  progressText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  sizeText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'right',
  },
  logContainer: {
    width: '100%',
    maxWidth: 500,
    height: 120,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  logLine: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  }
});
