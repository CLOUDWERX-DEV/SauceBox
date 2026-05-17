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
        
        {/* Core Appeal */}
        <View style={styles.header}>
          <Text style={styles.title}>Fuel the Fire. Keep it Free.</Text>
          <Text style={styles.desc}>
            SauceBox is hand-crafted with absolute passion by CLOUDWERX LAB. We believe high-performance, private media tools should belong to everyone. We will <Text style={styles.highlight}>never</Text> track your data, restrict features behind paywalls, or lock your vault.
          </Text>
          <Text style={styles.desc}>
            Every speed optimization, visual trimmer enhancement, and cross-platform compile takes considerable late nights and high-octane caffeine. If SauceBox has upgraded your media experience, consider throwing some fuel in our tank!
          </Text>
        </View>

        {/* Donation Tiers Grid */}
        <Text style={styles.subHeading}>🎖️ Support Tiers</Text>
        <View style={styles.tiersGrid}>
          <TouchableOpacity 
            style={styles.tierCard}
            onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
          >
            <Text style={styles.tierEmoji}>☕</Text>
            <Text style={styles.tierTitle}>Coffee Tier</Text>
            <Text style={styles.tierPrice}>$5</Text>
            <Text style={styles.tierDesc}>Keep us sharp and caffeinated.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tierCard}
            onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
          >
            <Text style={styles.tierEmoji}>🍺</Text>
            <Text style={styles.tierTitle}>Beer Tier</Text>
            <Text style={styles.tierPrice}>$10</Text>
            <Text style={styles.tierDesc}>For those late-night bug hunts.</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tierCard}
            onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
          >
            <Text style={styles.tierEmoji}>🚀</Text>
            <Text style={styles.tierTitle}>Legend Tier</Text>
            <Text style={styles.tierPrice}>$25+</Text>
            <Text style={styles.tierDesc}>Accelerate features & releases.</Text>
          </TouchableOpacity>
        </View>

        {/* Master CTA */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
          >
            <Text style={styles.saveButtonText}>☕ Support CLOUDWERX LAB</Text>
          </TouchableOpacity>
          <Text style={styles.thankYouText}>All support directly enables cross-platform builds, server maintenance, and future features. Thank you! 🙏</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 12, letterSpacing: 0.5 },
  desc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  highlight: { color: theme.colors.primary, fontWeight: '700' },

  subHeading: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  tiersGrid: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  tierCard: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 10, borderWidth: 1, borderColor: `${theme.colors.primary}15`, padding: 18, alignItems: 'center', cursor: 'pointer' },
  tierEmoji: { fontSize: 24, marginBottom: 8 },
  tierTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  tierPrice: { fontSize: 18, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 },
  tierDesc: { fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 15 },

  actionSection: { alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingTop: 24 },
  saveButton: { width: '100%', maxWidth: 320, height: 46, borderRadius: 8, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  saveButtonText: { fontSize: 14, fontWeight: '800', color: '#000000' },
  thankYouText: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 12, textAlign: 'center' }
});
