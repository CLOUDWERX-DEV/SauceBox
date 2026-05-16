import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';
import HelpContent from './Help/HelpContent';

export default function HelpModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('basics');
  const panicHotkey = useStore(state => state.settings?.stealthHotkey || 'CommandOrControl+Shift+H');

  // Convert Electron accelerator format to human-readable display
  const formatHotkey = (accel) => {
    return accel
      .split('+')
      .map(part => {
        switch (part.trim()) {
          case 'CommandOrControl':
          case 'CmdOrCtrl':
            return 'Ctrl';
          case 'Command':
          case 'Cmd':
            return '⌘';
          case 'Control':
          case 'Ctrl':
            return 'Ctrl';
          case 'Alt':
          case 'Option':
            return 'Alt';
          case 'Shift':
            return 'Shift';
          case 'Super':
            return 'Super';
          case 'Escape':
            return 'Esc';
          case 'Space':
            return 'Space';
          default:
            return part.charAt(0).toUpperCase() + part.slice(1);
        }
      })
      .join(' + ');
  };

  const displayHotkey = formatHotkey(panicHotkey);

  if (!visible) return null;

  const tabs = [
    { id: 'basics', icon: '🚀', label: 'Getting Started' },
    { id: 'gallery', icon: '🗄️', label: 'Gallery & Import' },
    { id: 'extension', icon: '🧩', label: 'Web Extension' },
    { id: 'stealth', icon: '🥷', label: 'Stealth & Privacy' },
    { id: 'player', icon: '🎬', label: 'Playback & Clips' },
    { id: 'broadcast', icon: '📡', label: 'VR & Broadcasting' },
    { id: 'advanced', icon: '⚙️', label: 'Advanced Settings' },
    { id: 'sites', icon: '🔞', label: 'Supported Sites' },
    { id: 'troubleshooting', icon: '🔧', label: 'Troubleshooting' }
  ];

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.headerIconWrapper}>
                <Text style={styles.headerIconText}>?</Text>
              </View>
              <View>
                <Text style={styles.title}>SauceBox Documentation</Text>
                <Text style={styles.headerSubtext}>The Definitive Guide</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Sidebar */}
            <ScrollView style={styles.sidebar}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                    {isActive && <View style={styles.tabActiveIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Main Content Area */}
            <ScrollView style={styles.contentArea}>
              <HelpContent activeTab={activeTab} displayHotkey={displayHotkey} />
            </ScrollView>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    width: '85%',
    maxWidth: 1100,
    height: '85%',
    maxHeight: 800,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtext: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingVertical: 24,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  tabIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  tabActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  contentArea: {
    flex: 1,
    padding: 40,
    backgroundColor: theme.colors.surface,
  }
});
