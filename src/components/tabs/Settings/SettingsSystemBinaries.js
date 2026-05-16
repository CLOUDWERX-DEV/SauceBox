import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsSystemBinaries() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const [ytVersion, setYtVersion] = useState('Detecting...');
  const [ffmpegVersion, setFfmpegVersion] = useState('Detecting...');

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        await ipcRenderer?.send('update-binary-paths', { 
          ytdlpPath: settings.ytdlpPath, 
          ffmpegPath: settings.ffmpegPath 
        });
        const versions = await ipcRenderer?.invoke('get-binary-versions');
        if (versions) {
          setYtVersion(versions.ytDlp);
          setFfmpegVersion(versions.ffmpeg);
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      }
    };
    fetchVersions();
  }, [settings.ytdlpPath, settings.ffmpegPath]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛠️ System Binaries</Text>
      <View style={styles.card}>
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.switchLabel}>yt-dlp Path</Text>
            <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ytVersion}</Text>
          </View>
          <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to yt-dlp binary (leave empty for system PATH)</Text>
          <View style={styles.pathContainer}>
            <TextInput
              style={[styles.pathInput, { flex: 1, backgroundColor: theme.colors.surfaceLight }]}
              placeholder="e.g. /usr/local/bin/yt-dlp"
              placeholderTextColor="#555"
              value={settings.ytdlpPath}
              onChangeText={(text) => updateSettings({ ytdlpPath: text })}
            />
            <TouchableOpacity 
              style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
              onPress={async () => {
                try {
                  const result = await ipcRenderer?.invoke('select-file', 'Select yt-dlp Executable');
                  if (result) updateSettings({ ytdlpPath: result });
                } catch (e) { console.error(e); }
              }}
            >
              <Text style={styles.browseButtonText}>Browse</Text>
            </TouchableOpacity>
            {settings.ytdlpPath && settings.ytdlpPath.trim() !== '' && (
              <TouchableOpacity 
                style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16, backgroundColor: theme.colors.error }]}
                onPress={() => updateSettings({ ytdlpPath: '' })}
              >
                <Text style={[styles.browseButtonText, { color: '#fff' }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.switchLabel}>ffmpeg Path</Text>
            <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ffmpegVersion}</Text>
          </View>
          <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to ffmpeg binary (leave empty for system PATH)</Text>
          <View style={styles.pathContainer}>
            <TextInput
              style={[styles.pathInput, { flex: 1, backgroundColor: theme.colors.surfaceLight }]}
              placeholder="e.g. /usr/bin/ffmpeg"
              placeholderTextColor="#555"
              value={settings.ffmpegPath}
              onChangeText={(text) => updateSettings({ ffmpegPath: text })}
            />
            <TouchableOpacity 
              style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
              onPress={async () => {
                try {
                  const result = await ipcRenderer?.invoke('select-file', 'Select ffmpeg Executable');
                  if (result) updateSettings({ ffmpegPath: result });
                } catch (e) { console.error(e); }
              }}
            >
              <Text style={styles.browseButtonText}>Browse</Text>
            </TouchableOpacity>
            {settings.ffmpegPath && settings.ffmpegPath.trim() !== '' && (
              <TouchableOpacity 
                style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16, backgroundColor: theme.colors.error }]}
                onPress={() => updateSettings({ ffmpegPath: '' })}
              >
                <Text style={[styles.browseButtonText, { color: '#fff' }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {(ytVersion.includes('Not Found') || ffmpegVersion.includes('Not Found')) && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Core Dependencies Missing!</Text>
            <Text style={styles.warningText}>
              SauceBox requires both <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>yt-dlp</Text> and <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>ffmpeg</Text> to download videos, generate thumbnails, and extract clips. They are completely free and open-source tools.
            </Text>

            <Text style={styles.installHeader}>How to Install on Windows:</Text>
            <View style={styles.installList}>
              <Text style={styles.installItem}>• The easiest way is using <Text style={{ color: theme.colors.primary }}>winget</Text> in PowerShell.</Text>
              <Text style={styles.installItem}>• Open PowerShell and run: <Text style={styles.code}>winget install yt-dlp ffmpeg</Text></Text>
              <Text style={styles.installItem}>• Alternatively, download the executables manually, put them in a folder, and set their custom paths above.</Text>
            </View>

            <Text style={styles.installHeader}>How to Install on macOS:</Text>
            <View style={styles.installList}>
              <Text style={styles.installItem}>• The easiest way is using <Text style={{ color: theme.colors.primary }}>Homebrew</Text>.</Text>
              <Text style={styles.installItem}>• Open Terminal and run: <Text style={styles.code}>brew install yt-dlp ffmpeg</Text></Text>
            </View>

            <Text style={styles.installHeader}>How to Install on Linux:</Text>
            <View style={styles.installList}>
              <Text style={[styles.installItem, { marginBottom: 4 }]}>• Ubuntu/Debian: <Text style={styles.code}>sudo apt install ffmpeg yt-dlp</Text></Text>
              <Text style={styles.installItem}>• Arch: <Text style={styles.code}>sudo pacman -S yt-dlp ffmpeg</Text></Text>
            </View>
            
            <Text style={[styles.installItem, { marginTop: 8, fontStyle: 'italic' }]}>
              Once installed globally, restart SauceBox or hit "Clear" on empty paths above to auto-detect them.
            </Text>
          </View>
        )}

        <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.switchLabel}>Custom Video Player</Text>
          </View>
          <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to your preferred external video player (e.g. VLC, MPV). Leave empty to use the built-in app player.</Text>
          <View style={styles.pathContainer}>
            <TextInput
              style={[styles.pathInput, { flex: 1, backgroundColor: theme.colors.surfaceLight }]}
              placeholder="Select custom player executable..."
              placeholderTextColor="#555"
              value={settings.customPlayerPath || ''}
              editable={false}
            />
            <TouchableOpacity 
              style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
              onPress={async () => {
                try {
                  const result = await ipcRenderer?.invoke('select-file', 'Select Video Player Executable');
                  if (result) updateSettings({ customPlayerPath: result });
                } catch (e) { console.error(e); }
              }}
            >
              <Text style={styles.browseButtonText}>Select</Text>
            </TouchableOpacity>
            {settings.customPlayerPath && settings.customPlayerPath.trim() !== '' && (
              <TouchableOpacity 
                style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16, backgroundColor: theme.colors.error }]}
                onPress={() => updateSettings({ customPlayerPath: '' })}
              >
                <Text style={[styles.browseButtonText, { color: '#fff' }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  switchDesc: { fontSize: 13, color: theme.colors.textTertiary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  pathContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  pathInput: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none' },
  browseButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', cursor: 'pointer', minWidth: 120 },
  browseButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  warningBox: { marginTop: 24, padding: 16, backgroundColor: `${theme.colors.error}20`, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.error },
  warningTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.error, marginBottom: 8 },
  warningText: { fontSize: 14, color: theme.colors.text, marginBottom: 16, lineHeight: 20 },
  installHeader: { fontSize: 14, fontWeight: '600', color: theme.colors.primary, marginBottom: 4 },
  installList: { marginBottom: 12, paddingLeft: 8 },
  installItem: { fontSize: 13, color: theme.colors.textSecondary },
  code: { fontFamily: 'monospace', backgroundColor: theme.colors.surfaceLight, padding: 2, borderRadius: 4 }
});
