import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import VideoThumbnail from '../VideoThumbnail';
import { useStore } from '../../store';
import { theme } from '../../theme';
import VideoPlayer from '../VideoPlayer';
import ConfirmModal from '../ConfirmModal';
import EditVideoModal from '../EditVideoModal';
import ImportModal from '../ImportModal';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function GalleryTab() {
  const history = useStore(state => state.history);
  const settings = useStore(state => state.settings);
  const clearHistory = useStore(state => state.clearHistory);
  const removeFromHistory = useStore(state => state.removeFromHistory);
  const updateHistoryRating = useStore(state => state.updateHistoryRating);
  const addTagToHistory = useStore(state => state.addTagToHistory);
  const removeTagFromHistory = useStore(state => state.removeTagFromHistory);
  const setQuickCastVideo = useStore(state => state.setQuickCastVideo);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterResolution, setFilterResolution] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);
  const [editingTagId, setEditingTagId] = useState(null);
  const [newTagText, setNewTagText] = useState('');
  const [editingVideo, setEditingVideo] = useState(null);
  const [importVisible, setImportVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [clearDiskToo, setClearDiskToo] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null); // item pending delete
  const [deleteFromDisk, setDeleteFromDisk] = useState(false);

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
    const num = Number(bytes);
    if (!num || isNaN(num)) return null;
    const mb = num / (1024 * 1024);
    const gb = num / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const handlePlayVideo = async (item) => {
    try {
      let videoPath = item.path;
      if (!videoPath) {
        // Fallback for older downloads without absolute path
        videoPath = await ipcRenderer?.invoke('get-video-path', {
          filename: `${item.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      // Spread the full item so VideoPlayer's originalItem has id, tags, rating etc.
      setSelectedVideo({ ...item, path: videoPath });
    } catch (error) {
      console.error('Failed to find video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };

  const handleOpenFolder = async (item) => {
    try {
      let videoPath = item.path;
      if (!videoPath) {
        videoPath = await ipcRenderer?.invoke('get-video-path', {
          filename: `${item.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      await ipcRenderer?.invoke('open-folder', videoPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open folder. The video file may have been moved or deleted.');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    if (deleteFromDisk && deleteConfirmItem.path) {
      await ipcRenderer?.invoke('delete-file', deleteConfirmItem.path);
    }
    removeFromHistory(deleteConfirmItem.id);
    setDeleteConfirmItem(null);
    setDeleteFromDisk(false);
  };

  const handleClearAll = async () => {
    if (clearDiskToo) {
      const paths = history.map(h => h.path).filter(Boolean);
      if (paths.length > 0) {
        await ipcRenderer?.invoke('delete-files', paths);
      }
    }
    clearHistory();
    setClearConfirmVisible(false);
    setClearDiskToo(false);
  };

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResolution = filterResolution === 'all' ||
        (item.resolution && item.resolution.includes(filterResolution));
      const matchesRating = filterRating === 0 || (item.rating || 0) >= filterRating;
      const matchesTag = filterTags.length === 0 || filterTags.every(tag => item.tags && item.tags.includes(tag));
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
            {(() => {
              const totalBytes = history.reduce((acc, h) => acc + (Number(h.filesize) || 0), 0);
              const totalSize = formatFileSize(totalBytes);
              const countLabel = history.length === 0
                ? 'No downloads yet'
                : filteredHistory.length === history.length
                  ? `${history.length} ${history.length === 1 ? 'Video' : 'Videos'}`
                  : `${filteredHistory.length} of ${history.length} shown`;
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.subtitle}>{countLabel}</Text>
                  {totalSize && history.length > 0 && (
                    <>
                      <Text style={styles.subtitleDot}>·</Text>
                      <Text style={styles.subtitleSize}>{totalSize}</Text>
                    </>
                  )}
                </View>
              );
            })()}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity style={styles.importButton} onPress={() => setImportVisible(true)}>
              <Text style={styles.importButtonText}>📥 IMPORT VIDEOS</Text>
            </TouchableOpacity>
            {history.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setClearConfirmVisible(true)}>
                <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
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
                    style={[styles.filterButton, filterTags.length === 0 && styles.filterButtonActive]}
                    onPress={() => setFilterTags([])}
                  >
                    <Text style={[styles.filterButtonText, filterTags.length === 0 && styles.filterButtonTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {allTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.filterButton, filterTags.includes(tag) && styles.filterButtonActive]}
                      onPress={() => {
                        if (filterTags.includes(tag)) {
                          setFilterTags(filterTags.filter(t => t !== tag));
                        } else {
                          setFilterTags([...filterTags, tag]);
                        }
                      }}
                    >
                      <Text style={[styles.filterButtonText, filterTags.includes(tag) && styles.filterButtonTextActive]}>
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
            <Text style={styles.emptyTitle}>Gallery is Empty</Text>
            <Text style={styles.emptyText}>Your downloads will appear here</Text>
            <Text style={styles.emptySubtext}>What happens in SauceBox, stays in SauceBox... unless you want it to 😏</Text>
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
                      setQuickCastVideo(item);
                    }}
                  >
                    <Text style={[styles.folderButtonTextHistory, { fontSize: 10, color: theme.colors.primary }]}>📡</Text>
                  </TouchableOpacity>
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
                      setDeleteFromDisk(false);
                      setDeleteConfirmItem(item);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <VideoThumbnail
                  uri={item.thumbnail}
                  style={styles.thumbnail}
                />
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
                    
                    <TouchableOpacity 
                      style={styles.editMetadataButton} 
                      onPress={(e) => { e.stopPropagation(); setEditingVideo(item); }}
                    >
                      <Text style={styles.editMetadataButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
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
        originalItem={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {/* Per-card delete confirmation */}
      {(() => {
        const singleSize = deleteConfirmItem?.filesize
          ? formatFileSize(deleteConfirmItem.filesize)
          : null;
        return (
          <ConfirmModal
            visible={!!deleteConfirmItem}
            title="Remove Video?"
            message={`Remove "${deleteConfirmItem?.title || 'this video'}" from your gallery?`}
            confirmText="Remove"
            onConfirm={handleDeleteItem}
            onCancel={() => { setDeleteConfirmItem(null); setDeleteFromDisk(false); }}
            checkboxLabel={singleSize
              ? `Also permanently delete the file from disk (${singleSize})`
              : 'Also permanently delete the file from disk'}
            checkboxValue={deleteFromDisk}
            onCheckboxChange={setDeleteFromDisk}
          />
        );
      })()}

      {/* Clear all confirmation */}
      {(() => {
        const totalBytes = history.reduce((acc, h) => acc + (Number(h.filesize) || 0), 0);
        const totalSize = totalBytes > 0 ? formatFileSize(totalBytes) : null;
        const knownCount = history.filter(h => h.filesize).length;
        const sizeLabel = totalSize
          ? `Also permanently delete all video files from disk (${totalSize}${
              knownCount < history.length ? ', known files only' : ''
            })`
          : 'Also permanently delete all video files from disk';
        return (
          <ConfirmModal
            visible={clearConfirmVisible}
            title="Clear Gallery?"
            message="Remove all videos from your gallery? This cannot be undone."
            confirmText="Clear Gallery"
            onConfirm={handleClearAll}
            onCancel={() => { setClearConfirmVisible(false); setClearDiskToo(false); }}
            checkboxLabel={sizeLabel}
            checkboxValue={clearDiskToo}
            onCheckboxChange={setClearDiskToo}
          />
        );
      })()}

      <EditVideoModal
        visible={!!editingVideo}
        video={editingVideo}
        onSave={(updatedVideo) => {
          useStore.getState().updateHistoryItem(updatedVideo.id, updatedVideo);
          setEditingVideo(null);
        }}
        onClose={() => setEditingVideo(null)}
      />

      <ImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
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
  filterBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
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
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
    maxWidth: 160,
  },
  filterButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    height: 420,
    flexDirection: 'column',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
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
