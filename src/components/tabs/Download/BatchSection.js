import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { downloadStyles as styles } from './DownloadStyles';

export default function BatchSection({ onOpenBatchMode }) {
  return (
    <View style={styles.batchSection}>
      <View style={styles.batchInfo}>
        <Text style={styles.batchTitle}>Need to download multiple videos?</Text>
        <Text style={styles.batchDesc}>Use batch mode to queue multiple URLs at once</Text>
      </View>
      <TouchableOpacity
        style={styles.batchButton}
        onPress={onOpenBatchMode}
      >
        <Text style={styles.batchButtonIcon}>📦</Text>
        <Text style={styles.batchButtonText}>Open Batch Mode</Text>
      </TouchableOpacity>
    </View>
  );
}
