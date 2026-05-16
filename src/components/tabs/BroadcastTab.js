import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Image } from 'react-native';
import QRCode from 'react-qr-code';
import { theme } from '../../theme';
import { useStore } from '../../store';
import VideoThumbnail from '../VideoThumbnail';
import VideoPlayer from '../VideoPlayer';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

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
  const [previewVideo, setPreviewVideo] = useState(null);
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
    ipcRenderer?.invoke('get-local-ip').then(ip => setLocalIp(ip));
    
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
      const res = await ipcRenderer?.invoke('stop-media-server');
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
      const res = await ipcRenderer?.invoke('start-media-server', config);
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
      const newPlaylist = [quickCastVideo];
      setPlaylist(newPlaylist);
      setQuickCastVideo(null); // clear it
      handleToggleServer(true).then(() => {
        // Automatically save stream after starting server
        generateM3U(newPlaylist);
      });
    }
  }, [quickCastVideo]);

  const generateM3U = (currentPlaylist = playlist) => {
    if (!fs || !path || currentPlaylist.length === 0) return;
    
    let m3u = "#EXTM3U\n";
    m3u += `#PLAYLIST:${serverName}\n`;
    currentPlaylist.forEach(item => {
      const tagLine = (item.tags && item.tags.length > 0) ? ` group-title="${item.tags[0]}"` : ` group-title="SauceBox"`;
      let thumbUrl = '';
      let extArt = '';
      if (item.thumbnail) {
         const thumbName = path.basename(item.thumbnail);
         const fullThumbUrl = `http://${localIp}:${port}/${encodeURIComponent(thumbName)}`;
         thumbUrl = ` tvg-logo="${fullThumbUrl}"`;
         extArt = `#EXTART:${fullThumbUrl}\n`;
      }
      m3u += `#EXTINF:${Math.round(item.duration || -1)}${tagLine}${thumbUrl},${item.title}\n`;
      if (extArt) m3u += extArt;
      const filename = path.basename(item.path);
      const urlSuffix = transcodeEnabled ? '?transcode=1' : '';
      m3u += `http://${localIp}:${port}/${encodeURIComponent(filename)}${urlSuffix}\n`;
    });
    
    const m3uPath = path.join(settings.downloadPath, 'stream.m3u');
    try {
      fs.writeFileSync(m3uPath, m3u, 'utf8');
      setPlaylistUrl(`http://${localIp}:${port}/stream.m3u`);
    } catch(e) {
      console.error('Failed to auto-save playlist:', e);
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
    if (!fs || !path || playlist.length === 0) return;
    
    if (!serverRunning) {
      await handleToggleServer(true);
    }
    
    let m3u = "#EXTM3U\n";
    m3u += `#PLAYLIST:${serverName}\n`;
    playlist.forEach(item => {
      const tagLine = (item.tags && item.tags.length > 0) ? ` group-title="${item.tags[0]}"` : ` group-title="SauceBox"`;
      let thumbUrl = '';
      let extArt = '';
      if (item.thumbnail) {
         const thumbName = path.basename(item.thumbnail);
         const fullThumbUrl = `http://${localIp}:${port}/${encodeURIComponent(thumbName)}`;
         thumbUrl = ` tvg-logo="${fullThumbUrl}"`;
         extArt = `#EXTART:${fullThumbUrl}\n`;
      }
      m3u += `#EXTINF:${Math.round(item.duration || -1)}${tagLine}${thumbUrl},${item.title}\n`;
      if (extArt) m3u += extArt;
      const filename = path.basename(item.path);
      // Append ?transcode=1 if transcoding is enabled so the backend knows
      const urlSuffix = transcodeEnabled ? '?transcode=1' : '';
      m3u += `http://${localIp}:${port}/${encodeURIComponent(filename)}${urlSuffix}\n`;
    });
    
    const m3uPath = path.join(settings.downloadPath, 'stream.m3u');
    try {
      fs.writeFileSync(m3uPath, m3u, 'utf8');
      setPlaylistUrl(`http://${localIp}:${port}/stream.m3u`);
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
         const thumbName = path.basename(item.thumbnail);
         const fullThumbUrl = `http://${localIp}:${port}/${encodeURIComponent(thumbName)}`;
         thumbUrl = ` tvg-logo="${fullThumbUrl}"`;
         extArt = `#EXTART:${fullThumbUrl}\n`;
      }
      m3u += `#EXTINF:${Math.round(item.duration || -1)}${tagLine}${thumbUrl},${item.title}\n`;
      if (extArt) m3u += extArt;
      const filename = path.basename(item.path);
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
            const foundItem = history.find(h => path.basename(h.path) === filename);
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

      <View style={styles.warningCard}>
        <Text style={styles.warningCardTitle}>⚠️ Network Security Warning</Text>
        <Text style={styles.warningCardText}>
          The folder currently set as your download path ({settings.downloadPath || 'your downloads folder'}) will be fully shared over the network. 
          Anyone with this server URL can access and play the media inside.
        </Text>
        <Text style={[styles.warningCardText, { marginTop: 8, fontWeight: 'bold' }]}>
          For improved security on untrusted networks, please enable "Require Authentication" in the Security section below and set a strong password. This ensures only authorized users can access your media streams.
        </Text>
      </View>

      <View style={styles.statusBanner}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: serverRunning ? theme.colors.primary : theme.colors.error }]} />
          <Text style={styles.statusText}>
            {serverRunning ? 'Server is Running' : 'Server is Offline'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.toggleButton, { backgroundColor: serverRunning ? theme.colors.error : theme.colors.primary }]}
          onPress={() => handleToggleServer()}
        >
          <Text style={[styles.toggleButtonText, serverRunning && { color: '#fff' }]}>
            {serverRunning ? 'Stop Server' : 'Start Server'}
          </Text>
        </TouchableOpacity>
      </View>

      {serverRunning && (
        <View style={{ gap: 24, marginBottom: 32 }}>
          <View style={styles.activeInfoCard}>
            <View style={styles.activeInfoQr}>
              <QRCode value={`http://${localIp}:${port}`} size={120} bgColor={`${theme.colors.primary}10`} fgColor={theme.colors.text} />
              <Text style={styles.qrTextSmall}>Scan to Connect</Text>
            </View>
            <View style={styles.activeInfoDetails}>
              <Text style={styles.activeLabel}>Local Network Server:</Text>
              <View style={styles.ipContainer}>
                <Text style={styles.ipText}>http://{localIp}:{port}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    const copyUrl = `http://${localIp}:${port}`;
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(copyUrl)
                        .then(() => alert('Copied to clipboard!'))
                        .catch(err => {
                          const el = document.createElement('textarea');
                          el.value = copyUrl;
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand('copy');
                          document.body.removeChild(el);
                          alert('Copied to clipboard!');
                        });
                    } else {
                      const el = document.createElement('textarea');
                      el.value = copyUrl;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      alert('Copied to clipboard!');
                    }
                  }}
                >
                  <Text style={styles.copyButtonText}>Copy URL</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hintText}>Make sure your TV or VR Headset is on the same WiFi network.</Text>
            </View>
          </View>

          {exposeInternetEnabled && externalIp && (
            <View style={[styles.activeInfoCard, { borderColor: theme.colors.error, backgroundColor: `${theme.colors.error}10` }]}>
              <View style={[styles.activeInfoQr, { borderColor: theme.colors.error }]}>
                <QRCode value={`http://${externalIp}:${port}`} size={120} bgColor={`${theme.colors.error}10`} fgColor={theme.colors.text} />
                <Text style={[styles.qrTextSmall, { color: theme.colors.error }]}>Scan to Connect</Text>
              </View>
              <View style={styles.activeInfoDetails}>
                <Text style={styles.activeLabel}>Public Internet Server:</Text>
                <View style={[styles.ipContainer, { borderColor: theme.colors.error }]}>
                  <Text style={[styles.ipText, { color: theme.colors.error }]}>http://{externalIp}:{port}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      const copyUrl = `http://${externalIp}:${port}`;
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(copyUrl).then(() => alert('Copied to clipboard!')).catch(err => alert('Failed to copy.'));
                      } else {
                        const el = document.createElement('textarea');
                        el.value = copyUrl;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert('Copied to clipboard!');
                      }
                    }}
                  >
                    <Text style={styles.copyButtonText}>Copy URL</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>Warning: This requires Port Forwarding on your router to work.</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Network Configuration</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Server Name (M3U Metadata)</Text>
              <Text style={styles.switchDesc}>The name of your playlist/server shown in supported media players</Text>
            </View>
            <TextInput
              style={[styles.textInput, { width: 150 }]}
              value={serverName}
              onChangeText={setServerName}
              editable={!serverRunning}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Server Port</Text>
              <Text style={styles.switchDesc}>The port used for the HTTP media server</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={port}
              onChangeText={setPort}
              keyboardType="numeric"
              editable={!serverRunning}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>DLNA / UPnP Broadcasting</Text>
              <Text style={styles.switchDesc}>Allow Smart TVs and Consoles to automatically discover SauceBox on the network</Text>
            </View>
            <Switch
              value={dlnaEnabled}
              onValueChange={setDlnaEnabled}
              disabled={serverRunning}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
              thumbColor={dlnaEnabled ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Security & Exposure</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Expose Server to the Internet</Text>
              <Text style={styles.switchDesc}>Show your public IP address to access the server from anywhere. Requires port forwarding on your router.</Text>
            </View>
            <Switch
              value={exposeInternetEnabled}
              onValueChange={(val) => {
                if (val) {
                  const confirm = window.confirm("WARNING: Exposing your media server to the internet can be dangerous. Anyone with your public IP address and port can access your videos if port forwarding is enabled on your router. We HIGHLY recommend enabling 'Require Authentication' below before doing this.\n\nAre you sure you want to enable this feature?");
                  if (!confirm) return;
                }
                setExposeInternetEnabled(val);
              }}
              disabled={serverRunning}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.error}40` }}
              thumbColor={exposeInternetEnabled ? theme.colors.error : theme.colors.textTertiary}
            />
          </View>

          <View style={[styles.switchRow, { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 24 }]}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Require Authentication</Text>
              <Text style={styles.switchDesc}>Require a username and password to access the web interface</Text>
            </View>
            <Switch
              value={authEnabled}
              onValueChange={setAuthEnabled}
              disabled={serverRunning}
              trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
              thumbColor={authEnabled ? theme.colors.primary : theme.colors.textTertiary}
            />
          </View>

          {authEnabled && (
            <View style={{ marginTop: 24, gap: 16 }}>
              <View>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[styles.textInput, { width: '100%' }]}
                  value={username}
                  onChangeText={setUsername}
                  editable={!serverRunning}
                />
              </View>
              <View>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[styles.textInput, { width: '100%' }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Leave empty for no password"
                  placeholderTextColor={theme.colors.textTertiary}
                  editable={!serverRunning}
                />
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>▶️ Playlist Builder</Text>
        <Text style={styles.subtitle}>Create a custom .m3u playlist to stream seamlessly</Text>
        
        <View style={styles.playlistContainer}>
          <View style={styles.playlistColumn}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.columnTitle}>Available Videos</Text>
              <TextInput 
                style={[styles.textInputFull, { marginTop: 0, width: 150, paddingVertical: 6 }]} 
                placeholder="Search..." 
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView style={styles.videoList}>
              {history
                .filter(h => !playlist.find(p => p.id === h.id))
                .filter(h => !searchQuery || h.title.toLowerCase().includes(searchQuery.toLowerCase()) || (h.tags && h.tags.join(' ').toLowerCase().includes(searchQuery.toLowerCase())))
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
                      {item.duration ? Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0') : '??:??'} • {item.resolution || 'HD'} {item.rating ? `• ${'⭐'.repeat(item.rating)}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.addButton} onPress={() => handleAddToPlaylist(item)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.playlistColumn}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.columnTitle}>Current Playlist ({playlist.length})</Text>
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
            <ScrollView style={styles.videoList}>
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
                    onChangeText={() => {}} // dummy to avoid readonly warning
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
              {playlist.length === 0 && <Text style={styles.hintText}>Playlist is empty.</Text>}
            </ScrollView>
            
            <View style={styles.playlistActions}>
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
        </View>
      </View>
      
      <VideoPlayer 
        visible={!!previewVideo}
        videoPath={previewVideo?.path}
        videoTitle={previewVideo?.title}
        originalItem={previewVideo}
        onClose={() => setPreviewVideo(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: 'scroll',
  },
  content: {
    padding: 32,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
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
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  activeInfoCard: {
    backgroundColor: `${theme.colors.primary}10`,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  activeInfoQr: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrTextSmall: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeInfoDetails: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 16,
    width: '100%',
  },
  ipText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    cursor: 'pointer',
  },
  copyButtonText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  hintText: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningCard: {
    backgroundColor: `${theme.colors.error}20`,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.error}80`,
    marginBottom: 24,
  },
  warningCardTitle: {
    color: theme.colors.error,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningCardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    outlineStyle: 'none',
    width: 100,
    textAlign: 'center',
  },
  qrPlaceholderContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  qrText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  playlistContainer: {
    flexDirection: 'row',
    gap: 24,
    height: 600,
    marginTop: 16,
  },
  playlistColumn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  videoList: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  videoTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoMeta: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  addButton: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  rowControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlIcon: {
    fontSize: 14,
    cursor: 'pointer',
  },
  playlistActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  smallButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  smallButtonText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  playlistUrlContainer: {
    marginTop: 16,
    backgroundColor: `${theme.colors.primary}10`,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  liveMonitorCard: {
    marginTop: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
  },
  logsList: {
    maxHeight: 150,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  logTime: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    width: 70,
  },
  logIp: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
    width: 100,
  },
  logFile: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  textInputFull: {
    backgroundColor: '#000',
    borderRadius: 6,
    padding: 10,
    color: theme.colors.primary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
    width: '100%',
    outlineStyle: 'none',
  },
  thumbnailPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 10px rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  }
});
