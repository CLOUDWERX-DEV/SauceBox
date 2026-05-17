import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import ConfirmModal from '../../ConfirmModal';
import { theme } from '../../../theme';
import { styles } from './PlaylistStyles';
import GalleryFilterBar from '../Gallery/GalleryFilterBar';

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

export default function PlaylistGallery({
  playlists,
  history,
  onOpen,
  onCreate,
  onPlay,
  onDelete,
  onUpdatePlaylist,
  onQuickCast
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingTagId, setEditingTagId] = useState(null);
  const [newTagText, setNewTagText] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterResolution, setFilterResolution] = useState('all'); // unused for playlists but needed by GalleryFilterBar
  const [filterRating, setFilterRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);

  const allTags = Array.from(new Set(playlists.flatMap(p => p.tags || []))).sort();

  // Compute global stats across ALL playlists (using unique video IDs to prevent double counting if the same video is in multiple playlists!)
  const globalStats = useMemo(() => {
    const allUniqueVideoIds = Array.from(new Set(playlists.flatMap(p => p.items || [])));
    const uniqueVideos = allUniqueVideoIds
      .map(id => history.find(h => h.id === id))
      .filter(Boolean);
      
    const totalDuration = uniqueVideos.reduce((sum, v) => sum + (v.duration || 0), 0);
    const totalSize = uniqueVideos.reduce((sum, v) => sum + (Number(v.filesize) || 0), 0);
    
    return {
      totalPlaylists: playlists.length,
      totalDuration,
      totalSize,
    };
  }, [playlists, history]);

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

  const filteredPlaylists = playlists
    .filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = filterRating === 0 || (item.rating || 0) >= filterRating;
      const matchesTag = filterTags.length === 0 || filterTags.every(tag => item.tags && item.tags.includes(tag));
      return matchesSearch && matchesRating && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.name || 'Untitled').localeCompare(b.name || 'Untitled');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'duration':
          const durA = (a.items||[]).map(id=>history.find(h=>h.id===id)).filter(Boolean).reduce((sum,v)=>sum+(v.duration||0),0);
          const durB = (b.items||[]).map(id=>history.find(h=>h.id===id)).filter(Boolean).reduce((sum,v)=>sum+(v.duration||0),0);
          return durB - durA;
        case 'date':
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 32, flexGrow: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Playlists</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>🗂️</Text>
                <Text style={styles.statValue}>
                  {globalStats.totalPlaylists}
                </Text>
                <Text style={styles.statLabel}>
                  {globalStats.totalPlaylists === 1 ? 'Playlist' : 'Playlists'}
                </Text>
              </View>

              {globalStats.totalSize > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statIcon}>💾</Text>
                  <Text style={styles.statValue}>{formatFileSize(globalStats.totalSize)}</Text>
                  <Text style={styles.statLabel}>Storage</Text>
                </View>
              )}

              {globalStats.totalDuration > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statIcon}>⏱️</Text>
                  <Text style={styles.statValue}>{formatTotalDuration(globalStats.totalDuration)}</Text>
                  <Text style={styles.statLabel}>Playtime</Text>
                </View>
              )}
            </View>
          </View>
          {playlists.length > 0 && (
            <TouchableOpacity style={styles.createPlaylistButton} onPress={onCreate}>
              <Text style={styles.createPlaylistButtonText}>➕ NEW PLAYLIST</Text>
            </TouchableOpacity>
          )}
        </View>

        {playlists.length > 0 && (
          <GalleryFilterBar 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            sortBy={sortBy} setSortBy={setSortBy}
            filterResolution={filterResolution} setFilterResolution={setFilterResolution}
            filterRating={filterRating} setFilterRating={setFilterRating}
            filterTags={filterTags} setFilterTags={setFilterTags}
            allTags={allTags}
          />
        )}

        {playlists.length > 0 && (
          <View style={styles.galleryGrid}>

          {filteredPlaylists.map(playlist => {
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
                      style={styles.folderButtonHistory}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (onQuickCast) onQuickCast(playlist);
                      }}
                    >
                      <Text style={[styles.folderButtonTextHistory, { fontSize: 10, color: theme.colors.primary }]}>📡</Text>
                    </TouchableOpacity>
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
                    
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => onOpen(playlist.id)}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </View>
            );
          })}
          </View>
        )}

        {playlists.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🗂️</Text>
            <Text style={styles.emptyStateText}>No playlists yet</Text>
            <Text style={styles.emptyStateSubText}>
              Create your first playlist collection to get started!
            </Text>
            <TouchableOpacity 
              style={[styles.createPlaylistButton, { marginTop: 24 }]} 
              onPress={onCreate}
            >
              <Text style={styles.createPlaylistButtonText}>➕ CREATE FIRST PLAYLIST</Text>
            </TouchableOpacity>
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
