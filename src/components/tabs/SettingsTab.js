import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useStore } from '../../store';
import { theme } from '../../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function SettingsTab() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const [ytVersion, setYtVersion] = useState('Detecting...');
  const [ffmpegVersion, setFfmpegVersion] = useState('Detecting...');
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const [diskSpace, setDiskSpace] = useState(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        await ipcRenderer?.send('update-binary-paths', { 
          ytdlpPath: settings.ytdlpPath, 
          ffmpegPath: settings.ffmpegPath 
        });
        const versions = await ipcRenderer?.invoke('get-binary-versions');
        setYtVersion(versions.ytDlp);
        setFfmpegVersion(versions.ffmpeg);
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      }
    };
    fetchVersions();
  }, [settings.ytdlpPath, settings.ffmpegPath]);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const keys = [];
      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      
      let key = e.key;
      const upperKey = key.toUpperCase();
      
      if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(upperKey)) {
        if (key === ' ') key = 'Space';
        else if (upperKey === 'ESCAPE') key = 'Escape';
        else if (upperKey === 'ARROWUP') key = 'Up';
        else if (upperKey === 'ARROWDOWN') key = 'Down';
        else if (upperKey === 'ARROWLEFT') key = 'Left';
        else if (upperKey === 'ARROWRIGHT') key = 'Right';
        else if (key.length === 1) key = upperKey;
        else key = upperKey; // F1, etc.
        
        keys.push(key);
        const combo = keys.join('+');
        updateSettings({ stealthHotkey: combo });
        setIsRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isRecording]);
  
  useEffect(() => {
    let interval;
    const fetchDiskSpace = async () => {
      const os = window.require ? window.require('os') : null;
      const defaultPath = os ? `${os.homedir()}/Downloads/LocalFap` : '';
      const checkPath = settings.downloadPath || defaultPath;
      if (checkPath && ipcRenderer) {
        try {
          const res = await ipcRenderer.invoke('get-disk-space', checkPath);
          if (res && res.success) {
            setDiskSpace(res);
          }
        } catch (e) {}
      }
    };
    fetchDiskSpace();
    interval = setInterval(fetchDiskSpace, 10000);
    return () => clearInterval(interval);
  }, [settings.downloadPath]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [customPath, setCustomPath] = useState(settings.downloadPath);

  const handleBrowseFolder = async () => {
    try {
      const result = await ipcRenderer?.invoke('select-folder');
      if (result) {
        setCustomPath(result);
        updateSettings({ downloadPath: result });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const qualityOptions = [
    { value: 'best', label: 'Best Quality', desc: 'Highest available quality', icon: '👑' },
    { value: '1080p', label: '1080p', desc: 'Full HD', icon: '🎬' },
    { value: '720p', label: '720p', desc: 'HD', icon: '📺' },
    { value: '480p', label: '480p', desc: 'SD', icon: '📱' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience 🎨</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📁 Download Location</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Save downloads to:</Text>
          <View style={styles.pathContainer}>
            <TextInput
              style={styles.pathInput}
              placeholder="~/Downloads/LocalFap (default)"
              placeholderTextColor="#555"
              value={customPath}
              onChangeText={setCustomPath}
              editable={false}
            />
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={handleBrowseFolder}
            >
              <Text style={styles.browseButtonText}>📁 Browse</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Click Browse to select a custom download folder</Text>

          {diskSpace && (
            <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.switchLabel}>Disk Storage</Text>
                <Text style={[styles.aboutValue, { color: diskSpace.free < 10 * 1024 * 1024 * 1024 ? theme.colors.error : theme.colors.primary }]}>
                  {formatBytes(diskSpace.free)} Free
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: theme.colors.surfaceLight, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <View style={{ 
                  height: '100%', 
                  backgroundColor: diskSpace.free < 10 * 1024 * 1024 * 1024 ? theme.colors.error : theme.colors.primary, 
                  width: `${(diskSpace.used / diskSpace.total) * 100}%` 
                }} />
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                Total: {formatBytes(diskSpace.total)} • Used: {formatBytes(diskSpace.used)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 Video Quality</Text>
        <View style={styles.card}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Security & Vault</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>App Lock (Vault Mode)</Text>
              <Text style={styles.switchDesc}>Require a PIN code to open LocalFap</Text>
            </View>
            <Switch
              value={settings.vaultEnabled}
              onValueChange={(value) => updateSettings({ vaultEnabled: value })}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
              thumbColor={settings.vaultEnabled ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>
          
          {settings.vaultEnabled && (
            <View style={[styles.switchRow, { marginTop: 24 }]}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Vault PIN Code</Text>
                <Text style={styles.switchDesc}>4-digit PIN required to unlock</Text>
              </View>
              <TextInput
                style={[styles.pathInput, { flex: 0, width: 100, textAlign: 'center', letterSpacing: isEditingPin ? 4 : 8 }]}
                value={isEditingPin ? tempPin : settings.vaultPin}
                secureTextEntry={!isEditingPin}
                placeholder={isEditingPin ? "0000" : ""}
                maxLength={4}
                keyboardType="numeric"
                onFocus={() => {
                  setIsEditingPin(true);
                  setTempPin('');
                }}
                onBlur={() => {
                  setIsEditingPin(false);
                  setTempPin('');
                }}
                onChangeText={(text) => {
                  const num = text.replace(/[^0-9]/g, '');
                  setTempPin(num);
                  if (num.length === 4) {
                    updateSettings({ vaultPin: num });
                    setIsEditingPin(false);
                    // Note: Blur happens automatically when we stop editing, but we rely on the visual state change.
                  }
                }}
              />
            </View>
          )}

          <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Stealth Mode Hotkey</Text>
              <Text style={styles.switchDesc}>Global shortcut to instantly hide the app</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.pathInput, { flex: 0, minWidth: 180, backgroundColor: isRecording ? `${theme.colors.primary}20` : theme.colors.surface, borderColor: isRecording ? theme.colors.primary : theme.colors.border }]}>
                <Text style={{ color: isRecording ? theme.colors.primary : theme.colors.text, textAlign: 'center', fontWeight: '600' }}>
                  {isRecording ? 'Listening...' : (settings.stealthHotkey || 'CommandOrControl+Shift+H')}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.saveButton, { marginTop: 0, paddingHorizontal: 16, backgroundColor: isRecording ? theme.colors.error : theme.colors.primary }]}
                onPress={() => setIsRecording(!isRecording)}
              >
                <Text style={styles.saveButtonText}>{isRecording ? 'Cancel' : 'Record'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.switchRow, { marginTop: 16 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Pause Downloads on Stealth</Text>
              <Text style={styles.switchDesc}>Halt all active downloads when stealth mode is triggered</Text>
            </View>
            <Switch
              value={settings.stealthPauseDownloads}
              onValueChange={(value) => updateSettings({ stealthPauseDownloads: value })}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}50` }}
              thumbColor={settings.stealthPauseDownloads ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 16 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Mute Notifications on Stealth</Text>
              <Text style={styles.switchDesc}>Hide desktop notifications while app is locked or hidden</Text>
            </View>
            <Switch
              value={settings.stealthMuteNotifications}
              onValueChange={(value) => updateSettings({ stealthMuteNotifications: value })}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}50` }}
              thumbColor={settings.stealthMuteNotifications ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛠️ System Binaries</Text>
        <View style={styles.card}>
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.switchLabel}>yt-dlp Path</Text>
              <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ytVersion}</Text>
            </View>
            <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to yt-dlp binary (leave empty for system PATH)</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="e.g. /usr/local/bin/yt-dlp"
              placeholderTextColor="#555"
              value={settings.ytdlpPath}
              onChangeText={(text) => updateSettings({ ytdlpPath: text })}
            />
          </View>

          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.switchLabel}>ffmpeg Path</Text>
              <Text style={[styles.aboutValue, { fontSize: 12, color: theme.colors.primary }]}>{ffmpegVersion}</Text>
            </View>
            <Text style={[styles.switchDesc, { marginBottom: 8 }]}>Custom path to ffmpeg binary (leave empty for system PATH)</Text>
            <TextInput
              style={styles.pathInput}
              placeholder="e.g. /usr/bin/ffmpeg"
              placeholderTextColor="#555"
              value={settings.ffmpegPath}
              onChangeText={(text) => updateSettings({ ffmpegPath: text })}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Advanced</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Auto-Tagging (Domain & Uploader)</Text>
              <Text style={styles.switchDesc}>Automatically tag videos based on source site and creator</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💖 Support</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Support the development of LocalFap</Text>
          <Text style={[styles.hint, { marginBottom: 16, fontSize: 13, color: theme.colors.textSecondary }]}>
            If you enjoy using this app and want to support further development, consider buying me a coffee!
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#FFDD00', alignSelf: 'flex-start' }]}
            onPress={() => window.open('https://buymeacoffee.com/cloudwerxl3', '_blank')}
          >
            <Text style={[styles.saveButtonText, { color: '#000' }]}>☕ Buy me a coffee</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Backend</Text>
            <Text style={styles.aboutValue}>yt-dlp</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Framework</Text>
            <Text style={styles.aboutValue}>React Native + Electron</Text>
          </View>
          <View style={[styles.aboutRow, styles.aboutRowLast]}>
            <Text style={styles.aboutLabel}>Made by</Text>
            <TouchableOpacity onPress={() => window.open('http://cloudwerxlab.com', '_blank')}>
              <Text style={[styles.aboutValue, { color: theme.colors.primary, textDecorationLine: 'underline', cursor: 'pointer' }]}>
                CLOUDWERX LAB
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  content: {
    padding: 32,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  pathContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pathInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    cursor: 'pointer',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    cursor: 'pointer',
    minWidth: 120,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceLight,
    cursor: 'pointer',
    gap: 12,
  },
  qualityOptionActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  qualityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityIcon: {
    fontSize: 20,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  qualityLabelActive: {
    color: theme.colors.primary,
  },
  qualityDesc: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
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
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  aboutRowLast: {
    borderBottomWidth: 0,
  },
  aboutLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  formatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  formatBadgeActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  formatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  formatBadgeTextActive: {
    color: theme.colors.primary,
  }
});
