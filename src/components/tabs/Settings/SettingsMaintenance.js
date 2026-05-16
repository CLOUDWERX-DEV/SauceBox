import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../store';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsMaintenance() {
  const settings = useStore(state => state.settings);
  const history = useStore(state => state.history);
  const removeFromHistory = useStore(state => state.removeFromHistory);

  const handleFindDuplicates = async () => {
    try {
      const dups = await ipcRenderer?.invoke('find-duplicates', settings.downloadPath);
      if (dups && dups.length > 0) {
        let msg = `Found ${dups.length} sets of duplicates:\n\n`;
        dups.forEach((d, i) => {
          if (i < 5) msg += `Size ${d.size} bytes: ${d.files.length} files\n`;
        });
        if (dups.length > 5) msg += `...and ${dups.length - 5} more sets.`;
        alert(msg);
      } else {
        alert('No exact duplicates found!');
      }
    } catch (e) {
      alert('Error finding duplicates: ' + e.message);
    }
  };

  const handleFindOrphans = async () => {
    try {
      const dbPaths = history.map(h => h.path).filter(Boolean);
      const orphans = await ipcRenderer?.invoke('find-orphans', { downloadPath: settings.downloadPath, dbPaths });
      if (orphans && orphans.length > 0) {
        alert(`Found ${orphans.length} orphaned files in your directory that are NOT in the Gallery database.\n\nFirst few:\n${orphans.slice(0, 5).join('\n')}`);
      } else {
        alert('Your directory is clean! No orphaned video files found.');
      }
    } catch (e) {
      alert('Error finding orphans: ' + e.message);
    }
  };

  const handleVerifyDatabase = async () => {
    try {
      const dbPaths = history.map(h => h.path).filter(Boolean);
      const missing = await ipcRenderer?.invoke('verify-database', dbPaths);
      if (missing && missing.length > 0) {
        const confirm = window.confirm(`Found ${missing.length} entries in your Gallery where the file has been deleted manually from the disk.\n\nWould you like to automatically remove these broken entries from your Gallery now?`);
        if (confirm) {
          missing.forEach(missingPath => {
            const item = history.find(h => h.path === missingPath);
            if (item) removeFromHistory(item.id);
          });
          alert('Database cleaned successfully!');
        }
      } else {
        alert('Database is perfect! All files in the Gallery exist on disk.');
      }
    } catch (e) {
      alert('Error verifying database: ' + e.message);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🧹 Maintenance & Cleanup</Text>
      <View style={styles.card}>
        
        <View style={[styles.switchRow, { marginTop: 16 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Find Exact Duplicates</Text>
            <Text style={styles.switchDesc}>Scan storage for identical video files to reclaim disk space</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.primary }]}
            onPress={handleFindDuplicates}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Scan Storage</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Find Orphaned Files</Text>
            <Text style={styles.switchDesc}>Find files on your disk that are not registered in your Gallery</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.primary }]}
            onPress={handleFindOrphans}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Find Orphans</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Verify Database Integrity</Text>
            <Text style={styles.switchDesc}>Remove broken Gallery entries where the file has been deleted manually</Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.error }]}
            onPress={handleVerifyDatabase}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.error }]}>Clean Database</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  switchDesc: { fontSize: 13, color: theme.colors.textTertiary },
  saveButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', cursor: 'pointer' },
  saveButtonText: { fontSize: 14, fontWeight: '600' }
});
