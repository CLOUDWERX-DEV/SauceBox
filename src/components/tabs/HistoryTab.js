import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useStore } from '../../store';
import { theme } from '../../theme';
import VideoPlayer from '../VideoPlayer';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function HistoryTab() {
  const history = useStore(state => state.history);
  const clearHistory = useStore(state => state.clearHistory);
  const removeFromHistory = useStore(state => state.removeFromHistory);
  const updateHistoryRating = useStore(state => state.updateHistoryRating);
  const addTagToHistory = useStore(state => state.addTagToHistory);
  const removeTagFromHistory = useStore(state => state.removeTagFromHistory);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterResolution, setFilterResolution] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [filterTag, setFilterTag] = useState(null);
  const [editingTagId, setEditingTagId] = useState(null);
  const [newTagText, setNewTagText] = useState('');

  const allTags = Array.from(new Set(history.flatMap(h => h.tags || []))).sort();

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

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const handlePlayVideo = async (item) => {
    try {
      const videoPath = await ipcRenderer?.invoke('get-video-path', `${item.title}.mp4`);
      setSelectedVideo({ path: videoPath, title: item.title });
    } catch (error) {
      console.error('Failed to find video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };

  const handleOpenFolder = async (item) => {
    try {
      const videoPath = await ipcRenderer?.invoke('get-video-path', `${item.title}.mp4`);
      await ipcRenderer?.invoke('open-folder', videoPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open folder. The video file may have been moved or deleted.');
    }
  };

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResolution = filterResolution === 'all' ||
        (item.resolution && item.resolution.includes(filterResolution));
      const matchesRating = filterRating === 0 || (item.rating || 0) >= filterRating;
      const matchesTag = !filterTag || (item.tags && item.tags.includes(filterTag));
      return matchesSearch && matchesResolution && matchesRating && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'date':
        default:
          return b.timestamp - a.timestamp;
      }
    });

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Video Gallery</Text>
            <Text style={styles.subtitle}>
              {history.length === 0
                ? 'No downloads yet'
                : filteredHistory.length === history.length
                  ? `${history.length} Videos`
                  : `${filteredHistory.length} of ${history.length} shown`}
            </Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterBar}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search videos..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterControls}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'date' && styles.filterButtonActive]}
                  onPress={() => setSortBy('date')}
                >
                  <Text style={[styles.filterButtonText, sortBy === 'date' && styles.filterButtonTextActive]}>
                    📅 Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'title' && styles.filterButtonActive]}
                  onPress={() => setSortBy('title')}
                >
                  <Text style={[styles.filterButtonText, sortBy === 'title' && styles.filterButtonTextActive]}>
                    🔤 Title
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'duration' && styles.filterButtonActive]}
                  onPress={() => setSortBy('duration')}
                >
                  <Text style={[styles.filterButtonText, sortBy === 'duration' && styles.filterButtonTextActive]}>
                    ⏱️ Duration
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'rating' && styles.filterButtonActive]}
                  onPress={() => setSortBy('rating')}
                >
                  <Text style={[styles.filterButtonText, sortBy === 'rating' && styles.filterButtonTextActive]}>
                    ★ Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Quality:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterResolution === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilterResolution('all')}
                >
                  <Text style={[styles.filterButtonText, filterResolution === 'all' && styles.filterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterResolution === '1080' && styles.filterButtonActive]}
                  onPress={() => setFilterResolution('1080')}
                >
                  <Text style={[styles.filterButtonText, filterResolution === '1080' && styles.filterButtonTextActive]}>
                    1080p
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterResolution === '720' && styles.filterButtonActive]}
                  onPress={() => setFilterResolution('720')}
                >
                  <Text style={[styles.filterButtonText, filterResolution === '720' && styles.filterButtonTextActive]}>
                    720p
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterResolution === '480' && styles.filterButtonActive]}
                  onPress={() => setFilterResolution('480')}
                >
                  <Text style={[styles.filterButtonText, filterResolution === '480' && styles.filterButtonTextActive]}>
                    480p
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Min Rating:</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterRating === 0 && styles.filterButtonActive]}
                  onPress={() => setFilterRating(0)}
                >
                  <Text style={[styles.filterButtonText, filterRating === 0 && styles.filterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.filterButton, filterRating === n && styles.filterButtonActive]}
                    onPress={() => setFilterRating(n)}
                  >
                    <Text style={[styles.filterButtonText, filterRating === n && styles.filterButtonTextActive]}>
                      {'★'.repeat(n)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {allTags.length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tag:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                  <TouchableOpacity
                    style={[styles.filterButton, !filterTag && styles.filterButtonActive]}
                    onPress={() => setFilterTag(null)}
                  >
                    <Text style={[styles.filterButtonText, !filterTag && styles.filterButtonTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {allTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.filterButton, filterTag === tag && styles.filterButtonActive]}
                      onPress={() => setFilterTag(tag)}
                    >
                      <Text style={[styles.filterButtonText, filterTag === tag && styles.filterButtonTextActive]}>
                        🏷️ {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🕳️</Text>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>Your downloads will appear here</Text>
            <Text style={styles.emptySubtext}>What happens in LocalFap, stays in LocalFap... unless you want it to 😏</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <View style={styles.historyGrid}>
            {filteredHistory.map((item, index) => (
              <View key={item.id || index} style={styles.historyCard}>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.folderButtonHistory}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenFolder(item);
                    }}
                  >
                    <Text style={styles.folderButtonTextHistory}>📁</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {item.thumbnail && (
                  <Image 
                    source={{ uri: item.thumbnail }} 
                    style={styles.thumbnail}
                  />
                )}
                <View style={styles.overlay}>
                  <TouchableOpacity 
                    style={styles.playButton}
                    onPress={() => handlePlayVideo(item)}
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
                        <Text style={styles.historyMetaText}>{item.resolution}</Text>
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
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeTagFromHistory(item.id, tag); }}>
                          <Text style={styles.tagRemoveText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    {editingTagId === item.id ? (
                      <TextInput 
                        style={styles.tagInput}
                        autoFocus
                        value={newTagText}
                        onChangeText={setNewTagText}
                        onBlur={() => { setEditingTagId(null); setNewTagText(''); }}
                        onSubmitEditing={() => {
                          if (newTagText.trim()) addTagToHistory(item.id, newTagText.trim());
                          setEditingTagId(null);
                          setNewTagText('');
                        }}
                      />
                    ) : (
                      <TouchableOpacity style={styles.addTagButton} onPress={(e) => { e.stopPropagation(); setEditingTagId(item.id); }}>
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
                          updateHistoryRating(item.id, star);
                        }}
                        style={styles.starButton}
                      >
                        <Text style={star <= (item.rating || 0) ? styles.starFilled : styles.starEmpty}>
                          {star <= (item.rating || 0) ? '★' : '★'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <VideoPlayer 
        visible={!!selectedVideo}
        videoPath={selectedVideo?.path}
        videoTitle={selectedVideo?.title}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  content: {
    padding: 32,
  },
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
  filterBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    outlineStyle: 'none',
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  clearSearchText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterControls: {
    gap: 16,
  },
  filterGroup: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  filterButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.primary,
  },
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
  emptySubtext: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 400,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  historyCard: {
    width: 'calc(33.333% - 14px)',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
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
    backgroundColor: theme.colors.surfaceLight,
    resizeMode: 'cover',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    padding: 16,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  uploaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyMetaText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  historyMetaDot: {
    fontSize: 12,
    color: '#444',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 10,
    paddingTop: 10,
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
    fontSize: 18,
    color: theme.colors.primary,
  },
  starEmpty: {
    fontSize: 18,
    color: '#444444',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tagBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  tagRemoveText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  addTagButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tagInput: {
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.text,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    outlineStyle: 'none',
    width: 80,
  }
});
