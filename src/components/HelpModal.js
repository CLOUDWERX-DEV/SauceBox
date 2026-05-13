import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useStore } from '../store';

export default function HelpModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('basics');
  const panicHotkey = useStore(state => state.settings?.stealthHotkey || 'CommandOrControl+Shift+H');

  // Convert Electron accelerator format to human-readable display
  const formatHotkey = (accel) => {
    return accel
      .split('+')
      .map(part => {
        switch (part.trim()) {
          case 'CommandOrControl':
          case 'CmdOrCtrl':
            return 'Ctrl';
          case 'Command':
          case 'Cmd':
            return '⌘';
          case 'Control':
          case 'Ctrl':
            return 'Ctrl';
          case 'Alt':
          case 'Option':
            return 'Alt';
          case 'Shift':
            return 'Shift';
          case 'Super':
            return 'Super';
          case 'Escape':
            return 'Esc';
          case 'Space':
            return 'Space';
          default:
            return part.charAt(0).toUpperCase() + part.slice(1);
        }
      })
      .join(' + ');
  };

  const displayHotkey = formatHotkey(panicHotkey);

  if (!visible) return null;

  const tabs = [
    { id: 'basics', icon: '🚀', label: 'Getting Started' },
    { id: 'gallery', icon: '🗄️', label: 'Gallery & Import' },
    { id: 'stealth', icon: '🥷', label: 'Stealth & Privacy' },
    { id: 'player', icon: '🎬', label: 'Playback & Clips' },
    { id: 'broadcast', icon: '📡', label: 'VR & Broadcasting' },
    { id: 'advanced', icon: '⚙️', label: 'Advanced Settings' },
    { id: 'troubleshooting', icon: '🔧', label: 'Troubleshooting' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'basics':
        return (
          <View>
            <Text style={styles.contentTitle}>Getting Started</Text>
            <Text style={styles.contentSubtitle}>Download and manage your offline video library.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📥</Text>
                <Text style={styles.cardTitle}>Downloading Videos</Text>
              </View>
              <Text style={styles.paragraph}>
                Paste any video or playlist URL into the Download tab and hit the download button. SauceBox will queue it up and fetch it automatically. For playlists, you'll get a picker to choose specific videos before downloading.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📋</Text>
                <Text style={styles.cardTitle}>Batch Downloading</Text>
              </View>
              <Text style={styles.paragraph}>
                Click <Text style={styles.highlight}>Open Batch Mode</Text> on the Download tab to paste in a list of URLs — one per line. All of them will be queued up and downloaded in sequence automatically.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🌐</Text>
                <Text style={styles.cardTitle}>Chrome Extension</Text>
              </View>
              <Text style={styles.paragraph}>
                Install the <Text style={styles.highlight}>SauceBox Companion Extension</Text> from the chrome-extension folder. Once installed, right-click any video while browsing and choose <Text style={styles.highlight}>"Send to SauceBox"</Text> to queue it instantly without switching apps.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🗂️</Text>
                <Text style={styles.cardTitle}>The Queue</Text>
              </View>
              <Text style={styles.paragraph}>
                The Queue tab shows all your pending and active downloads. You can pause, resume, or retry individual items. Once a download finishes, it automatically moves to your Gallery.
              </Text>
            </View>
          </View>
        );

      case 'gallery':
        return (
          <View>
            <Text style={styles.contentTitle}>Gallery & Importing</Text>
            <Text style={styles.contentSubtitle}>Browse, organize, and manage your local video library.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎥</Text>
                <Text style={styles.cardTitle}>Importing Existing Videos</Text>
              </View>
              <Text style={styles.paragraph}>
                Already have videos on your hard drive? Click <Text style={styles.highlight}>Import</Text> in the Gallery tab. You can import a single file or an entire folder. SauceBox will scan each file and pull out the title, duration, resolution, and file size automatically.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>✏️</Text>
                <Text style={styles.cardTitle}>Editing Video Details</Text>
              </View>
              <Text style={styles.paragraph}>
                Click the <Text style={styles.highlight}>Edit</Text> button on any gallery card to update the title, creator, tags, or rating. Changes save instantly.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🏷️</Text>
                <Text style={styles.cardTitle}>Tags & Filtering</Text>
              </View>
              <Text style={styles.paragraph}>
                Use the filter bar at the top of the Gallery to search by title, filter by resolution, minimum rating, or tags. You can select multiple tags at once — the gallery will show only videos that have all of the selected tags.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Click a tag in the filter bar to activate it.</Text>
                <Text style={styles.bulletItem}>• Click it again to deactivate it.</Text>
                <Text style={styles.bulletItem}>• Click <Text style={styles.highlight}>All</Text> to clear all active tag filters.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🤖</Text>
                <Text style={styles.cardTitle}>Auto-Tagging</Text>
              </View>
              <Text style={styles.paragraph}>
                When enabled in Settings, SauceBox will automatically add a tag for the site the video came from (e.g., <Text style={styles.highlight}>Pornhub</Text>, <Text style={styles.highlight}>Spankbang</Text>). This happens automatically on download — you don't need to do anything.
              </Text>
            </View>
          </View>
        );

      case 'stealth':
        return (
          <View>
            <Text style={styles.contentTitle}>Stealth & Privacy</Text>
            <Text style={styles.contentSubtitle}>Keep your activity private and secure.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🔒</Text>
                <Text style={styles.cardTitle}>Vault Mode</Text>
              </View>
              <Text style={styles.paragraph}>
                Turn on <Text style={styles.highlight}>Vault Mode</Text> in Settings. The app will ask for your 4-digit PIN every time it opens. Without the correct PIN, no one can see your queue or gallery.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Go to Settings → Privacy → Enable Vault Mode.</Text>
                <Text style={styles.bulletItem}>• Set your 4-digit PIN.</Text>
                <Text style={styles.bulletItem}>• The PIN will be required on every app launch.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🚨</Text>
                <Text style={styles.cardTitle}>Panic / Stealth Hotkey</Text>
              </View>
              <Text style={styles.paragraph}>
                Press <Text style={styles.code}>{displayHotkey}</Text> at any time to instantly hide the app. The window disappears immediately — no animation, no delay. Active downloads are paused and video playback is silenced.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Press the hotkey again to bring the app back.</Text>
                <Text style={styles.bulletItem}>• You can change the hotkey in Settings → Privacy.</Text>
                <Text style={styles.bulletItem}>• The hotkey works even when the app is in the background.</Text>
              </View>
            </View>
          </View>
        );

      case 'player':
        return (
          <View>
            <Text style={styles.contentTitle}>Playback & Clipping</Text>
            <Text style={styles.contentSubtitle}>Watch and trim your videos without leaving the app.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>▶️</Text>
                <Text style={styles.cardTitle}>Playing Videos</Text>
              </View>
              <Text style={styles.paragraph}>
                Click any video thumbnail in the Gallery or a completed item in the Queue to open the built-in player. Use standard controls to play, pause, seek, and adjust volume.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>✂️</Text>
                <Text style={styles.cardTitle}>Clipping a Highlight</Text>
              </View>
              <Text style={styles.paragraph}>
                You can trim any video down to just the part you want without re-encoding or losing quality.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Open a video in the player.</Text>
                <Text style={styles.bulletItem}>• Click the <Text style={styles.highlight}>Clip</Text> icon.</Text>
                <Text style={styles.bulletItem}>• Enter a start time and end time (e.g., <Text style={styles.code}>00:02:30</Text> to <Text style={styles.code}>00:05:00</Text>).</Text>
                <Text style={styles.bulletItem}>• The clip saves as a new file in your gallery. The original is not affected.</Text>
              </View>
            </View>
          </View>
        );

      case 'broadcast':
        return (
          <View>
            <Text style={styles.contentTitle}>Media Server & VR Broadcast</Text>
            <Text style={styles.contentSubtitle}>Stream your local collection directly to Smart TVs, phones, and VR Headsets.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📡</Text>
                <Text style={styles.cardTitle}>Quick Cast</Text>
              </View>
              <Text style={styles.paragraph}>
                In your Gallery, every video card has a Quick Cast 📡 button. Clicking this instantly starts the broadcast server and generates a temporary playlist with just that single video. You can scan the QR code to watch it instantly on another device.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>▶️</Text>
                <Text style={styles.cardTitle}>Playlist Builder</Text>
              </View>
              <Text style={styles.paragraph}>
                Head to the Broadcast Tab to build a custom M3U playlist. You can search your library, reorder videos by dragging, and shuffle. Once ready, click <Text style={styles.highlight}>Host Stream URL</Text> to serve the M3U over your local network. VR players like Skybox VR can read this URL directly.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎨</Text>
                <Text style={styles.cardTitle}>Advanced Metadata & Transcoding</Text>
              </View>
              <Text style={styles.paragraph}>
                SauceBox injects gorgeous thumbnails and custom tags directly into your M3U streams.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Thumbnails</Text>: #EXTART headers provide beautiful cover art in compatible VR players.</Text>
                <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Tags</Text>: Videos are automatically grouped by your custom tags in the playlist.</Text>
                <Text style={styles.bulletItem}>• <Text style={styles.highlight}>On-the-Fly Transcoding</Text>: Enable this in Advanced Settings to force incompatible formats (like .mkv) to stream as .mp4 instantly.</Text>
              </View>
            </View>
          </View>
        );

      case 'advanced':
        return (
          <View>
            <Text style={styles.contentTitle}>Advanced Settings</Text>
            <Text style={styles.contentSubtitle}>Fine-tune how SauceBox downloads and behaves.</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>⚡</Text>
                <Text style={styles.cardTitle}>Download Speed & Concurrency</Text>
              </View>
              <Text style={styles.paragraph}>
                If downloads are slowing down your internet, use the <Text style={styles.highlight}>Speed Limit</Text> setting to cap how much bandwidth SauceBox uses. You can also limit how many files download at the same time with <Text style={styles.highlight}>Concurrent Downloads</Text>.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🛡️</Text>
                <Text style={styles.cardTitle}>Low Disk Space Protection</Text>
              </View>
              <Text style={styles.paragraph}>
                Set a <Text style={styles.highlight}>Minimum Free Space</Text> limit in Settings (default is 5GB). If your disk gets too full, SauceBox will automatically pause all downloads instead of filling up your drive completely.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📁</Text>
                <Text style={styles.cardTitle}>Custom Binary Paths</Text>
              </View>
              <Text style={styles.paragraph}>
                If you have a specific version of yt-dlp or ffmpeg installed somewhere other than the system PATH, you can point SauceBox directly to those executables in Settings. This is useful if you want to use a portable or newer version without changing your system settings.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🌍</Text>
                <Text style={styles.cardTitle}>Proxy</Text>
              </View>
              <Text style={styles.paragraph}>
                If a site is blocked in your region, enter an <Text style={styles.highlight}>HTTP</Text> or <Text style={styles.highlight}>SOCKS5</Text> proxy address in Settings. All download requests will be routed through it.
              </Text>
            </View>
          </View>
        );

      case 'troubleshooting':
        return (
          <View>
            <Text style={styles.contentTitle}>Troubleshooting</Text>
            <Text style={styles.contentSubtitle}>Fix common errors and core dependencies.</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🛠️</Text>
                <Text style={styles.cardTitle}>Downloads Failing or Metadata Missing?</Text>
              </View>
              <Text style={styles.paragraph}>
                Tube sites update their code all the time, which can break downloads. This is almost always caused by an outdated version of <Text style={styles.highlight}>yt-dlp</Text>. To fix this, you need to update it via your system terminal:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• If you installed via pip: <Text style={styles.code}>pip install -U yt-dlp</Text></Text>
                <Text style={styles.bulletItem}>• If you installed via Homebrew (Mac): <Text style={styles.code}>brew upgrade yt-dlp</Text></Text>
                <Text style={styles.bulletItem}>• If you installed the binary manually: run <Text style={styles.code}>yt-dlp -U</Text></Text>
                <Text style={styles.bulletItem}>• Advanced: You can specify a custom binary path for yt-dlp directly in the Settings tab if you prefer using a portable version instead of the system PATH.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎞️</Text>
                <Text style={styles.cardTitle}>Thumbnails or Clipping Not Working?</Text>
              </View>
              <Text style={styles.paragraph}>
                If SauceBox is failing to generate thumbnails for imported videos, unable to extract highlight clips, or struggling to parse accurate durations/file sizes, there is likely an issue with your <Text style={styles.highlight}>ffmpeg</Text> installation.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Ensure <Text style={styles.highlight}>ffmpeg</Text> and <Text style={styles.highlight}>ffprobe</Text> are fully installed and accessible in your system's PATH variable.</Text>
                <Text style={styles.bulletItem}>• Open your terminal and type <Text style={styles.code}>ffmpeg -version</Text>. If it says command not found, you need to reinstall it.</Text>
                <Text style={styles.bulletItem}>• Windows users: Make sure you didn't just download the source code; you need the compiled <Text style={styles.code}>.exe</Text> binaries placed in a PATH-accessible folder.</Text>
                <Text style={styles.bulletItem}>• Advanced: You can skip the system PATH entirely by pointing SauceBox to a custom ffmpeg/ffprobe executable path directly inside the Settings tab.</Text>
              </View>
            </View>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💽</Text>
                <Text style={styles.cardTitle}>Blank UI / Disk Errors</Text>
              </View>
              <Text style={styles.paragraph}>
                If the Gallery is empty or videos aren't showing, check that you haven't moved the video files manually via your file explorer. SauceBox stores the file path at import time — if the file moves, it can't find it anymore.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Use the 📁 folder button on any gallery card to see where a file is expected to be.</Text>
                <Text style={styles.bulletItem}>• If your disk is full, SauceBox will pause downloads. Check the Free Space setting in Settings.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🔑</Text>
                <Text style={styles.cardTitle}>Forgot Your Vault PIN?</Text>
              </View>
              <Text style={styles.paragraph}>
                There is no PIN recovery built in. If you're locked out, you'll need to reset it manually by editing the app's config file directly.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• All app data is stored in your browser's <Text style={styles.highlight}>localStorage</Text> under the key <Text style={styles.code}>saucebox-storage</Text>.</Text>
                <Text style={styles.bulletItem}>• Open DevTools in the app (<Text style={styles.code}>Ctrl + Shift + I</Text>), go to <Text style={styles.highlight}>Application → Local Storage</Text>, find the key <Text style={styles.code}>saucebox-storage</Text>, and edit the <Text style={styles.code}>vaultPin</Text> field to a new 4-digit number.</Text>
                <Text style={styles.bulletItem}>• You can also set <Text style={styles.code}>vaultEnabled</Text> to <Text style={styles.code}>false</Text> to disable the Vault entirely without needing the PIN.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📂</Text>
                <Text style={styles.cardTitle}>Where Config & Data is Stored</Text>
              </View>
              <Text style={styles.paragraph}>
                SauceBox stores all settings, your gallery, queue, and tags in a single <Text style={styles.highlight}>localStorage</Text> entry inside Electron's renderer process. There is no separate config file on disk.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Key name: <Text style={styles.code}>saucebox-storage</Text></Text>
                <Text style={styles.bulletItem}>• Access it via DevTools → Application → Local Storage → <Text style={styles.code}>http://localhost:8081</Text></Text>
                <Text style={styles.bulletItem}>• The data is stored as JSON. You can copy it out as a backup or restore it by pasting it back in.</Text>
                <Text style={styles.bulletItem}>• Your actual video files are stored wherever you set your Download Path in Settings — SauceBox does not move or manage the files themselves.</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🔄</Text>
                <Text style={styles.cardTitle}>Full Reset</Text>
              </View>
              <Text style={styles.paragraph}>
                If something is seriously broken and you want to wipe everything and start fresh:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletItem}>• Open DevTools (<Text style={styles.code}>Ctrl + Shift + I</Text>)</Text>
                <Text style={styles.bulletItem}>• Go to <Text style={styles.highlight}>Application → Local Storage</Text></Text>
                <Text style={styles.bulletItem}>• Right-click and delete the <Text style={styles.code}>saucebox-storage</Text> key</Text>
                <Text style={styles.bulletItem}>• Restart the app — it will start with all default settings</Text>
                <Text style={styles.bulletItem}>• Note: this removes your gallery, queue, and settings but does NOT delete your video files from disk</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.headerIconWrapper}>
                <Text style={styles.headerIconText}>?</Text>
              </View>
              <View>
                <Text style={styles.title}>SauceBox Documentation</Text>
                <Text style={styles.headerSubtext}>The Definitive Guide</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                    {isActive && <View style={styles.tabActiveIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Main Content Area */}
            <ScrollView style={styles.contentArea}>
              {renderContent()}
            </ScrollView>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    width: '85%',
    maxWidth: 1100,
    height: '85%',
    maxHeight: 800,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtext: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingVertical: 24,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    position: 'relative',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  tabIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  tabActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  contentArea: {
    flex: 1,
    padding: 40,
    backgroundColor: theme.colors.surface,
  },
  contentTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: theme.colors.surfaceLight,
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  paragraph: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
  },
  highlight: {
    color: '#fff',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: theme.colors.primary,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bulletList: {
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
    paddingLeft: 12,
  },
  bulletItem: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
  }
});
