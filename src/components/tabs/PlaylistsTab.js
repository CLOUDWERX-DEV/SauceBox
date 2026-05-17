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
  const settings = useStore(state => state.settings);

  const setQuickCastVideo = useStore(state => state.setQuickCastVideo);

  const [activePlaylistId, setActivePlaylistId] = useState(null);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

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
    const newPlaylist = {
      name: 'New Playlist',
      items: [],
      coverImage: null,
    };
    addPlaylist(newPlaylist);
    // Open the newly created playlist for editing
    // The ID is set by the store (Date.now()), so grab the latest one
    setTimeout(() => {
      const latest = useStore.getState().playlists[0];
      if (latest) setActivePlaylistId(latest.id);
    }, 50);
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
        useStore.getState().setActiveBuiltinVideo({ ...video, path: videoPath });
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
  if (!activePlaylist) {
    return (
      <PlaylistGallery
        playlists={playlists}
        history={history}
        onOpen={(id) => setActivePlaylistId(id)}
        onCreate={handleCreate}
        onUpdatePlaylist={updatePlaylist}
        onPlay={(playlist) => handlePlayAll(playlist.items)}
        onQuickCast={handleQuickCast}
        onDelete={(id) => {
          deletePlaylist(id);
          if (activePlaylistId === id) setActivePlaylistId(null);
        }}
      />
    );
  }

  // View B: Playlist Editor (a playlist is selected)
  return (
    <PlaylistEditor
      playlist={activePlaylist}
      history={history}
      onUpdatePlaylist={updatePlaylist}
      onBack={() => setActivePlaylistId(null)}
      onPlayAll={handlePlayAll}
      onPlayVideo={handlePlayVideo}
    />
  );
}
