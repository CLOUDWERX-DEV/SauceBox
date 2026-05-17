import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import VideoThumbnail from '../../VideoThumbnail';
import { theme } from '../../../theme';
import { styles } from './PlaylistStyles';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function PlaylistEditor({
  playlist,
  history,
  onSave,
  onBack,
  onPlayAll,
  onPlayVideo,
  onDelete,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const isNewPlaylist = typeof playlist.id === 'string' && playlist.id.startsWith('new-');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const [draftPlaylist, setDraftPlaylist] = useState({ ...playlist });

  const updateDraft = (fields) => {
    setDraftPlaylist(prev => ({
      ...prev,
      ...fields
    }));
  };

  const handleCustomCover = async () => {
    if (!ipcRenderer) return;
    const filePath = await ipcRenderer.invoke('select-file', 'Select Custom Cover Image');
    if (filePath) {
      updateDraft({ coverImage: `file://${filePath}` });
    }
  };

  // Resolve video IDs to actual history objects
  const playlistItems = useMemo(() => {
    return (draftPlaylist.items || [])
      .map(id => history.find(h => h.id === id))
      .filter(Boolean);
  }, [draftPlaylist.items, history]);

  // Compute stats
  const totalDuration = playlistItems.reduce((sum, v) => sum + (v.duration || 0), 0);
  const totalSize = playlistItems.reduce((sum, v) => sum + (Number(v.filesize) || 0), 0);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  // Filter & sort available videos
  const filteredVideos = useMemo(() => {
    let vids = [...history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      vids = vids.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (v.uploader || '').toLowerCase().includes(q)
      );
    }

    vids.sort((a, b) => {
      switch (sortBy) {
        case 'title': return (a.title || '').localeCompare(b.title || '');
        case 'duration': return (b.duration || 0) - (a.duration || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });

    return vids;
  }, [history, searchQuery, sortBy]);

  const isInPlaylist = (videoId) => (draftPlaylist.items || []).includes(videoId);

  const handleAddToPlaylist = (videoId) => {
    if (!isInPlaylist(videoId)) {
      updateDraft({
        items: [...(draftPlaylist.items || []), videoId]
      });
    }
  };

  const handleRemoveFromPlaylist = (videoId) => {
    updateDraft({
      items: (draftPlaylist.items || []).filter(id => id !== videoId)
    });
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const items = [...(draftPlaylist.items || [])];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    updateDraft({ items });
  };

  const handleMoveDown = (index) => {
    const items = [...(draftPlaylist.items || [])];
    if (index === items.length - 1) return;
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    updateDraft({ items });
  };

  const handleShuffle = () => {
    const shuffled = [...(draftPlaylist.items || [])].sort(() => Math.random() - 0.5);
    updateDraft({ items: shuffled });
  };

  const handleClearPlaylist = () => {
    updateDraft({ items: [] });
  };

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    if (dragOverIndex === index) setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const items = [...(draftPlaylist.items || [])];
    const [moved] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, moved);
    updateDraft({ items });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderCoverModal = () => (
    <Modal transparent visible={coverModalVisible} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 24, width: 600, maxHeight: '80%', borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 16 }}>Set Playlist Cover</Text>
          
          <TouchableOpacity 
            style={{ padding: 16, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: 24, cursor: 'pointer' }}
            onPress={() => {
              setCoverModalVisible(false);
              handleCustomCover();
            }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '700' }}>📂 Browse PC for Custom Image</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 }}>Or choose a thumbnail from your playlist videos:</Text>
          
          <ScrollView style={{ flex: 1, maxHeight: 300 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {playlistItems.map((video, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={{ width: 120, height: 75, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: draftPlaylist.coverImage === video.thumbnail ? theme.colors.primary : 'transparent', cursor: 'pointer' }}
                  onPress={() => {
                    updateDraft({ coverImage: video.thumbnail });
                    setCoverModalVisible(false);
                  }}
                >
                  <VideoThumbnail uri={video.thumbnail} style={{ width: '100%', height: '100%' }} />
                </TouchableOpacity>
              ))}
              {playlistItems.length === 0 && (
                <Text style={{ color: theme.colors.textTertiary, fontStyle: 'italic' }}>No videos in playlist yet.</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={{ marginTop: 24, padding: 12, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, alignItems: 'center', cursor: 'pointer' }}
            onPress={() => setCoverModalVisible(false)}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, padding: 32, paddingBottom: 32 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.text }}>Edit Playlist</Text>

        {/* Right side button group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Delete Playlist — danger zone, leftmost */}
          {!isNewPlaylist && (
            <>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
                  backgroundColor: 'transparent', borderWidth: 1,
                  borderColor: theme.colors.error, cursor: 'pointer',
                }}
                onPress={() => setConfirmDeleteVisible(true)}
              >
                <Text style={{ color: theme.colors.error, fontWeight: '700', fontSize: 13 }}>🗑 Delete Playlist</Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={{ width: 1, height: 28, backgroundColor: theme.colors.border, marginHorizontal: 4 }} />
            </>
          )}

          {/* Discard Changes */}
          <TouchableOpacity
            style={{
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
              backgroundColor: theme.colors.surfaceLight, borderWidth: 1,
              borderColor: theme.colors.border, cursor: 'pointer',
            }}
            onPress={onBack}
          >
            <Text style={{ color: theme.colors.textSecondary, fontWeight: '700', fontSize: 13 }}>↩ Discard</Text>
          </TouchableOpacity>

          {/* Save & Return */}
          <TouchableOpacity
            style={{
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
              backgroundColor: (draftPlaylist.items || []).length === 0 ? theme.colors.surfaceLight : theme.colors.primary,
              borderWidth: 1, borderColor: theme.colors.border,
              cursor: (draftPlaylist.items || []).length === 0 ? 'not-allowed' : 'pointer',
              opacity: (draftPlaylist.items || []).length === 0 ? 0.5 : 1,
            }}
            onPress={() => {
              if ((draftPlaylist.items || []).length === 0) {
                alert('Add at least one video before saving your playlist.');
                return;
              }
              onSave(draftPlaylist);
            }}
          >
            <Text style={{ color: (draftPlaylist.items || []).length === 0 ? theme.colors.textSecondary : '#000', fontWeight: '700', fontSize: 13 }}>💾 Save &amp; Return</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm delete dialog */}
      {confirmDeleteVisible && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: theme.colors.surface, borderRadius: 12, padding: 28,
            width: 420, borderWidth: 1, borderColor: theme.colors.border,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 12 }}>🗑 Delete Playlist?</Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 }}>
              This will permanently remove &quot;{playlist.name || 'Untitled Playlist'}&quot; from your playlists. Your video files will NOT be affected.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.surfaceLight, borderWidth: 1, borderColor: theme.colors.border, cursor: 'pointer' }}
                onPress={() => setConfirmDeleteVisible(false)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.colors.error, cursor: 'pointer' }}
                onPress={() => { if (onDelete) onDelete(playlist.id); }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.editorContainer}>
        {/* LEFT PANE: Available Videos */}
        <View style={styles.editorLeft}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>📚 Available Videos</Text>
              <Text style={styles.panelSubtitle}>{filteredVideos.length} videos</Text>
            </View>
            <View style={styles.editorSearch}>
              <Text style={styles.editorSearchIcon}>🔍</Text>
              <TextInput
                style={styles.editorSearchInput}
                placeholder="Search videos..."
                placeholderTextColor="#555"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.sortRow}>
              {['date', 'title', 'duration', 'rating'].map(sort => {
                const labels = { date: '📅 Date', title: '🔤 Title', duration: '⏱️ Duration', rating: '★ Rating' };
                return (
                  <TouchableOpacity
                    key={sort}
                    style={[styles.sortButton, sortBy === sort && styles.sortButtonActive]}
                    onPress={() => setSortBy(sort)}
                  >
                    <Text style={[styles.sortButtonText, sortBy === sort && styles.sortButtonTextActive]}>
                      {labels[sort]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            {filteredVideos.map(video => {
              const added = isInPlaylist(video.id);
              return (
                <View key={video.id} style={styles.videoListItem}>
                  <VideoThumbnail uri={video.thumbnail} style={styles.videoListThumb} />
                  <View style={styles.videoListInfo}>
                    <Text style={styles.videoListTitle} numberOfLines={1}>{video.title || 'Untitled'}</Text>
                    <Text style={styles.videoListMeta}>
                      {formatDuration(video.duration)}
                      {video.resolution ? ` · ${video.resolution}` : ''}
                      {video.rating > 0 && (
                        <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                          {` • ${'★'.repeat(video.rating)}`}
                        </Text>
                      )}
                    </Text>
                  </View>
                  {added ? (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6 }}>✓ Added</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddToPlaylist(video.id)}
                    >
                      <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🍿</Text>
                <Text style={styles.emptyStateText}>Library is Empty</Text>
                <Text style={styles.emptyStateSubText}>
                  Download or import videos to get started
                </Text>
              </View>
            ) : filteredVideos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateText}>No Matches Found</Text>
                <Text style={styles.emptyStateSubText}>
                  Try adjusting your search query or tag filters
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* RIGHT PANE: Playlist Builder */}
        <View style={styles.editorRight}>
          <View style={styles.panelHeader}>
            <TouchableOpacity onPress={() => setCoverModalVisible(true)} style={{ width: '100%', height: 120, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
              <VideoThumbnail uri={draftPlaylist.coverImage || (playlistItems[0] && playlistItems[0].thumbnail) || null} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6 }}>
                <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: 'bold' }}>🖼️ Click to Change Cover Art</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceLight, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>✏️</Text>
              <TextInput
                style={[styles.nameInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', padding: 10 }]}
                value={draftPlaylist.name || ''}
                onChangeText={(text) => updateDraft({ name: text })}
                placeholder="Playlist Name..."
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>🎬 {playlistItems.length} videos</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>⏱️ {formatDuration(totalDuration)}</Text>
              </View>
              {totalSize > 0 && (
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>💾 {formatSize(totalSize)}</Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            {playlistItems.map((video, index) => (
              <div
                key={`${video.id}-${index}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: dragOverIndex === index ? theme.colors.surfaceLight : theme.colors.surface,
                  padding: '8px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  borderWidth: '1px',
                  borderStyle: draggedIndex === index ? 'dashed' : 'solid',
                  borderColor: dragOverIndex === index ? theme.colors.primary : theme.colors.border,
                  opacity: draggedIndex === index ? 0.4 : 1,
                  transform: dragOverIndex === index ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxShadow: dragOverIndex === index ? `0 4px 12px ${theme.colors.primary}40` : 'none',
                  cursor: 'grab'
                }}
              >
                <Text style={{ fontSize: 16, color: theme.colors.textSecondary, marginRight: 8, cursor: 'grab' }}>☰</Text>
                <TextInput 
                  style={{ backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 8, fontSize: 12, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none', width: 28, textAlign: 'center', marginRight: 8 }} 
                  value={(index + 1).toString()}
                  onChangeText={() => {}} 
                  onEndEditing={(e) => {
                    const newIndex = parseInt(e.nativeEvent.text, 10) - 1;
                    if (!isNaN(newIndex) && newIndex >= 0 && newIndex < playlistItems.length) {
                      const newP = [...(draftPlaylist.items || [])];
                      const [movedItem] = newP.splice(index, 1);
                      newP.splice(newIndex, 0, movedItem);
                      updateDraft({ items: newP });
                    }
                  }}
                />
                <TouchableOpacity onPress={() => onPlayVideo(video)} style={{ width: 64, height: 40, marginRight: 8 }}>
                  <VideoThumbnail uri={video.thumbnail} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>
                    {video.title || 'Untitled'}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>
                    {formatDuration(video.duration)}
                    {video.resolution ? ` · ${video.resolution}` : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => handleMoveUp(index)}><Text style={{ fontSize: 14, cursor: 'pointer' }}>⬆️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleMoveDown(index)}><Text style={{ fontSize: 14, cursor: 'pointer' }}>⬇️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveFromPlaylist(video.id)}><Text style={{ fontSize: 14, cursor: 'pointer' }}>❌</Text></TouchableOpacity>
                </View>
              </div>
            ))}
            {playlistItems.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📭</Text>
                <Text style={styles.emptyStateText}>Playlist is empty</Text>
                <Text style={styles.emptyStateSubText}>
                  Add videos from the left panel to build your playlist
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.toolbarButton, styles.toolbarButtonPrimary]}
              onPress={() => onPlayAll(playlistItems)}
              disabled={playlistItems.length === 0}
            >
              <Text style={[styles.toolbarButtonText, styles.toolbarButtonPrimaryText]}>
                ▶ Play All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleShuffle}>
              <Text style={styles.toolbarButtonText}>🔀 Shuffle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleClearPlaylist}>
              <Text style={styles.toolbarButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {renderCoverModal()}
    </View>
  );
}
