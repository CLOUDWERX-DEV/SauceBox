import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsDownloadLocation() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const [diskSpace, setDiskSpace] = useState(null);
  const [customPath, setCustomPath] = useState(settings.downloadPath);

  useEffect(() => {
    let interval;
    const fetchDiskSpace = async () => {
      const os = window.require ? window.require('os') : null;
      const defaultPath = os ? `${os.homedir()}/Downloads/SauceBox` : '';
      const checkPath = settings.downloadPath || defaultPath;
      if (checkPath && ipcRenderer) {
        try {
          const res = await ipcRenderer.invoke('get-disk-space', checkPath);
          if (res && res.success) {
            setDiskSpace(res);
          }
        } catch (e) {}
      }
    };
    fetchDiskSpace();
    interval = setInterval(fetchDiskSpace, 10000);
    return () => clearInterval(interval);
  }, [settings.downloadPath]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleBrowseFolder = async () => {
    try {
      const result = await ipcRenderer?.invoke('select-folder');
      if (result) {
        setCustomPath(result);
        updateSettings({ downloadPath: result });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📁 Download Location</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Save downloads to:</Text>
        <View style={styles.pathContainer}>
          <TextInput
            style={styles.pathInput}
            placeholder="~/Downloads/SauceBox (default)"
            placeholderTextColor="#555"
            value={customPath}
            onChangeText={setCustomPath}
            editable={false}
          />
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={handleBrowseFolder}
          >
            <Text style={styles.browseButtonText}>📁 Browse</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Click Browse to select a custom download folder</Text>

        {diskSpace && (
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.switchLabel}>Disk Storage</Text>
              <Text style={[styles.aboutValue, { color: diskSpace.free < 10 * 1024 * 1024 * 1024 ? theme.colors.error : theme.colors.primary }]}>
                {formatBytes(diskSpace.free)} Free
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: theme.colors.surfaceLight, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <View style={{ 
                height: '100%', 
                backgroundColor: diskSpace.free < 10 * 1024 * 1024 * 1024 ? theme.colors.error : theme.colors.primary, 
                width: `${(diskSpace.used / diskSpace.total) * 100}%` 
              }} />
            </View>
            <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
              Total: {formatBytes(diskSpace.total)} • Used: {formatBytes(diskSpace.used)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  pathContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  pathInput: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none' },
  browseButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', cursor: 'pointer', minWidth: 120 },
  browseButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, color: theme.colors.textTertiary, fontStyle: 'italic' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  aboutValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text }
});
