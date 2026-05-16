import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import packageJson from '../../../../package.json';

const version = packageJson.version;
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsAbout() {
  const openExternal = (url) => ipcRenderer?.invoke('open-external', url);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ℹ️ About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>{version}</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Backend</Text>
          <Text style={styles.aboutValue}>yt-dlp</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Framework</Text>
          <Text style={styles.aboutValue}>React Native + Electron</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Website</Text>
          <TouchableOpacity onPress={() => openExternal('https://saucebox.app')}>
            <Text style={[styles.aboutValue, { color: theme.colors.primary, textDecorationLine: 'underline', cursor: 'pointer' }]}>
              saucebox.app
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.aboutRow, styles.aboutRowLast]}>
          <Text style={styles.aboutLabel}>Made by</Text>
          <TouchableOpacity onPress={() => openExternal('https://cloudwerxlab.com')}>
            <Text style={[styles.aboutValue, { color: theme.colors.primary, textDecorationLine: 'underline', cursor: 'pointer' }]}>
              CLOUDWERX LAB
            </Text>
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
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceLight },
  aboutRowLast: { borderBottomWidth: 0 },
  aboutLabel: { fontSize: 14, color: theme.colors.textSecondary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text }
});
