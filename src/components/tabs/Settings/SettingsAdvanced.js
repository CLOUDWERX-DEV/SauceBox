import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../store';

export default function SettingsAdvanced() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Advanced</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-Tagging (Domain/Provider)</Text>
            <Text style={styles.switchDesc}>Automatically tag videos based on their source site (e.g. Pornhub, Spankbang)</Text>
          </View>
          <Switch
            value={settings.autoTagDomainUploader}
            onValueChange={(value) => updateSettings({ autoTagDomainUploader: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}50` }}
            thumbColor={settings.autoTagDomainUploader ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Safety Disk Threshold (GB)</Text>
            <Text style={styles.switchDesc}>Stop downloading if free space drops below this (0 to disable)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.pathInput, { flex: 0, width: 60, textAlign: 'center', padding: 8 }]}
              value={settings.minFreeSpaceGB !== undefined ? settings.minFreeSpaceGB.toString() : '5'}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateSettings({ minFreeSpaceGB: isNaN(num) ? 0 : num });
              }}
              keyboardType="numeric"
            />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, width: 25 }}>GB</Text>
          </View>
        </View>

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-download</Text>
            <Text style={styles.switchDesc}>Start downloading immediately after adding URL</Text>
          </View>
          <Switch
            value={settings.autoDownload}
            onValueChange={(value) => updateSettings({ autoDownload: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.autoDownload ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-Start Media Server</Text>
            <Text style={styles.switchDesc}>Automatically start the Broadcast stream server when app launches</Text>
          </View>
          <Switch
            value={settings.autoStartBroadcast}
            onValueChange={(value) => updateSettings({ autoStartBroadcast: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.autoStartBroadcast ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>On-the-Fly Transcoding</Text>
            <Text style={styles.switchDesc}>Force stream unsupported formats (mkv, webm) to MP4 (Requires ffmpeg)</Text>
          </View>
          <Switch
            value={settings.broadcastTranscode || false}
            onValueChange={(value) => updateSettings({ broadcastTranscode: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.broadcastTranscode ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-Clear Completed</Text>
            <Text style={styles.switchDesc}>Remove videos from the Queue automatically when finished</Text>
          </View>
          <Switch
            value={settings.autoClearCompleted}
            onValueChange={(value) => updateSettings({ autoClearCompleted: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.autoClearCompleted ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Desktop Notifications</Text>
            <Text style={styles.switchDesc}>Show system notification when a download finishes</Text>
          </View>
          <Switch
            value={settings.systemNotifications}
            onValueChange={(value) => updateSettings({ systemNotifications: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.systemNotifications ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>
        
        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Concurrent Downloads</Text>
            <Text style={styles.switchDesc}>Maximum number of simultaneous downloads (0 = Unlimited)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.pathInput, { flex: 0, width: 60, textAlign: 'center', padding: 8 }]}
              value={settings.maxConcurrentDownloads !== undefined ? settings.maxConcurrentDownloads.toString() : '0'}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateSettings({ maxConcurrentDownloads: isNaN(num) ? 0 : num });
              }}
              keyboardType="numeric"
            />
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, width: 65 }}>
              {(!settings.maxConcurrentDownloads || settings.maxConcurrentDownloads === 0) ? 'Unlimited' : 'Videos'}
            </Text>
          </View>
        </View>

        <View style={[styles.switchRow, { marginTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Speed Limit (KB/s)</Text>
            <Text style={styles.switchDesc}>Limit maximum download speed (0 = Unlimited)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={[styles.pathInput, { flex: 0, width: 80, textAlign: 'center', padding: 8 }]}
              value={settings.downloadSpeedLimit !== undefined ? settings.downloadSpeedLimit.toString() : '0'}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                updateSettings({ downloadSpeedLimit: isNaN(num) ? 0 : num });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.switchLabel}>Network Proxy</Text>
            <Text style={styles.switchDesc}>HTTP/SOCKS5 Proxy for yt-dlp to bypass blocks (leave empty for none)</Text>
          </View>
          <TextInput
            style={styles.pathInput}
            placeholder="e.g. http://user:pass@192.168.1.1:1080"
            placeholderTextColor="#555"
            value={settings.proxyString}
            onChangeText={(text) => updateSettings({ proxyString: text })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  switchDesc: { fontSize: 13, color: theme.colors.textTertiary },
  pathInput: { backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none' }
});
