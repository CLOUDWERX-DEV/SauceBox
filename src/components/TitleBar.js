import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function TitleBar({ vaultEnabled, onLock }) {
  const handleMinimize = () => ipcRenderer?.invoke('minimize-window');
  const handleMaximize = () => ipcRenderer?.invoke('maximize-window');
  const handleClose = () => ipcRenderer?.invoke('close-window');

  return (
    <View style={styles.titleBar}>
      <View style={styles.titleSection}>
        <Image source={{ uri: 'logo.png' }} style={styles.logo} />
        <Text style={styles.title}>LocalFap</Text>
        <Text style={styles.subtitle}>Your offline collection manager</Text>
      </View>
      <View style={styles.controls}>
        {vaultEnabled && (
          <TouchableOpacity style={styles.lockButton} onPress={onLock}>
            <Text style={styles.lockButtonText}>🔒 Lock</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button} onPress={handleMinimize}>
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleMaximize}>
          <Text style={styles.buttonText}>□</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={handleClose}>
          <Text style={styles.buttonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    height: 40,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    WebkitAppRegion: 'drag',
    cursor: 'move',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    WebkitAppRegion: 'drag',
    cursor: 'move',
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    WebkitAppRegion: 'no-drag',
    cursor: 'default',
  },
  button: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceLight,
  },
  closeButton: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '300',
  },
  lockButton: {
    height: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  }
});
