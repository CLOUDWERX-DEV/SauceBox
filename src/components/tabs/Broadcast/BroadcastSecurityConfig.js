import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import { theme } from '../../../theme';
import ConfirmModal from '../../ConfirmModal';

export default function BroadcastSecurityConfig({
  exposeInternetEnabled, setExposeInternetEnabled,
  authEnabled, setAuthEnabled,
  username, setUsername,
  password, setPassword,
  serverRunning
}) {
  const [showExposureConfirm, setShowExposureConfirm] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔒 Security & Exposure</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Expose Server to the Internet</Text>
            <Text style={styles.switchDesc}>Show your public IP address to access the server from anywhere. Requires port forwarding on your router.</Text>
          </View>
          <Switch
            value={exposeInternetEnabled}
            onValueChange={(val) => {
              if (val) {
                setShowExposureConfirm(true);
                return;
              }
              setExposeInternetEnabled(val);
            }}
            disabled={serverRunning}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.error}40` }}
            thumbColor={exposeInternetEnabled ? theme.colors.error : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Require Authentication</Text>
            <Text style={styles.switchDesc}>Require a username and password to access the web interface</Text>
          </View>
          <Switch
            value={authEnabled}
            onValueChange={setAuthEnabled}
            disabled={serverRunning}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={authEnabled ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        {authEnabled && (
          <View style={{ marginTop: 24, gap: 16 }}>
            <View>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.textInputFull]}
                value={username}
                onChangeText={setUsername}
                editable={!serverRunning}
              />
            </View>
            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.textInputFull]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Leave empty for no password"
                placeholderTextColor={theme.colors.textTertiary}
                editable={!serverRunning}
              />
            </View>
          </View>
        )}
      </View>
      <ConfirmModal
        visible={showExposureConfirm}
        title="Expose Media Server"
        message="Exposing your media server to the internet can be dangerous. Anyone with your public IP address and port can access your videos if port forwarding is enabled on your router. Enable authentication before using this."
        confirmText="Expose Server"
        onConfirm={() => {
          setExposeInternetEnabled(true);
          setShowExposureConfirm(false);
        }}
        onCancel={() => setShowExposureConfirm(false)}
      />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInputFull: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
    width: '100%',
  },
});
