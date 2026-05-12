import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { theme } from '../theme';

export default function EditVideoModal({ visible, video, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [uploader, setUploader] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setUploader(video.uploader || '');
      setTags(video.tags || []);
    }
  }, [video, visible]);

  if (!visible || !video) return null;

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    onSave({
      ...video,
      title,
      uploader,
      tags
    });
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Metadata</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Video title"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Creator / Uploader</Text>
              <TextInput
                style={styles.input}
                value={uploader}
                onChangeText={setUploader}
                placeholder="Uploader name"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                  <Text style={styles.addTagButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsWrapper}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <Text style={styles.removeTagText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.readonlyStats}>
              <Text style={styles.statText}>Resolution: {video.resolution || 'Unknown'}</Text>
              <Text style={styles.statText}>Duration: {video.duration ? `${Math.floor(video.duration/60)}m ${video.duration%60}s` : 'Unknown'}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 500,
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    color: theme.colors.textSecondary,
    fontSize: 20,
  },
  content: {
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addTagButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: 240,
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
  },
  removeTagText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  readonlyStats: {
    marginTop: 12,
    padding: 16,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  statText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '700',
  }
});
