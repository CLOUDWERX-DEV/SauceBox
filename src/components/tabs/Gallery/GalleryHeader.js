import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num)) return null;
  const mb = num / (1024 * 1024);
  const gb = num / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
};

const formatTotalDuration = (seconds) => {
  const sec = Number(seconds);
  if (!sec || isNaN(sec)) return null;
  const days = Math.floor(sec / (24 * 3600));
  const hours = Math.floor((sec % (24 * 3600)) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
};

export default function GalleryHeader({ 
  historyLength, 
  filteredLength, 
  totalBytes, 
  totalDuration, 
  onImport, 
  onClearAll 
}) {
  const totalSize = formatFileSize(totalBytes);
  const formattedDuration = formatTotalDuration(totalDuration);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Video Gallery</Text>
        {historyLength > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🎥</Text>
              <Text style={styles.statValue}>
                {filteredLength === historyLength ? historyLength : `${filteredLength} / ${historyLength}`}
              </Text>
              <Text style={styles.statLabel}>
                {filteredLength === historyLength ? (historyLength === 1 ? 'Video' : 'Videos') : 'shown'}
              </Text>
            </View>

            {totalSize && (
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>💾</Text>
                <Text style={styles.statValue}>{totalSize}</Text>
                <Text style={styles.statLabel}>Storage</Text>
              </View>
            )}

            {formattedDuration && (
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statValue}>{formattedDuration}</Text>
                <Text style={styles.statLabel}>Playtime</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 6 }}>
        {historyLength > 0 && (
          <>
            <TouchableOpacity style={styles.importButton} onPress={onImport}>
              <Text style={styles.importButtonText}>📥 IMPORT VIDEOS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
              <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}15`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  importButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  importButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  clearButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
