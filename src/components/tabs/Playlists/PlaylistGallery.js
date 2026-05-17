import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import ConfirmModal from '../../ConfirmModal';
import { theme } from '../../../theme';
import { styles } from './PlaylistStyles';

export default function PlaylistGallery({ playlists, history, onOpen, onCreate, onPlay, onDelete, onUpdatePlaylist }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingTagId, setEditingTagId] = useState(null);
  const [newTagText, setNewTagText] = useState('');

  const handleAddTag = (playlistId, tag) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !(playlist.tags || []).includes(tag)) {
      onUpdatePlaylist(playlistId, { tags: [...(playlist.tags || []), tag] });
    }
  };

  const handleRemoveTag = (playlistId, tag) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      onUpdatePlaylist(playlistId, { tags: (playlist.tags || []).filter(t => t !== tag) });
    }
  };

  const handleUpdateRating = (playlistId, rating) => {
    onUpdatePlaylist(playlistId, { rating });
  };

  const getPlaylistStats = (playlist) => {
    const items = (playlist.items || [])
      .map(id => history.find(h => h.id === id))
      .filter(Boolean);
    
    const totalDuration = items.reduce((sum, v) => sum + (v.duration || 0), 0);
    const totalSize = items.reduce((sum, v) => sum + (Number(v.filesize) || 0), 0);
    
    return { count: items.length, totalDuration, totalSize };
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const getCoverImage = (playlist) => {
    if (playlist.coverImage) return playlist.coverImage;
    // Use the first video's thumbnail as fallback
    const firstId = (playlist.items || [])[0];
    if (firstId) {
      const video = history.find(h => h.id === firstId);
      if (video?.thumbnail) return video.thumbnail;
    }
    return null;
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 32, paddingBottom: 60 }}>
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 8 }}>
            Playlists
          </Text>
          <Text style={{ fontSize: 16, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
            Create and manage your personal video collections 🗂️
          </Text>
        </View>

        <View style={styles.galleryGrid}>
          <TouchableOpacity style={styles.createCard} onPress={onCreate}>
            <Text style={styles.createCardIcon}>➕</Text>
            <Text style={styles.createCardText}>New Playlist</Text>
          </TouchableOpacity>

          {playlists.map(playlist => {
            const stats = getPlaylistStats(playlist);
            const cover = getCoverImage(playlist);
            return (
              <View
                key={playlist.id}
                style={styles.playlistCard}
              >
                <View style={{ position: 'relative' }}>
                  <View style={styles.playlistCardActionsTop}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={(e) => { e.stopPropagation(); setDeleteTarget(playlist); }}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <VideoThumbnail uri={cover} style={styles.playlistCardImage} />
                  <View style={styles.playlistCardOverlay}>
                    <TouchableOpacity 
                      style={styles.playButtonLarge}
                      onPress={() => {
                        const items = (playlist.items || []).map(id => history.find(h => h.id === id)).filter(Boolean);
                        onPlay({ ...playlist, items });
                      }}
                    >
                      <Text style={styles.playIconLarge}>▶</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.playlistCardBody}>
                  <Text style={styles.playlistCardName} numberOfLines={1}>
                    {playlist.name || 'Untitled Playlist'}
                  </Text>
                  <View style={styles.playlistCardStats}>
                    <Text style={styles.playlistCardStat}>🎬 {stats.count} videos</Text>
                    <Text style={styles.playlistCardStat}>⏱️ {formatDuration(stats.totalDuration)}</Text>
                    {stats.totalSize > 0 && (
                      <Text style={styles.playlistCardStat}>💾 {formatSize(stats.totalSize)}</Text>
                    )}
                  </View>
                  <View style={styles.tagsContainer}>
                    {(playlist.tags || []).map(tag => (
                      <View key={tag} style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{tag}</Text>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleRemoveTag(playlist.id, tag); }}>
                          <Text style={styles.tagRemoveText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    {editingTagId === playlist.id ? (
                      <TextInput 
                        style={styles.tagInput}
                        autoFocus
                        value={newTagText}
                        onChangeText={setNewTagText}
                        onBlur={() => { setEditingTagId(null); setNewTagText(''); }}
                        onSubmitEditing={() => {
                          if (newTagText.trim()) handleAddTag(playlist.id, newTagText.trim());
                          setEditingTagId(null);
                          setNewTagText('');
                        }}
                      />
                    ) : (
                      <TouchableOpacity style={styles.addTagButton} onPress={(e) => { e.stopPropagation(); setEditingTagId(playlist.id); }}>
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
                          handleUpdateRating(playlist.id, star);
                        }}
                        style={styles.starButton}
                      >
                        <Text style={star <= (playlist.rating || 0) ? styles.starFilled : styles.starEmpty}>
                          {star <= (playlist.rating || 0) ? '★' : '★'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    <View style={styles.playlistCardActionsBottom}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => onOpen(playlist.id)}
                      >
                        <Text style={styles.editButtonText}>✏️ Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              </View>
            );
          })}
        </View>

        {playlists.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗂️</Text>
            <Text style={styles.emptyStateText}>No playlists yet</Text>
            <Text style={styles.emptyStateSubText}>
              Click "New Playlist" above to create your first collection
            </Text>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${deleteTarget?.name || 'Untitled Playlist'}"? Your video files will NOT be affected.`}
        confirmText="Delete"
        confirmColor={theme.colors.error}
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
