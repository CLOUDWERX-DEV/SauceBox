import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

export default function BroadcastStatusBanner({ serverRunning, onToggleServer }) {
  return (
    <View style={styles.statusBanner}>
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: serverRunning ? theme.colors.primary : theme.colors.error }]} />
        <Text style={styles.statusText}>
          {serverRunning ? 'Server is Running' : 'Server is Offline'}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.toggleButton, { backgroundColor: serverRunning ? theme.colors.error : theme.colors.primary }]}
        onPress={() => onToggleServer()}
      >
        <Text style={[styles.toggleButtonText, serverRunning && { color: '#fff' }]}>
          {serverRunning ? 'Stop Server' : 'Start Server'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
