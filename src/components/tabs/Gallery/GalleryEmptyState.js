import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

export default function GalleryEmptyState({ isSearchEmpty, onImport, onNavigate }) {
  if (isSearchEmpty) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🕳️</Text>
      <Text style={styles.emptyTitle}>Gallery is Empty</Text>
      <Text style={styles.emptyText}>Your downloads will appear here.</Text>
      
      <TouchableOpacity 
        style={[styles.importButton, { marginTop: 24 }]} 
        onPress={onImport}
      >
        <Text style={styles.importButtonText}>📥 IMPORT VIDEOS</Text>
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <Text style={[styles.emptyText, { fontSize: 14, marginBottom: 0 }]}>
          Or use the 
        </Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('download')}>
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 14, marginHorizontal: 4 }}>Download Tab</Text>
        </TouchableOpacity>
        <Text style={[styles.emptyText, { fontSize: 14, marginBottom: 0 }]}>
          to grab new videos from the web!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    marginBottom: 8,
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
});
