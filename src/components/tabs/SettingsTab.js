import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';

import SettingsDownloadLocation from './Settings/SettingsDownloadLocation';
import SettingsVideoQuality from './Settings/SettingsVideoQuality';
import SettingsSecurityVault from './Settings/SettingsSecurityVault';
import SettingsSystemBinaries from './Settings/SettingsSystemBinaries';
import SettingsMaintenance from './Settings/SettingsMaintenance';
import SettingsAdvanced from './Settings/SettingsAdvanced';
import SettingsSupport from './Settings/SettingsSupport';
import SettingsAbout from './Settings/SettingsAbout';

export default function SettingsTab({ onNavigate }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience 🎨</Text>
      </View>

      <SettingsDownloadLocation />
      <SettingsVideoQuality />
      <SettingsSecurityVault />
      <SettingsSystemBinaries />
      <SettingsMaintenance />
      <SettingsAdvanced />
      <SettingsSupport />
      <SettingsAbout />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  content: {
    padding: 32,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
