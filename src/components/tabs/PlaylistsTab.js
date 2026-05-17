import React, { useState } from 'react';
import { useStore } from '../../store';
import PlaylistGallery from './Playlists/PlaylistGallery';
import PlaylistEditor from './Playlists/PlaylistEditor';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

export default function PlaylistsTab() {
  const history = useStore(state => state.history);
  const playlists = useStore(state => state.playlists);
  const addPlaylist = useStore(state => state.addPlaylist);
  const updatePlaylist = useStore(state => state.updatePlaylist);
  const deletePlaylist = useStore(state => state.deletePlaylist);
  const clearPlaylists = useStore(state => state.clearPlaylists);
  const settings = useStore(state => state.settings);

  const setQuickCastVideo = useStore(state => state.setQuickCastVideo);

  // Maintain local editing state so edits aren't written to the global store until saved explicitly
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  const handleQuickCast = (playlist) => {
    const items = (playlist.items || [])
      .map(id => history.find(h => h.id === id))
      .filter(Boolean);
    
    if (items.length > 0) {
      setQuickCastVideo(items);
    } else {
      alert('Cannot cast an empty playlist. Add some videos first.');
    }
  };

  const handleCreate = () => {
    // Open a fresh draft playlist. It is not saved to the store until they click "Save & Return"
    setEditingPlaylist({
      id: 'new-' + Date.now(),
      name: 'New Playlist',
      items: [],
      coverImage: null,
      tags: [],
      rating: 0,
      isNew: true
    });
  };

  const handlePlayVideo = async (video) => {
    try {
      let videoPath = video.path;
      if (!videoPath) {
        videoPath = await ipcRenderer?.invoke('get-video-path', {
          filename: `${video.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      if (settings.customPlayerPath && settings.customPlayerPath.trim() !== '') {
        await ipcRenderer?.invoke('open-video', {
          filepath: videoPath,
          customPlayerPath: settings.customPlayerPath,
        });
      } else {
        if (editingPlaylist && editingPlaylist.items) {
          // Pre-resolve paths for all items in this playlist view
          const playlist = editingPlaylist.items.map(v => {
            if (v.path) return v;
            const fallbackPath = `${settings.downloadPath}/${v.title}.mp4`;
            return { ...v, path: fallbackPath };
          });
          const playlistIndex = editingPlaylist.items.findIndex(v => v.id === video.id);
          useStore.getState().setActiveBuiltinVideo({
            ...video,
            path: videoPath,
            playlist,
            playlistIndex: playlistIndex !== -1 ? playlistIndex : 0,
          });
        } else {
          useStore.getState().setActiveBuiltinVideo({ ...video, path: videoPath });
        }
      }
    } catch (error) {
      console.error('Failed to play video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };

  const handlePlayAll = async (items) => {
    if (items.length === 0) return;

    if (settings.customPlayerPath && settings.customPlayerPath.trim() !== '') {
      // External player: pass all file paths
      const paths = items.map(v => v.path).filter(Boolean);
      if (paths.length > 0) {
        await ipcRenderer?.invoke('open-video', {
          filepath: paths[0],
          customPlayerPath: settings.customPlayerPath,
        });
      }
    } else {
      // Built-in player: open first video with playlist context
      const firstVideo = items[0];
      let videoPath = firstVideo.path;
      if (!videoPath) {
        videoPath = await ipcRenderer?.invoke('get-video-path', {
          filename: `${firstVideo.title}.mp4`,
          downloadPath: settings.downloadPath,
        });
      }
      useStore.getState().setActiveBuiltinVideo({
        ...firstVideo,
        path: videoPath,
        playlist: items,
        playlistIndex: 0,
      });
    }
  };

  // View A: Playlist Gallery (no active playlist selected)
  if (!editingPlaylist) {
    return (
      <PlaylistGallery
        playlists={playlists}
        history={history}
        onOpen={(id) => {
          const playlist = playlists.find(p => p.id === id);
          if (playlist) setEditingPlaylist({ ...playlist });
        }}
        onCreate={handleCreate}
        onUpdatePlaylist={updatePlaylist}
        onPlay={(playlist) => handlePlayAll(playlist.items)}
        onQuickCast={handleQuickCast}
        onDelete={(id) => {
          deletePlaylist(id);
        }}
        onClearAll={clearPlaylists}
      />
    );
  }

  // View B: Playlist Editor (a playlist draft is active)
  return (
    <PlaylistEditor
      playlist={editingPlaylist}
      history={history}
      onSave={(updated) => {
        if (updated.isNew || (typeof updated.id === 'string' && updated.id.startsWith('new-'))) {
          // Add to the global gallery store now that they hit save
          const { isNew, ...cleanPlaylist } = updated;
          addPlaylist({
            ...cleanPlaylist,
            id: Date.now().toString()
          });
        } else {
          // Update the existing playlist in the store
          updatePlaylist(updated.id, updated);
        }
        setEditingPlaylist(null);
      }}
      onBack={() => setEditingPlaylist(null)}
      onPlayAll={handlePlayAll}
      onPlayVideo={handlePlayVideo}
      onDelete={(id) => {
        if (typeof id === 'string' && id.startsWith('new-')) {
          setEditingPlaylist(null);
        } else {
          deletePlaylist(id);
          setEditingPlaylist(null);
        }
      }}
    />
  );
}
