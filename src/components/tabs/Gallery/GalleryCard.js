import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import { theme } from '../../../theme';
import Tooltip from '../../Tooltip';

const formatDuration = (seconds) => {
  if (!seconds) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatResolutionBadge = (res) => {
  if (!res) return '';
  if (res.includes('2160')) return '4K';
  if (res.includes('1440')) return '2K';
  return res;
};

const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num)) return null;
  const mb = num / (1024 * 1024);
  const gb = num / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function GalleryCard({ 
  item, 
  onPlay, 
  onOpenFolder, 
  onQuickCast, 
  onDelete, 
  onEdit, 
  onUpdateRating, 
  onAddTag, 
  onRemoveTag 
}) {
  const [editingTag, setEditingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  return (
    <View style={styles.historyCard}>
      <View style={styles.cardActions}>
        <Tooltip content="Quick Cast" position="bottom">
          <TouchableOpacity 
            style={styles.folderButtonHistory}
            onPress={(e) => {
              e.stopPropagation();
              onQuickCast(item);
            }}
          >
            <Text style={[styles.folderButtonTextHistory, { fontSize: 10, color: theme.colors.primary }]}>📡</Text>
          </TouchableOpacity>
        </Tooltip>
        <Tooltip content="Open Folder" position="bottom">
          <TouchableOpacity 
            style={styles.folderButtonHistory}
            onPress={(e) => {
              e.stopPropagation();
              onOpenFolder(item);
            }}
          >
            <Text style={styles.folderButtonTextHistory}>📁</Text>
          </TouchableOpacity>
        </Tooltip>
        <Tooltip content="Delete" position="bottom">
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </Tooltip>
      </View>
      <VideoThumbnail
        uri={item.thumbnail}
        style={styles.thumbnail}
      />
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => onPlay(item)}
        >
          <Text style={styles.playIcon}>▶</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.uploader && item.uploader !== 'Unknown' && (
          <Text style={styles.uploaderName}>
            👤 {item.uploader}
          </Text>
        )}
        <View style={styles.historyMeta}>
          <Text style={styles.historyMetaText}>
            {formatDuration(item.duration)}
          </Text>
          {item.resolution && (
            <>
              <Text style={styles.historyMetaDot}>•</Text>
              <Text style={styles.historyMetaText}>{formatResolutionBadge(item.resolution)}</Text>
            </>
          )}
          {item.filesize && (
            <>
              <Text style={styles.historyMetaDot}>•</Text>
              <Text style={styles.historyMetaText}>{formatFileSize(item.filesize)}</Text>
            </>
          )}
          <Text style={styles.historyMetaDot}>•</Text>
          <Text style={styles.historyMetaText}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        
        <View style={styles.tagsContainer}>
          {(item.tags || []).map(tag => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>{tag}</Text>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemoveTag(item.id, tag); }}>
                <Text style={styles.tagRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {editingTag ? (
            <TextInput 
              style={styles.tagInput}
              autoFocus
              value={newTagText}
              onChangeText={setNewTagText}
              onBlur={() => { setEditingTag(false); setNewTagText(''); }}
              onSubmitEditing={() => {
                if (newTagText.trim()) onAddTag(item.id, newTagText.trim());
                setEditingTag(false);
                setNewTagText('');
              }}
            />
          ) : (
            <TouchableOpacity style={styles.addTagButton} onPress={(e) => { e.stopPropagation(); setEditingTag(true); }}>
              <Text style={styles.addTagButtonText}>+ Tag</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Rate:</Text>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={(e) => {
                e.stopPropagation();
                onUpdateRating(item.id, star);
              }}
              style={styles.starButton}
            >
              <Text style={star <= (item.rating || 0) ? styles.starFilled : styles.starEmpty}>
                {star <= (item.rating || 0) ? '★' : '★'}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.editMetadataButton} 
            onPress={(e) => { e.stopPropagation(); onEdit(item); }}
          >
            <Text style={styles.editMetadataButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    width: 'calc(33.333% - 14px)',
    height: 420,
    flexDirection: 'column',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  cardActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  folderButtonHistory: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  folderButtonTextHistory: {
    fontSize: 16,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    minHeight: 200,
    backgroundColor: theme.colors.surfaceLight,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  playIcon: {
    fontSize: 24,
    color: '#fff',
    marginLeft: 4,
  },
  cardInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    lineHeight: 20,
    height: 40,
  },
  uploaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  historyMetaText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    whiteSpace: 'nowrap',
  },
  historyMetaDot: {
    fontSize: 10,
    color: '#444',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ratingLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  starButton: {
    cursor: 'pointer',
    padding: 2,
  },
  starFilled: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  starEmpty: {
    fontSize: 16,
    color: '#444444',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    overflow: 'hidden',
    maxHeight: 50,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    maxWidth: 120,
  },
  tagBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
  },
  tagRemoveText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  addTagButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  tagInput: {
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.text,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    outlineStyle: 'none',
    width: 80,
  },
  editMetadataButton: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editMetadataButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  }
});
