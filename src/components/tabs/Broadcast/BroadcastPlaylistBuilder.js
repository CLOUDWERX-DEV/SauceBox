import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../../theme';
import VideoThumbnail from '../../VideoThumbnail';

export default function BroadcastPlaylistBuilder({
  history, playlist, setPlaylist, searchQuery, setSearchQuery,
  sortBy, setSortBy,
  handleAddToPlaylist, handleRemoveFromPlaylist, handleMoveUp, handleMoveDown,
  draggedIndex, setDraggedIndex, dragOverIndex, setDragOverIndex,
  handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd,
  handleShuffle, handleSaveStream, handleExportM3u, handleImportM3u,
  setPreviewVideo, serverRunning, playlistUrl,
  broadcastLogs, clearBroadcastLogs
}) {
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

  const totalDuration = playlist.reduce((sum, v) => sum + (v.duration || 0), 0);
  const totalSize = playlist.reduce((sum, v) => sum + (Number(v.filesize) || 0), 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>▶️ Playlist Builder</Text>
      <Text style={styles.subtitle}>Create a custom .m3u playlist to stream seamlessly</Text>
      
      <View style={styles.playlistContainer}>
        <View style={styles.playlistColumnLeft}>
          {/* Panel header: title + count */}
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>📚 Available Videos</Text>
              <Text style={styles.panelSubtitle}>
                {history.filter(h => !searchQuery || h.title.toLowerCase().includes(searchQuery.toLowerCase()) || (h.tags && h.tags.join(' ').toLowerCase().includes(searchQuery.toLowerCase()))).length} videos
              </Text>
            </View>

            {/* Styled search bar matching PlaylistEditor */}
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

            {/* Sort buttons — no SORT: label, matching PlaylistEditor */}
            <View style={styles.sortRow}>
              {['date', 'title', 'duration', 'rating'].map(sort => {
                const labels = { date: '📅 Date', title: '🔤 Title', duration: '⏱️ Duration', rating: '★ Rating' };
                const isActive = sortBy === sort;
                return (
                  <TouchableOpacity
                    key={sort}
                    style={[styles.sortButton, isActive && styles.sortButtonActive]}
                    onPress={() => setSortBy(sort)}
                  >
                    <Text style={[styles.sortButtonText, isActive && styles.sortButtonTextActive]}>
                      {labels[sort]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {history
              .filter(h => !searchQuery || h.title.toLowerCase().includes(searchQuery.toLowerCase()) || (h.tags && h.tags.join(' ').toLowerCase().includes(searchQuery.toLowerCase())))
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
              })
              .map(item => (
              <View key={item.id} style={styles.videoRow}>
                <View style={{ width: 80, height: 45, marginRight: 12, position: 'relative' }}>
                  <VideoThumbnail uri={item.thumbnail} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                  <TouchableOpacity style={styles.thumbnailPlayButton} onPress={() => setPreviewVideo(item)}>
                    <Text style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.videoMeta} numberOfLines={1}>
                    {item.duration ? Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0') : '??:??'} • {item.resolution || 'HD'}
                    {item.rating > 0 && (
                      <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                        {` • ${'★'.repeat(item.rating)}`}
                      </Text>
                    )}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, playlist.find(p => p.id === item.id) && styles.addedButton]} 
                  onPress={() => handleAddToPlaylist(item)}
                  disabled={playlist.find(p => p.id === item.id)}
                >
                  <Text style={[styles.addButtonText, playlist.find(p => p.id === item.id) && styles.addedButtonText]}>
                    {playlist.find(p => p.id === item.id) ? '✓ Added' : '+ Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.playlistColumnRight}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.columnTitle}>Current Playlist</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.smallButton} onPress={() => document.getElementById('m3u-import').click()}>
                <Text style={styles.smallButtonText}>📂 Import .m3u</Text>
              </TouchableOpacity>
              <input type="file" id="m3u-import" accept=".m3u" style={{ display: 'none' }} onChange={handleImportM3u} />
              <TouchableOpacity style={styles.smallButton} onPress={handleExportM3u} disabled={playlist.length === 0}>
                <Text style={styles.smallButtonText}>💾 Export .m3u</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.playlistMetaRow, { marginHorizontal: -16, paddingHorizontal: 16 }]}>
            <Text style={styles.playlistMetaText}>🎬 {playlist.length} videos</Text>
            <Text style={styles.playlistMetaText}>⏱️ {formatDuration(totalDuration)}</Text>
            {totalSize > 0 && <Text style={styles.playlistMetaText}>💾 {formatSize(totalSize)}</Text>}
          </View>
          
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            {playlist.map((item, index) => (
              <div 
                key={item.id} 
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
                  style={[styles.textInput, { width: 32, padding: 4, marginRight: 8, textAlign: 'center', fontSize: 12 }]} 
                  value={(index + 1).toString()}
                  onChangeText={() => {}} 
                  onEndEditing={(e) => {
                    const newIndex = parseInt(e.nativeEvent.text, 10) - 1;
                    if (!isNaN(newIndex) && newIndex >= 0 && newIndex < playlist.length) {
                      const newP = [...playlist];
                      const [movedItem] = newP.splice(index, 1);
                      newP.splice(newIndex, 0, movedItem);
                      setPlaylist(newP);
                    }
                  }}
                />
                <View style={{ width: 80, height: 45, marginRight: 12, position: 'relative' }}>
                  <VideoThumbnail uri={item.thumbnail} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                  <TouchableOpacity style={styles.thumbnailPlayButton} onPress={() => setPreviewVideo(item)}>
                    <Text style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.videoMeta} numberOfLines={1}>
                    {item.duration ? Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0') : '??:??'}
                  </Text>
                </View>
                <View style={styles.rowControls}>
                  <TouchableOpacity onPress={() => handleMoveUp(index)}><Text style={styles.controlIcon}>⬆️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleMoveDown(index)}><Text style={styles.controlIcon}>⬇️</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveFromPlaylist(item.id)}><Text style={styles.controlIcon}>❌</Text></TouchableOpacity>
                </View>
              </div>
            ))}
            {playlist.length === 0 && (
              <View style={styles.emptyPlaylistState}>
                <Text style={styles.emptyPlaylistIcon}>📬</Text>
                <Text style={styles.emptyPlaylistTitle}>Playlist is Empty</Text>
                <Text style={styles.emptyPlaylistSub}>Add videos from the left panel to build your stream queue.</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: -16, marginTop: 8 }} />
          <View style={[styles.playlistActions, { paddingTop: 12 }]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShuffle} disabled={playlist.length === 0}>
              <Text style={styles.actionButtonText}>🔀 Shuffle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => setPlaylist([])} disabled={playlist.length === 0}>
              <Text style={styles.actionButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary, flex: 2 }]} onPress={handleSaveStream} disabled={playlist.length === 0}>
              <Text style={[styles.actionButtonText, { color: '#000' }]}>📡 Host Stream URL</Text>
            </TouchableOpacity>
          </View>
          
          {serverRunning && playlistUrl && (
            <View style={styles.playlistUrlContainer}>
              <Text style={styles.activeLabel}>Playlist URL:</Text>
              <TextInput style={styles.textInputFull} value={playlistUrl} editable={false} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.liveMonitorCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.columnTitle}>📡 Live Monitor Log</Text>
          {broadcastLogs.length > 0 && (
            <TouchableOpacity onPress={clearBroadcastLogs}><Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>Clear Logs</Text></TouchableOpacity>
          )}
        </View>
        <ScrollView style={styles.logsList}>
          {broadcastLogs.length === 0 ? (
            <Text style={[styles.hintText, { marginTop: 10 }]}>No active connections right now.</Text>
          ) : (
            broadcastLogs.map((log, idx) => (
              <View key={idx} style={styles.logEntry}>
                <Text style={styles.logTime}>{new Date(log.time).toLocaleTimeString()}</Text>
                <Text style={{ flex: 1, color: theme.colors.primary, fontSize: 11, fontWeight: 'bold' }}>
                  Device {log.ip} is currently streaming: <Text style={{ color: theme.colors.textSecondary, fontWeight: 'normal' }}>{log.file}</Text>
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, fontStyle: 'italic' },
  playlistContainer: { flexDirection: 'row', gap: 24, height: 600, marginTop: 16 },
  playlistColumnLeft: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  playlistColumnRight: {
    width: 420,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  columnTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  panelHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
    flexShrink: 0,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  panelSubtitle: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  editorSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editorSearchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  editorSearchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    outlineStyle: 'none',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  sortButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  sortButtonTextActive: {
    color: theme.colors.primary,
  },
  emptyPlaylistState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyPlaylistIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyPlaylistTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  emptyPlaylistSub: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  playlistMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playlistMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  videoList: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 8 },
  videoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, padding: 8, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  videoTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  videoMeta: { color: theme.colors.textSecondary, fontSize: 11 },
  addButton: { backgroundColor: `${theme.colors.primary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.primary },
  addButtonText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
  addedButton: { backgroundColor: 'transparent', borderColor: 'transparent', cursor: 'default' },
  addedButtonText: { color: theme.colors.primary },
  rowControls: { flexDirection: 'row', gap: 12 },
  controlIcon: { fontSize: 14, cursor: 'pointer' },
  playlistActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  actionButton: { flex: 1, backgroundColor: theme.colors.surfaceLight, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  actionButtonText: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  smallButton: { backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.border },
  smallButtonText: { color: theme.colors.text, fontSize: 11, fontWeight: '600' },
  playlistUrlContainer: { marginTop: 16, backgroundColor: `${theme.colors.primary}10`, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: `${theme.colors.primary}40` },
  liveMonitorCard: { marginTop: 24, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  logsList: { maxHeight: 150 },
  logEntry: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 6 },
  logTime: { color: theme.colors.textTertiary, fontSize: 10, width: 70 },
  logIp: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold', width: 100 },
  logFile: { color: theme.colors.textSecondary, fontSize: 11, flex: 1 },
  textInputFull: { backgroundColor: '#000', borderRadius: 6, padding: 10, color: theme.colors.primary, fontSize: 12, borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, width: '100%', outlineStyle: 'none' },
  textInput: { backgroundColor: theme.colors.surfaceLight, borderRadius: 8, padding: 12, fontSize: 14, color: theme.colors.text, borderWidth: 1, borderColor: `${theme.colors.primary}30`, outlineStyle: 'none', width: 100, textAlign: 'center' },
  activeLabel: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 16, fontWeight: '600' },
  hintText: { marginTop: 12, fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic' },
  thumbnailPlayButton: { position: 'absolute', top: '50%', left: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12, backgroundColor: theme.colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }
});
