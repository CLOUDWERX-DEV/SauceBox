import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';

const saucebox = window.saucebox;

export default function SettingsSystemBinaries() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const [ytVersion, setYtVersion] = useState('Detecting...');
  const [ffmpegVersion, setFfmpegVersion] = useState('Detecting...');
  const [isUpdatingYt, setIsUpdatingYt] = useState(false);
  const [isRedownloading, setIsRedownloading] = useState(false);

  const mode = settings.binaryManagementMode || 'managed';

  const fetchVersions = async () => {
    try {
      setYtVersion('Detecting...');
      setFfmpegVersion('Detecting...');

      let ytPathToUse = settings.ytdlpPath;
      let ffPathToUse = settings.ffmpegPath;
      
      if (mode === 'managed') {
         const info = await saucebox?.invoke('check-managed-binaries');
         ytPathToUse = info?.managedPaths?.ytdlpPath || '';
         ffPathToUse = info?.managedPaths?.ffmpegPath || '';
      } else if (mode === 'system') {
         ytPathToUse = '';
         ffPathToUse = '';
      }
      
      await saucebox?.send('update-binary-paths', {
        ytdlpPath: ytPathToUse, 
        ffmpegPath: ffPathToUse 
      });
      
      const versions = await saucebox?.invoke('get-binary-versions');
      if (versions) {
        setYtVersion(versions.ytDlp);
        setFfmpegVersion(versions.ffmpeg);
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [settings.ytdlpPath, settings.ffmpegPath, mode]);

  const handleUpdateYt = async () => {
    if (isUpdatingYt) return;
    setIsUpdatingYt(true);
    try {
      const res = await saucebox?.invoke('update-managed-ytdlp');
      if (res && res.success) {
        // Success
        await fetchVersions();
      } else {
        console.error("Update failed", res?.error);
      }
    } catch (e) {
      console.error(e);
    }
    setIsUpdatingYt(false);
  };

  const handleRedownload = async () => {
    if (isRedownloading) return;
    setIsRedownloading(true);
    try {
      await saucebox?.invoke('download-managed-binaries');
      await fetchVersions();
    } catch (e) {
      console.error(e);
    }
    setIsRedownloading(false);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛠️ System Binaries</Text>
      <View style={styles.card}>
        
        <View style={styles.switcherContainer}>
          <TouchableOpacity 
            style={[styles.switchButton, mode === 'managed' && styles.switchButtonActive]}
            onPress={() => updateSettings({ binaryManagementMode: 'managed' })}
          >
            <Text style={[styles.switchButtonText, mode === 'managed' && styles.switchButtonTextActive]}>SauceBox Managed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.switchButton, mode === 'system' && styles.switchButtonActive]}
            onPress={() => updateSettings({ binaryManagementMode: 'system' })}
          >
            <Text style={[styles.switchButtonText, mode === 'system' && styles.switchButtonTextActive]}>System PATH</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.switchButton, mode === 'custom' && styles.switchButtonActive]}
            onPress={() => updateSettings({ binaryManagementMode: 'custom' })}
          >
            <Text style={[styles.switchButtonText, mode === 'custom' && styles.switchButtonTextActive]}>Custom Path</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.switchLabel}>yt-dlp Engine</Text>
            <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ytVersion}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.switchLabel}>FFmpeg Processor</Text>
            <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ffmpegVersion}</Text>
          </View>

          {mode === 'managed' && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Auto-Update on Startup</Text>
                  <Text style={styles.switchDesc}>Check for and download yt-dlp/ffmpeg updates automatically</Text>
                </View>
                <Switch
                  value={settings.autoUpdateBinaries !== false}
                  onValueChange={(value) => updateSettings({ autoUpdateBinaries: value })}
                  trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}50` }}
                  thumbColor={settings.autoUpdateBinaries !== false ? theme.colors.primary : theme.colors.textTertiary}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity 
                  style={[styles.actionButton, isUpdatingYt && { opacity: 0.7 }]}
                  onPress={handleUpdateYt}
                >
                  {isUpdatingYt ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.actionButtonText}>Update yt-dlp</Text>}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border }, isRedownloading && { opacity: 0.7 }]}
                  onPress={handleRedownload}
                >
                  {isRedownloading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Force Redownload All</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'custom' && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to yt-dlp binary</Text>
              <View style={styles.pathContainer}>
                <TextInput
                  style={[styles.pathInput, { flex: 1 }]}
                  placeholder="e.g. /usr/local/bin/yt-dlp"
                  placeholderTextColor="#555"
                  value={settings.ytdlpPath}
                  onChangeText={(text) => updateSettings({ ytdlpPath: text })}
                />
                <TouchableOpacity 
                  style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
                  onPress={async () => {
                    try {
                      const result = await saucebox?.invoke('select-file', 'Select yt-dlp Executable');
                      if (result) updateSettings({ ytdlpPath: result });
                    } catch (e) { console.error(e); }
                  }}
                >
                  <Text style={styles.browseButtonText}>Browse</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.switchDesc, { marginBottom: 8, marginTop: 16 }]}>Custom path to ffmpeg binary</Text>
              <View style={styles.pathContainer}>
                <TextInput
                  style={[styles.pathInput, { flex: 1 }]}
                  placeholder="e.g. /usr/bin/ffmpeg"
                  placeholderTextColor="#555"
                  value={settings.ffmpegPath}
                  onChangeText={(text) => updateSettings({ ffmpegPath: text })}
                />
                <TouchableOpacity 
                  style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
                  onPress={async () => {
                    try {
                      const result = await saucebox?.invoke('select-file', 'Select ffmpeg Executable');
                      if (result) updateSettings({ ffmpegPath: result });
                    } catch (e) { console.error(e); }
                  }}
                >
                  <Text style={styles.browseButtonText}>Browse</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'system' && (
            <Text style={[styles.switchDesc, { marginTop: 8 }]}>
              SauceBox is attempting to use the globally installed binaries from your system PATH environment variable.
            </Text>
          )}
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.switchLabel}>Custom Video Player</Text>
          </View>
          <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to your preferred external video player (e.g. VLC, MPV). Leave empty to use the built-in app player.</Text>
          <View style={styles.pathContainer}>
            <TextInput
              style={[styles.pathInput, { flex: 1 }]}
              placeholder="Select custom player executable..."
              placeholderTextColor="#555"
              value={settings.customPlayerPath || ''}
              editable={false}
            />
            <TouchableOpacity 
              style={[styles.browseButton, { minWidth: 80, paddingHorizontal: 16 }]}
              onPress={async () => {
                try {
                  const result = await saucebox?.invoke('select-file', 'Select Video Player Executable');
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
  switcherContainer: { flexDirection: 'row', backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border },
  switchButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  switchButtonActive: { backgroundColor: theme.colors.primary },
  switchButtonText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  switchButtonTextActive: { color: '#000' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  switchDesc: { fontSize: 13, color: theme.colors.textTertiary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  pathContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  pathInput: { backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none' },
  browseButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', cursor: 'pointer', minWidth: 120, alignItems: 'center' },
  browseButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  actionButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#000', fontSize: 14, fontWeight: '600' }
});
