import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-qr-code';
import { theme } from '../../../theme';

export default function BroadcastServerInfo({ localIp, externalIp, port, exposeInternetEnabled }) {
  const handleCopy = (copyUrl) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(copyUrl)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => {
          fallbackCopy(copyUrl);
        });
    } else {
      fallbackCopy(copyUrl);
    }
  };

  const fallbackCopy = (copyUrl) => {
    const el = document.createElement('textarea');
    el.value = copyUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Copied to clipboard!');
  };

  return (
    <View style={{ gap: 24, marginBottom: 32 }}>
      <View style={styles.activeInfoCard}>
        <View style={styles.activeInfoQr}>
          <QRCode value={`http://${localIp}:${port}`} size={120} bgColor={`${theme.colors.primary}10`} fgColor={theme.colors.text} />
          <Text style={styles.qrTextSmall}>Scan to Connect</Text>
        </View>
        <View style={styles.activeInfoDetails}>
          <Text style={styles.activeLabel}>Local Network Server:</Text>
          <View style={styles.ipContainer}>
            <Text style={styles.ipText}>http://{localIp}:{port}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={() => handleCopy(`http://${localIp}:${port}`)}>
              <Text style={styles.copyButtonText}>Copy URL</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Make sure your TV or VR Headset is on the same WiFi network.</Text>
        </View>
      </View>

      {exposeInternetEnabled && externalIp && (
        <View style={[styles.activeInfoCard, { borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}10` }]}>
          <View style={[styles.activeInfoQr, { borderColor: theme.colors.error }]}>
            <QRCode value={`http://${externalIp}:${port}`} size={120} bgColor={`${theme.colors.error}10`} fgColor={theme.colors.text} />
            <Text style={[styles.qrTextSmall, { color: theme.colors.error }]}>Scan to Connect</Text>
          </View>
          <View style={styles.activeInfoDetails}>
            <Text style={styles.activeLabel}>Public Internet Server:</Text>
            <View style={[styles.ipContainer, { borderColor: theme.colors.error }]}>
              <Text style={[styles.ipText, { color: theme.colors.error }]}>http://{externalIp}:{port}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={() => handleCopy(`http://${externalIp}:${port}`)}>
                <Text style={styles.copyButtonText}>Copy URL</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Warning: This requires Port Forwarding on your router to work.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activeInfoCard: {
    backgroundColor: `${theme.colors.primary}10`,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  activeInfoQr: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrTextSmall: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeInfoDetails: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 16,
    width: '100%',
  },
  ipText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    cursor: 'pointer',
  },
  copyButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  hintText: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
