import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';
import logoSrc from '../../public/logo.png';
import HelpModal from './HelpModal';
import packageJson from '../../package.json';

const version = packageJson.version;
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function TitleBar({ vaultEnabled, onLock }) {
  const [helpVisible, setHelpVisible] = useState(false);
  const serverStatus = useStore(state => state.serverStatus);
  
  const handleMinimize = () => ipcRenderer?.invoke('minimize-window');
  const handleMaximize = () => ipcRenderer?.invoke('maximize-window');
  const handleClose = () => ipcRenderer?.invoke('close-window');

  return (
    <>
      <View style={styles.titleBar}>
        <View style={styles.titleSection}>
          <Image source={{ uri: logoSrc }} style={styles.logo} />
          <Text style={styles.title}>
            <Text style={{ color: '#ffffff' }}>Sauce</Text>
            <Text style={{ color: theme.colors.primary }}>Box</Text>
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{version}</Text>
          </View>
        </View>

        {serverStatus?.running && (
          <View style={styles.serverBadge}>
            <View style={styles.serverDot} />
            <Text style={styles.serverText}>BROADCASTING AT <Text style={styles.serverUrl}>{serverStatus.url}</Text></Text>
          </View>
        )}

        <View style={styles.controls}>
          {vaultEnabled && (
            <TouchableOpacity style={styles.lockButton} onPress={onLock}>
              <Text style={styles.lockButtonText}>🔒 Lock</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.helpButton} onPress={() => setHelpVisible(true)}>
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
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
      
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    height: 40,
    backgroundColor: theme.colors.surfaceLight,
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
  versionBadge: {
    backgroundColor: `${theme.colors.primary}40`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}80`,
  },
  versionText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  serverBadge: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 8,
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    boxShadow: `0 0 8px ${theme.colors.primary}`,
  },
  serverText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  serverUrl: {
    color: '#fff',
    fontWeight: '600',
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
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  helpButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: 8,
  },
  helpButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  }
});
