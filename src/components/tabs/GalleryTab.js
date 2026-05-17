import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../../store';
import { theme } from '../../theme';
import ConfirmModal from '../ConfirmModal';
import EditVideoModal from '../EditVideoModal';
import ImportModal from '../ImportModal';

import GalleryHeader from './Gallery/GalleryHeader';
import GalleryEmptyState from './Gallery/GalleryEmptyState';
import GalleryFilterBar from './Gallery/GalleryFilterBar';
import GalleryCard from './Gallery/GalleryCard';

const saucebox = window.saucebox;

const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num)) return null;
  const mb = num / (1024 * 1024);
  const gb = num / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
};

export default function GalleryTab({ onNavigate }) {
  const history = useStore(state => state.history);
  const settings = useStore(state => state.settings);
  const clearHistory = useStore(state => state.clearHistory);
  const removeFromHistory = useStore(state => state.removeFromHistory);
  const updateHistoryRating = useStore(state => state.updateHistoryRating);
  const addTagToHistory = useStore(state => state.addTagToHistory);
  const removeTagFromHistory = useStore(state => state.removeTagFromHistory);
  const setQuickCastVideo = useStore(state => state.setQuickCastVideo);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterResolution, setFilterResolution] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [filterTags, setFilterTags] = useState([]);
  
  const [editingVideo, setEditingVideo] = useState(null);
  const [importVisible, setImportVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [clearDiskToo, setClearDiskToo] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleteFromDisk, setDeleteFromDisk] = useState(false);

  const allTags = Array.from(new Set(history.flatMap(h => h.tags || []))).sort();

  const handlePlayVideo = async (item) => {
    try {
      let videoPath = item.path;
      if (!videoPath) {
        videoPath = await saucebox?.invoke('get-video-path', {
          filename: `${item.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      if (settings.customPlayerPath && settings.customPlayerPath.trim() !== '') {
        await saucebox?.invoke('open-video', { filepath: videoPath, customPlayerPath: settings.customPlayerPath });
      } else {
        // Map the filteredHistory into a playlist context with resolved fallback paths
        const playlist = filteredHistory.map(h => {
          if (h.path) return h;
          const fallbackPath = `${settings.downloadPath}/${h.title}.mp4`;
          return { ...h, path: fallbackPath };
        });
        const playlistIndex = filteredHistory.findIndex(h => h.id === item.id);
        useStore.getState().setActiveBuiltinVideo({
          ...item,
          path: videoPath,
          playlist,
          playlistIndex: playlistIndex !== -1 ? playlistIndex : 0,
        });
      }
    } catch (error) {
      console.error('Failed to find video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };

  const handleOpenFolder = async (item) => {
    try {
      let videoPath = item.path;
      if (!videoPath) {
        videoPath = await saucebox?.invoke('get-video-path', {
          filename: `${item.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      await saucebox?.invoke('open-folder', videoPath);
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Could not open folder. The video file may have been moved or deleted.');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    if (deleteFromDisk && deleteConfirmItem.path) {
      await saucebox?.invoke('delete-file', deleteConfirmItem.path);
    }
    removeFromHistory(deleteConfirmItem.id);
    setDeleteConfirmItem(null);
    setDeleteFromDisk(false);
  };

  const handleClearAll = async () => {
    if (clearDiskToo) {
      const paths = history.map(h => h.path).filter(Boolean);
      if (paths.length > 0) {
        await saucebox?.invoke('delete-files', paths);
      }
    }
    clearHistory();
    setClearConfirmVisible(false);
    setClearDiskToo(false);
  };

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

  const totalBytes = history.reduce((acc, h) => acc + (Number(h.filesize) || 0), 0);
  const totalDuration = history.reduce((acc, h) => acc + (Number(h.duration) || 0), 0);
  const totalSizeStr = totalBytes > 0 ? formatFileSize(totalBytes) : null;
  const knownCount = history.filter(h => h.filesize).length;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <GalleryHeader 
          historyLength={history.length}
          filteredLength={filteredHistory.length}
          totalBytes={totalBytes}
          totalDuration={totalDuration}
          onImport={() => setImportVisible(true)}
          onClearAll={() => setClearConfirmVisible(true)}
        />

        {history.length > 0 && (
          <GalleryFilterBar 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            sortBy={sortBy} setSortBy={setSortBy}
            filterResolution={filterResolution} setFilterResolution={setFilterResolution}
            filterRating={filterRating} setFilterRating={setFilterRating}
            filterTags={filterTags} setFilterTags={setFilterTags}
            allTags={allTags}
          />
        )}

        {history.length === 0 ? (
          <GalleryEmptyState 
            isSearchEmpty={false}
            onImport={() => setImportVisible(true)}
            onNavigate={onNavigate}
          />
        ) : filteredHistory.length === 0 ? (
          <GalleryEmptyState 
            isSearchEmpty={true}
          />
        ) : (
          <View style={styles.historyGrid}>
            {filteredHistory.map((item, index) => (
              <GalleryCard 
                key={item.id || index}
                item={item}
                onPlay={handlePlayVideo}
                onOpenFolder={handleOpenFolder}
                onQuickCast={setQuickCastVideo}
                onDelete={(i) => {
                  setDeleteFromDisk(false);
                  setDeleteConfirmItem(i);
                }}
                onEdit={setEditingVideo}
                onUpdateRating={updateHistoryRating}
                onAddTag={addTagToHistory}
                onRemoveTag={removeTagFromHistory}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!deleteConfirmItem}
        title="Remove Video?"
        message={`Remove "${deleteConfirmItem?.title || 'this video'}" from your gallery?`}
        confirmText="Remove"
        onConfirm={handleDeleteItem}
        onCancel={() => { setDeleteConfirmItem(null); setDeleteFromDisk(false); }}
        checkboxLabel={deleteConfirmItem?.filesize
          ? `Also permanently delete the file from disk (${formatFileSize(deleteConfirmItem.filesize)})`
          : 'Also permanently delete the file from disk'}
        checkboxValue={deleteFromDisk}
        onCheckboxChange={setDeleteFromDisk}
      />

      <ConfirmModal
        visible={clearConfirmVisible}
        title="Clear Gallery?"
        message="Remove all videos from your gallery? This cannot be undone."
        confirmText="Clear Gallery"
        onConfirm={handleClearAll}
        onCancel={() => { setClearConfirmVisible(false); setClearDiskToo(false); }}
        checkboxLabel={totalSizeStr
          ? `Also permanently delete all video files from disk (${totalSizeStr}${
              knownCount < history.length ? ', known files only' : ''
            })`
          : 'Also permanently delete all video files from disk'}
        checkboxValue={clearDiskToo}
        onCheckboxChange={setClearDiskToo}
      />

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
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  content: {
    padding: 32,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
});
