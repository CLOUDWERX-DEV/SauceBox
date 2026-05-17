import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Image } from 'react-native';
import QRCode from 'react-qr-code';
import { theme } from '../../theme';
import { useStore } from '../../store';
import VideoThumbnail from '../VideoThumbnail';
import BroadcastWarningCard from './Broadcast/BroadcastWarningCard';
import BroadcastStatusBanner from './Broadcast/BroadcastStatusBanner';
import BroadcastServerInfo from './Broadcast/BroadcastServerInfo';
import BroadcastNetworkConfig from './Broadcast/BroadcastNetworkConfig';
import BroadcastSecurityConfig from './Broadcast/BroadcastSecurityConfig';
import BroadcastPlaylistBuilder from './Broadcast/BroadcastPlaylistBuilder';

const saucebox = window.saucebox;

const getBasename = (value) => {
  if (!value) return '';
  const cleanValue = String(value).split('?')[0];
  return cleanValue.split(/[\\/]/).filter(Boolean).pop() || '';
};

export default function BroadcastTab() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const setServerStatus = useStore(state => state.setServerStatus);
  const serverStatus = useStore(state => state.serverStatus);
  const history = useStore(state => state.history);
  const broadcastLogs = useStore(state => state.broadcastLogs);
  const clearBroadcastLogs = useStore(state => state.clearBroadcastLogs);
  const quickCastVideo = useStore(state => state.quickCastVideo);
  const setQuickCastVideo = useStore(state => state.setQuickCastVideo);

  const [playlist, setPlaylist] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const handlePreviewVideo = async (item) => {
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
        useStore.getState().setActiveBuiltinVideo({ ...item, path: videoPath });
      }
    } catch (error) {
      console.error('Failed to preview video:', error);
      alert('Video file not found. The download may have failed or the file was moved.');
    }
  };
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [serverRunning, setServerRunning] = useState(serverStatus?.running || false);
  const [port, setPort] = useState(settings.broadcastPort || '6969');
  const [serverName, setServerName] = useState(settings.broadcastServerName || 'SauceBox Media Server');
  const [authEnabled, setAuthEnabled] = useState(settings.broadcastAuth || false);
  const [username, setUsername] = useState(settings.broadcastUsername || 'admin');
  const [password, setPassword] = useState(settings.broadcastPassword || '');
  const [dlnaEnabled, setDlnaEnabled] = useState(settings.broadcastDlna !== false);
  const [transcodeEnabled, setTranscodeEnabled] = useState(settings.broadcastTranscode || false);
  const [exposeInternetEnabled, setExposeInternetEnabled] = useState(settings.broadcastExposeInternet || false);
  const [localIp, setLocalIp] = useState('127.0.0.1');
  const [externalIp, setExternalIp] = useState(null);

  useEffect(() => {
    updateSettings({
      broadcastPort: port,
      broadcastServerName: serverName,
      broadcastAuth: authEnabled,
      broadcastUsername: username,
      broadcastPassword: password,
      broadcastDlna: dlnaEnabled,
      broadcastTranscode: transcodeEnabled,
      broadcastExposeInternet: exposeInternetEnabled,
      broadcastPlaylist: playlist.map(v => v.id)
    });
  }, [port, serverName, authEnabled, username, password, dlnaEnabled, transcodeEnabled, exposeInternetEnabled, playlist]);

  useEffect(() => {
    // Restore playlist from settings
    if (settings.broadcastPlaylist && settings.broadcastPlaylist.length > 0 && playlist.length === 0) {
      const restored = settings.broadcastPlaylist.map(id => history.find(h => h.id === id)).filter(Boolean);
      if (restored.length > 0) setPlaylist(restored);
    }
  }, [settings.broadcastPlaylist, history]);

  useEffect(() => {
    saucebox?.invoke('get-local-ip').then(ip => setLocalIp(ip));
    
    const fetchExternalIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data.ip) setExternalIp(data.ip);
      } catch (err) {
        console.error('Failed to fetch external IP:', err);
      }
    };
    fetchExternalIp();
    
    // If the component remounts, check if the global serverStatus says we are running.
    if (serverStatus?.running) {
      setServerRunning(true);
      if (serverStatus.url) {
        setPlaylistUrl(`${serverStatus.url}/stream.m3u`);
      }
    }
  }, []);

  const handleToggleServer = async (forceStart = false) => {
    if (serverRunning && !forceStart) {
      const res = await saucebox?.invoke('stop-media-server');
      if (res && res.success) {
        setServerRunning(false);
        setServerStatus({ running: false, url: null });
      }
    } else if (!serverRunning || forceStart) {
      const config = {
        port: parseInt(port, 10) || 6969,
        authEnabled,
        username,
        password,
        dlnaEnabled,
        transcodeEnabled,
        downloadPath: settings.downloadPath,
        ffmpegPath: settings.ffmpegPath
      };
      const res = await saucebox?.invoke('start-media-server', config);
      if (res && res.success) {
        setServerRunning(true);
        if (res.ip) {
          setLocalIp(res.ip);
          setServerStatus({ running: true, url: `http://${res.ip}:${config.port}` });
        } else {
          setServerStatus({ running: true, url: `http://${localIp}:${config.port}` });
        }
      } else {
        alert('Failed to start server: ' + (res?.error || 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    if (quickCastVideo) {
      const newPlaylist = Array.isArray(quickCastVideo) ? quickCastVideo : [quickCastVideo];
      setPlaylist(newPlaylist);
      setQuickCastVideo(null); // clear it
      handleToggleServer(true).then(() => {
        // Automatically save stream after starting server
        generateM3U(newPlaylist);
      });
    }
  }, [quickCastVideo]);

  const generateM3U = async (currentPlaylist = playlist) => {
    if (currentPlaylist.length === 0) return;

    const result = await saucebox?.invoke('save-stream-playlist', {
      playlist: currentPlaylist,
      serverName,
      localIp,
      port,
      downloadPath: settings.downloadPath,
      transcodeEnabled,
    });
    if (result?.success) {
      setPlaylistUrl(result.url);
    } else if (result?.error) {
      console.error('Failed to auto-save playlist:', result.error);
    }
  };

  const handleAddToPlaylist = (item) => {
    if (!playlist.find(p => p.id === item.id)) {
      setPlaylist([...playlist, item]);
    }
  };

  const handleRemoveFromPlaylist = (id) => {
    setPlaylist(playlist.filter(p => p.id !== id));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newP = [...playlist];
    [newP[index - 1], newP[index]] = [newP[index], newP[index - 1]];
    setPlaylist(newP);
  };

  const handleMoveDown = (index) => {
    if (index === playlist.length - 1) return;
    const newP = [...playlist];
    [newP[index + 1], newP[index]] = [newP[index], newP[index + 1]];
    setPlaylist(newP);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Required for Firefox
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); // allows dropping
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newP = [...playlist];
    const [movedItem] = newP.splice(draggedIndex, 1);
    newP.splice(dropIndex, 0, movedItem);
    setPlaylist(newP);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleShuffle = () => {
    const newP = [...playlist].sort(() => Math.random() - 0.5);
    setPlaylist(newP);
  };
  
  const handleSaveStream = async () => {
    if (playlist.length === 0) return;
    
    if (!serverRunning) {
      await handleToggleServer(true);
    }

    try {
      const result = await saucebox?.invoke('save-stream-playlist', {
        playlist,
        serverName,
        localIp,
        port,
        downloadPath: settings.downloadPath,
        transcodeEnabled,
      });
      if (!result?.success) {
        throw new Error(result?.error || 'Unknown error');
      }
      setPlaylistUrl(result.url);
      alert('Stream Created! You can now stream this via the network URL.');
    } catch(e) {
      alert('Failed to save playlist: ' + e.message);
    }
  };

  const handleExportM3u = () => {
    if (playlist.length === 0) return;
    let m3u = "#EXTM3U\n";
    m3u += `#PLAYLIST:${serverName}\n`;
    playlist.forEach(item => {
      const tagLine = (item.tags && item.tags.length > 0) ? ` group-title="${item.tags[0]}"` : ` group-title="SauceBox"`;
      let thumbUrl = '';
      let extArt = '';
      if (item.thumbnail) {
         const thumbName = getBasename(item.thumbnail);
         const fullThumbUrl = `http://${localIp}:${port}/${encodeURIComponent(thumbName)}`;
         thumbUrl = ` tvg-logo="${fullThumbUrl}"`;
         extArt = `#EXTART:${fullThumbUrl}\n`;
      }
      m3u += `#EXTINF:${Math.round(item.duration || -1)}${tagLine}${thumbUrl},${item.title}\n`;
      if (extArt) m3u += extArt;
      const filename = getBasename(item.path);
      const urlSuffix = transcodeEnabled ? '?transcode=1' : '';
      m3u += `http://${localIp}:${port}/${encodeURIComponent(filename)}${urlSuffix}\n`;
    });
    
    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'playlist'}.m3u`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportM3u = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const importedPlaylist = [];
      lines.forEach(line => {
        if (!line.startsWith('#') && line.trim() !== '') {
          const url = line.trim();
          const parts = url.split('/');
          const encodedFilename = parts[parts.length - 1];
          try {
            const filename = decodeURIComponent(encodedFilename);
            const foundItem = history.find(h => getBasename(h.path) === filename);
            if (foundItem && !importedPlaylist.find(i => i.id === foundItem.id)) {
              importedPlaylist.push(foundItem);
            }
          } catch(err) {}
        }
      });
      if (importedPlaylist.length > 0) {
        setPlaylist(importedPlaylist);
        alert(`Successfully imported ${importedPlaylist.length} videos from the M3U playlist!`);
      } else {
        alert('Could not match any videos from the M3U file to your current library.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Server & VR Cast</Text>
        <Text style={styles.subtitle}>Stream your local collection to TVs, phones, and VR Headsets 🥽</Text>
      </View>

      <BroadcastWarningCard downloadPath={settings.downloadPath} />

      <BroadcastStatusBanner serverRunning={serverRunning} onToggleServer={handleToggleServer} />

      {serverRunning && (
        <BroadcastServerInfo localIp={localIp} externalIp={externalIp} port={port} exposeInternetEnabled={exposeInternetEnabled} />
      )}

      <BroadcastNetworkConfig 
        serverName={serverName} setServerName={setServerName}
        port={port} setPort={setPort}
        dlnaEnabled={dlnaEnabled} setDlnaEnabled={setDlnaEnabled}
        serverRunning={serverRunning}
      />

      <BroadcastSecurityConfig 
        exposeInternetEnabled={exposeInternetEnabled} setExposeInternetEnabled={setExposeInternetEnabled}
        authEnabled={authEnabled} setAuthEnabled={setAuthEnabled}
        username={username} setUsername={setUsername}
        password={password} setPassword={setPassword}
        serverRunning={serverRunning}
      />

      <BroadcastPlaylistBuilder 
        history={history} playlist={playlist} setPlaylist={setPlaylist} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        sortBy={sortBy} setSortBy={setSortBy}
        handleAddToPlaylist={handleAddToPlaylist} handleRemoveFromPlaylist={handleRemoveFromPlaylist} 
        handleMoveUp={handleMoveUp} handleMoveDown={handleMoveDown}
        draggedIndex={draggedIndex} setDraggedIndex={setDraggedIndex} 
        dragOverIndex={dragOverIndex} setDragOverIndex={setDragOverIndex}
        handleDragStart={handleDragStart} handleDragOver={handleDragOver} 
        handleDragLeave={handleDragLeave} handleDrop={handleDrop} handleDragEnd={handleDragEnd}
        handleShuffle={handleShuffle} handleSaveStream={handleSaveStream} 
        handleExportM3u={handleExportM3u} handleImportM3u={handleImportM3u}
        setPreviewVideo={handlePreviewVideo} serverRunning={serverRunning} playlistUrl={playlistUrl}
        broadcastLogs={broadcastLogs} clearBroadcastLogs={clearBroadcastLogs}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflowY: 'auto' },
  content: { padding: 32, paddingBottom: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, fontStyle: 'italic' }
});
