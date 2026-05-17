import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';
import packageJson from '../../../../package.json';

const version = packageJson.version;
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num)) return '0.00 MB';
  const mb = num / (1024 * 1024);
  const gb = num / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
};

const formatTotalDuration = (seconds) => {
  const sec = Number(seconds);
  if (!sec || isNaN(sec)) return '0m';
  const days = Math.floor(sec / (24 * 3600));
  const hours = Math.floor((sec % (24 * 3600)) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
};

export default function SettingsAbout() {
  const history = useStore(state => state.history);
  const openExternal = (url) => ipcRenderer?.invoke('open-external', url);

  const totalBytes = history.reduce((acc, h) => acc + (Number(h.filesize) || 0), 0);
  const totalDuration = history.reduce((acc, h) => acc + (Number(h.duration) || 0), 0);

  const osName = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ℹ️ About</Text>
      <View style={styles.card}>
        
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Text style={styles.brandLogo}>
            <Text style={{ color: '#ffffff' }}>Sauce</Text>
            <Text style={{ color: theme.colors.primary }}>Box</Text>
          </Text>
          <Text style={styles.brandTagline}>Your Sauce. Your Box. Your Rules.</Text>
          <Text style={styles.brandDesc}>
            SauceBox is a local-first, high-performance private media management suite designed to organize, trim, preview, and broadcast video collections securely. Built with zero cloud storage tracking and custom cross-device broadcast capabilities.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🎥</Text>
            <Text style={styles.statNum}>{history.length}</Text>
            <Text style={styles.statLabel}>Local Videos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>💾</Text>
            <Text style={styles.statNum}>{formatFileSize(totalBytes)}</Text>
            <Text style={styles.statLabel}>Total Storage</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statNum}>{formatTotalDuration(totalDuration)}</Text>
            <Text style={styles.statLabel}>Combined Playtime</Text>
          </View>
        </View>

        {/* Info Grid Section */}
        <Text style={styles.subHeading}>🖥️ System Details</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>{version}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Platform OS</Text>
              <Text style={styles.aboutValue}>{osName}</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Database Storage</Text>
              <Text style={styles.aboutValue}>JSON</Text>
            </View>
          </View>

          <View style={styles.infoCol}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Downloader Engine</Text>
              <TouchableOpacity onPress={() => openExternal('https://github.com/yt-dlp/yt-dlp')}>
                <Text style={[styles.aboutValue, { color: theme.colors.primary, textDecorationLine: 'underline', cursor: 'pointer' }]}>
                  yt-dlp
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Transcoding Engine</Text>
              <TouchableOpacity onPress={() => openExternal('https://ffmpeg.org')}>
                <Text style={[styles.aboutValue, { color: theme.colors.primary, textDecorationLine: 'underline', cursor: 'pointer' }]}>
                  FFmpeg
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Framework</Text>
              <Text style={styles.aboutValue}>React Native + Electron</Text>
            </View>
          </View>
        </View>

        {/* Buttons Grid */}
        <Text style={styles.subHeading}>🌐 Resources & Links</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
          >
            <Text style={[styles.saveButtonText, { color: '#000' }]}>☕ Support Us</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.primary }]}
            onPress={() => openExternal('https://saucebox.app')}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>🌐 Official Website</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.buttonRow, { marginTop: 12 }]}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.primary }]}
            onPress={() => openExternal('https://cloudwerxlab.com')}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>💻 CLOUDWERX LAB</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.primary }]}
            onPress={() => openExternal('https://github.com/CLOUDWERX-DEV/SauceBox')}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>🐙 GitHub Repository</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  
  brandHeader: { alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 24 },
  brandLogo: { fontSize: 32, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  brandTagline: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  brandDesc: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 640 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 10, borderWidth: 1, borderColor: `${theme.colors.primary}10`, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statNum: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  statLabel: { fontSize: 11, color: theme.colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  subHeading: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  
  infoGrid: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  infoCol: { flex: 1 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  aboutLabel: { fontSize: 13, color: theme.colors.textSecondary },
  aboutValue: { fontSize: 13, fontWeight: '600', color: theme.colors.text },

  buttonRow: { flexDirection: 'row', gap: 12 },
  saveButton: { flex: 1, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  saveButtonText: { fontSize: 13, fontWeight: '700' }
});
