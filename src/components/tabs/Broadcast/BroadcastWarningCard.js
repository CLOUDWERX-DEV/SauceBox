import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

export default function BroadcastWarningCard({ downloadPath }) {
  return (
    <View style={styles.warningCard}>
      <Text style={styles.warningCardTitle}>⚠️ Network Security Warning</Text>
      <Text style={styles.warningCardText}>
        The folder currently set as your download path ({downloadPath || 'your downloads folder'}) will be fully shared over the network. 
        Anyone with this server URL can access and play the media inside.
      </Text>
      <Text style={[styles.warningCardText, { marginTop: 8, fontWeight: 'bold' }]}>
        For improved security on untrusted networks, please enable "Require Authentication" in the Security section below and set a strong password. This ensures only authorized users can access your media streams.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: `${theme.colors.error}20`,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.error}80`,
    marginBottom: 24,
  },
  warningCardTitle: {
    color: theme.colors.error,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningCardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
