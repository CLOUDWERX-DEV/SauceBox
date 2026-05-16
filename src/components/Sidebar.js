import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { useStore } from '../store';
import { theme } from '../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
const openExternal = (url) => ipcRenderer?.invoke('open-external', url);

const tabs = [
  { id: 'download', icon: '⬇️', label: 'Download', subtitle: 'Download Videos' },
  { id: 'queue', icon: '📋', label: 'Queue', subtitle: 'Download Queue' },
  { id: 'history', icon: '🎬', label: 'Gallery', subtitle: 'Video Archive' },
  { id: 'broadcast', icon: '📡', label: 'Media Server', subtitle: 'VR & Cast Network' },
  { id: 'settings', icon: '⚙️', label: 'Settings', subtitle: 'Tweaks and Customization' }
];

export default function Sidebar({ activeTab, onTabChange }) {
  const downloads = useStore(state => state.downloads);
  const history = useStore(state => state.history);

  const activeDownloads = downloads.filter(d => d.status === 'pending' || d.status === 'downloading');

  const [isRotating, setIsRotating] = useState(false);

  const getBadgeCount = (tabId) => {
    if (tabId === 'queue') return activeDownloads.length;
    if (tabId === 'history') return history.length;
    return 0;
  };

  const handleFeelingLucky = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);

    if (history.length > 0) {
      const randomVideo = history[Math.floor(Math.random() * history.length)];
      if (randomVideo.path) {
        const customPlayerPath = useStore.getState().settings.customPlayerPath;
        ipcRenderer?.invoke('open-video', { filepath: randomVideo.path, customPlayerPath });
        const notificationsEnabled = useStore.getState().settings?.systemNotifications !== false;
        if (window.Notification && notificationsEnabled) {
          new Notification('🎲 Random Local Sauce!', {
            body: `Enjoy: ${randomVideo.title}`,
            icon: 'logo.png'
          });
        }
      }
    }
  };

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity 
        style={styles.logoSection}
        onPress={handleFeelingLucky}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: 'logo.png' }} 
          style={[styles.logo, isRotating && styles.logoRotating]} 
        />
        <Text style={styles.logoText}>
          <Text style={{ color: '#ffffff' }}>Sauce</Text>
          <Text style={{ color: theme.colors.primary }}>Box</Text>
        </Text>
        {history.length > 0 && <Text style={styles.logoSubtext}>Feeling Lucky? 🎲</Text>}
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabsContentContainer}>
        {tabs.map((tab) => {
          const badgeCount = getBadgeCount(tab.id);
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <View style={styles.tabTextContainer}>
                <View style={styles.tabLabelRow}>
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                    {tab.label}
                  </Text>
                  {badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badgeCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tabSubtitle}>{tab.subtitle}</Text>
              </View>
              {activeTab === tab.id && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Active Downloads</Text>
            <Text style={styles.statValue}>{activeDownloads.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Videos</Text>
            <Text style={styles.statValue}>{history.length}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.donateButtonSide}
          onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
        >
          <Text style={styles.donateButtonText}>☕ Buy me a coffee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  logoSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 12,
    resizeMode: 'contain',
    transition: 'transform 0.5s ease-in-out',
  },
  logoRotating: {
    transform: [{ rotate: '360deg' }, { scale: 1.2 }],
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  tabsContentContainer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 14,
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  tabIcon: {
    fontSize: 26,
  },
  tabTextContainer: {
    flex: 1,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  activeTabLabel: {
    color: theme.colors.primary,
  },
  tabSubtitle: {
    fontSize: 11,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    width: 4,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statsCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#444',
    textAlign: 'center',
  },
  donateButtonSide: {
    backgroundColor: '#FFDD00',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  },
  donateButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  }
});
