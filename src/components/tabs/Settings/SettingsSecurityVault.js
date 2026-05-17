import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';

const formatHotkeyDisplay = (hotkey) => {
  if (!hotkey) return 'Ctrl+Shift+H';
  const isMac = typeof process !== 'undefined' && process.platform === 'darwin';
  return hotkey.replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl');
};

export default function SettingsSecurityVault() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [tempPin, setTempPin] = useState('');

  const getPinResetInfo = () => {
    try {
      const os = window.require ? window.require('os') : null;
      const path = window.require ? window.require('path') : null;
      if (!os || !path) return null;

      const home = os.homedir();
      const platform = process.platform;

      if (platform === 'win32') {
        const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
        const file = path.join(appData, 'saucebox', 'saucebox-settings.json');
        return {
          os: 'Windows',
          file,
          shortPath: `%APPDATA%\\saucebox\\saucebox-settings.json`,
        };
      } else if (platform === 'darwin') {
        const file = path.join(home, 'Library', 'Application Support', 'saucebox', 'saucebox-settings.json');
        return {
          os: 'macOS',
          file,
          shortPath: `~/Library/Application Support/saucebox/saucebox-settings.json`,
        };
      } else {
        const file = path.join(home, '.config', 'saucebox', 'saucebox-settings.json');
        return {
          os: 'Linux',
          file,
          shortPath: `~/.config/saucebox/saucebox-settings.json`,
        };
      }
    } catch (e) {
      return null;
    }
  };

  const pinResetInfo = getPinResetInfo();

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
  }, [isRecording, updateSettings]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔒 Security & Vault</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>App Lock (Vault Mode)</Text>
            <Text style={styles.switchDesc}>Require a PIN code to open SauceBox</Text>
          </View>
          <Switch
            value={settings.vaultEnabled}
            onValueChange={(value) => updateSettings({ vaultEnabled: value })}
            trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
            thumbColor={settings.vaultEnabled ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>
        
        {settings.vaultEnabled && (
          <>
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
                  }
                }}
              />
            </View>

            {pinResetInfo && (
              <View style={styles.resetInfoBox}>
                <Text style={styles.resetInfoTitle}>🔑 Forgot your PIN?</Text>
                <Text style={styles.resetInfoText}>
                  Close SauceBox, then open the settings file below in any text editor to change your PIN manually, or delete the file entirely to reset all settings.
                </Text>
                <View style={styles.resetPathBox}>
                  <Text style={styles.resetPathText}>
                    {pinResetInfo.shortPath}
                  </Text>
                </View>
                <Text style={[styles.resetInfoText, { color: theme.colors.error, marginTop: 8, fontWeight: '600' }]}>
                  ⚠️ WARNING: Do NOT delete "saucebox-gallery.json" or you will lose your entire video library!
                </Text>
                {process.platform === 'win32' && (
                  <Text style={styles.resetTip}>💡 Tip: Press Win+R, type %APPDATA%\saucebox and open saucebox-settings.json.</Text>
                )}
                {process.platform === 'darwin' && (
                  <Text style={styles.resetTip}>💡 Tip: In Finder press Cmd+Shift+G and paste the path above.</Text>
                )}
                {(process.platform !== 'win32' && process.platform !== 'darwin') && (
                  <Text style={styles.resetTip}>
                    {'💡 Tip: Run in terminal — '}
                    <Text style={{ fontFamily: 'monospace', color: theme.colors.primary }}>
                      {`nano "${pinResetInfo.file}"`}
                    </Text>
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Stealth Mode Hotkey</Text>
            <Text style={styles.switchDesc}>Global shortcut to instantly hide the app</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.pathInput, { flex: 0, minWidth: 150, height: 40, justifyContent: 'center', paddingVertical: 0, paddingHorizontal: 12, backgroundColor: isRecording ? `${theme.colors.primary}20` : theme.colors.surface, borderColor: isRecording ? theme.colors.primary : theme.colors.border }]}>
              <Text style={{ color: isRecording ? theme.colors.primary : theme.colors.text, textAlign: 'center', fontWeight: '600' }}>
                {isRecording ? 'Listening...' : formatHotkeyDisplay(settings.stealthHotkey)}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.saveButton, { marginTop: 0, backgroundColor: isRecording ? theme.colors.error : theme.colors.primary }]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Text style={[styles.saveButtonText, { color: isRecording ? '#fff' : '#000' }]}>{isRecording ? 'Cancel' : 'Record'}</Text>
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
  pathInput: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none' },
  saveButton: {
    backgroundColor: theme.colors.primary,
    width: 150,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
  },
  saveButtonText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  resetInfoBox: { marginTop: 16, padding: 14, backgroundColor: `${theme.colors.primary}10`, borderRadius: 10, borderWidth: 1, borderColor: `${theme.colors.primary}30`, borderStyle: 'dashed' },
  resetInfoTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginBottom: 6 },
  resetInfoText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  resetPathBox: { marginTop: 10, padding: 8, backgroundColor: theme.colors.surface, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border },
  resetPathText: { fontFamily: 'monospace', fontSize: 11, color: theme.colors.text, userSelect: 'text' },
  resetTip: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 8 }
});
