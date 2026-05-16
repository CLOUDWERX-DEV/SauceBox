import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { queueStyles as styles } from './QueueStyles';

export default function EmptyQueueState({ onNavigate }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Queue is Empty</Text>
      <Text style={styles.emptyText}>Add some downloads to get started!</Text>
      
      <TouchableOpacity 
        style={[styles.clearButton, { marginTop: 24, backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]} 
        onPress={() => onNavigate && onNavigate('download')}
      >
        <Text style={[styles.clearButtonText, { color: '#000', fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }]}>Go to Download Tab</Text>
      </TouchableOpacity>
    </View>
  );
}
