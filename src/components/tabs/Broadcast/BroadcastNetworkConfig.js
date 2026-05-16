import React from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import { theme } from '../../../theme';

export default function BroadcastNetworkConfig({
  serverName, setServerName,
  port, setPort,
  dlnaEnabled, setDlnaEnabled,
  serverRunning
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Network Configuration</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Server Name (M3U Metadata)</Text>
            <Text style={styles.switchDesc}>The name of your playlist/server shown in supported media players</Text>
          </View>
          <TextInput
            style={[styles.textInput, { width: 150 }]}
            value={serverName}
            onChangeText={setServerName}
            editable={!serverRunning}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Server Port</Text>
            <Text style={styles.switchDesc}>The port used for the HTTP media server</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
            editable={!serverRunning}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>DLNA / UPnP Broadcasting</Text>
            <Text style={styles.switchDesc}>Allow Smart TVs and Consoles to automatically discover SauceBox on the network</Text>
          </View>
          <Switch
            value={dlnaEnabled}
            onValueChange={setDlnaEnabled}
            disabled={serverRunning}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={dlnaEnabled ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
    width: 100,
    textAlign: 'center',
  },
});
