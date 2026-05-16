import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../store';

const qualityOptions = [
  { value: 'best', label: 'Best Quality', desc: 'Highest available quality', icon: '👑' },
  { value: '2160', label: '4K (2160p)', desc: 'Ultra HD', icon: '💎' },
  { value: '1440', label: '2K (1440p)', desc: 'Quad HD', icon: '✨' },
  { value: '1080', label: '1080p', desc: 'Full HD', icon: '🎬' },
  { value: '720',  label: '720p',  desc: 'HD',      icon: '📺' },
  { value: '480',  label: '480p',  desc: 'SD',       icon: '📱' },
  { value: '240',  label: '240p',  desc: 'Low',      icon: '🔋' },
];

export default function SettingsVideoQuality() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎬 Video Quality</Text>
      <View style={styles.card}>
        <Text style={{ color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
          SauceBox will attempt to download the exact resolution you select below. If the video site does not offer the selected resolution (or higher), SauceBox will automatically fallback to the closest available quality underneath it to ensure the download succeeds.
        </Text>
        {qualityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.qualityOption,
              settings.quality === option.value && styles.qualityOptionActive
            ]}
            onPress={() => updateSettings({ quality: option.value })}
          >
            <View style={styles.qualityIconContainer}>
              <Text style={styles.qualityIcon}>{option.icon}</Text>
            </View>
            <View style={styles.qualityInfo}>
              <Text style={[
                styles.qualityLabel,
                settings.quality === option.value && styles.qualityLabelActive
              ]}>
                {option.label}
              </Text>
              <Text style={styles.qualityDesc}>{option.desc}</Text>
            </View>
            {settings.quality === option.value && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Preferred Container</Text>
            <Text style={styles.switchDesc}>Format for downloaded videos</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['mp4', 'mkv', 'webm', 'any'].map(format => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatBadge,
                  settings.preferredContainer === format && styles.formatBadgeActive
                ]}
                onPress={() => updateSettings({ preferredContainer: format })}
              >
                <Text style={[
                  styles.formatBadgeText,
                  settings.preferredContainer === format && styles.formatBadgeTextActive
                ]}>{format.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  qualityOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 8, marginBottom: 8, backgroundColor: theme.colors.surfaceLight, cursor: 'pointer', gap: 12 },
  qualityOptionActive: { backgroundColor: `${theme.colors.primary}20`, borderWidth: 2, borderColor: theme.colors.primary },
  qualityIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  qualityIcon: { fontSize: 20 },
  qualityInfo: { flex: 1 },
  qualityLabel: { fontSize: 15, fontWeight: '600', color: '#999', marginBottom: 4 },
  qualityLabelActive: { color: theme.colors.primary },
  qualityDesc: { fontSize: 13, color: theme.colors.textTertiary },
  checkmarkContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 16, color: '#fff', fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  switchDesc: { fontSize: 13, color: theme.colors.textTertiary },
  formatBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border, cursor: 'pointer' },
  formatBadgeActive: { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary },
  formatBadgeText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  formatBadgeTextActive: { color: theme.colors.primary }
});
