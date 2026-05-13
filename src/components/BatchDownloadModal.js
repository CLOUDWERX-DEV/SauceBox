import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { theme } from '../theme';

export default function BatchDownloadModal({ visible, onClose, onSubmit }) {
  const [urls, setUrls] = useState('');

  const handleSubmit = () => {
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urlList.length > 0) {
      onSubmit(urlList);
      setUrls('');
      onClose();
    }
  };

  const urlCount = urls.split('\n').filter(url => url.trim().length > 0).length;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📦 Batch Download</Text>
              <Text style={styles.subtitle}>Add multiple URLs at once</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Paste URLs (one per line)</Text>
            <TextInput
              style={styles.textarea}
              placeholder="https://example.com/video1&#10;https://example.com/video2&#10;https://example.com/video3"
              placeholderTextColor="#555"
              value={urls}
              onChangeText={setUrls}
              multiline
              numberOfLines={12}
            />
            
            <View style={styles.info}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📊</Text>
                <Text style={styles.infoText}>
                  {urlCount} URL{urlCount !== 1 ? 's' : ''} detected
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⚡</Text>
                <Text style={styles.infoText}>
                  All videos will be queued simultaneously
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, urlCount === 0 && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={urlCount === 0}
            >
              <Text style={styles.submitButtonText}>
                🚀 Download {urlCount > 0 ? `${urlCount} Video${urlCount !== 1 ? 's' : ''}` : 'All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modal: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textarea: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
    minHeight: 240,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  info: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  }
});
