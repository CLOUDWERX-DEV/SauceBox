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

export default function GalleryHeader({ historyLength, filteredLength, totalBytes, onImport, onClearAll }) {
  const totalSize = formatFileSize(totalBytes);
  const countLabel = historyLength === 0
    ? 'No downloads yet'
    : filteredLength === historyLength
      ? `${historyLength} ${historyLength === 1 ? 'Video' : 'Videos'}`
      : `${filteredLength} of ${historyLength} shown`;

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Video Gallery</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.subtitle}>{countLabel}</Text>
          {totalSize && historyLength > 0 && (
            <>
              <Text style={styles.subtitleDot}>·</Text>
              <Text style={styles.subtitleSize}>{totalSize}</Text>
            </>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <TouchableOpacity style={styles.importButton} onPress={onImport}>
          <Text style={styles.importButtonText}>📥 IMPORT VIDEOS</Text>
        </TouchableOpacity>
        {historyLength > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
            <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  subtitleDot: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    opacity: 0.5,
  },
  subtitleSize: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
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
