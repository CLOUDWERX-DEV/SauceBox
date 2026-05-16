import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsSupport() {
  const openExternal = (url) => ipcRenderer?.invoke('open-external', url);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💖 Support</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Support the development of SauceBox</Text>
        <Text style={[styles.hint, { marginBottom: 16, fontSize: 13, color: theme.colors.textSecondary }]}>
          If you enjoy using this app and want to support further development, consider buying me a coffee!
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: '#FFDD00', alignSelf: 'flex-start' }]}
          onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
        >
          <Text style={[styles.saveButtonText, { color: '#000' }]}>☕ Buy me a coffee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  hint: { fontSize: 12, color: theme.colors.textTertiary, fontStyle: 'italic' },
  saveButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', cursor: 'pointer' },
  saveButtonText: { fontSize: 14, fontWeight: '600' }
});
