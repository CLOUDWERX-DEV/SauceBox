import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { helpStyles as styles } from './HelpStyles';
import { theme } from '../../theme';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
const openExternal = (url) => ipcRenderer?.invoke('open-external', url);

const handleCopyToClipboard = (text, label) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => alert(`${label || 'Text'} copied to clipboard!`))
      .catch(() => alert('Failed to copy to clipboard.'));
  } else {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert(`${label || 'Text'} copied to clipboard!`);
    } catch (e) {
      alert('Failed to copy to clipboard.');
    }
  }
};

export default function HelpContent({ activeTab, displayHotkey }) {
  switch (activeTab) {
    case 'basics':
      return (
        <View>
          <Text style={styles.contentTitle}>Getting Started</Text>
          <Text style={styles.contentSubtitle}>SauceBox combines the raw power of yt-dlp with a premium desktop interface to give adult content enthusiasts a fully private, locally-hosted media empire — with VR broadcasting, batch downloading, and a panic-button stealth mode built right in.</Text>

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

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🎲</Text>
              <Text style={styles.cardTitle}>Feeling Lucky?</Text>
            </View>
            <Text style={styles.paragraph}>
              Click the SauceBox logo in the top-left corner of the sidebar to trigger the "Feeling Lucky" function!
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• If you have videos in your Gallery, it will randomly pick one and instantly start playing it.</Text>
              <Text style={styles.bulletItem}>• If your Gallery is empty, it will open a random supported adult site in your default browser to help you stock up.</Text>
            </View>
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

    case 'playlists':
      return (
        <View>
          <Text style={styles.contentTitle}>Playlists Collection</Text>
          <Text style={styles.contentSubtitle}>Create, curate, edit, and play custom video collections dynamically.</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>➕</Text>
              <Text style={styles.cardTitle}>Creating a Playlist Draft</Text>
            </View>
            <Text style={styles.paragraph}>
              Click <Text style={styles.highlight}>➕ NEW PLAYLIST</Text> on the Playlists tab (or the centered button when empty). This opens a secure, local in-memory draft session. Any edits you make here are isolated and will not pollute your permanent database until you explicitly click the orange <Text style={styles.highlight}>💾 Save & Return</Text> button!
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Rename</Text>: Change the title using the edit input at the top of the editor.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Custom Cover Art</Text>: Hover over the playlist thumbnail and click to select a custom image from your hard drive, or let SauceBox automatically generate a beautiful collage grid from your items!</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Discard</Text>: Clicking <Text style={styles.highlight}>↩ Discard</Text> safely reverts all changes and exits without writing to disk.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>✏️</Text>
              <Text style={styles.cardTitle}>Curating & Reordering Videos</Text>
            </View>
            <Text style={styles.paragraph}>
              Curating is extremely intuitive with our dual-pane layout:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Available Videos (Left Panel)</Text>: Shows all videos in your library with built-in search filtering, sorting, tags, resolution, and rating badges. Click <Text style={styles.highlight}>➕ Add to Playlist</Text> to append it to your playlist.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Active Playlist (Right Panel)</Text>: Shows your current list. Click the trash icon to remove items. Click the up/down arrows or type a number in the sequence index input to instantly move items to a specific position!</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>▶️</Text>
              <Text style={styles.cardTitle}>Playback & Auto-Advance</Text>
            </View>
            <Text style={styles.paragraph}>
              Playlists integrate beautifully with all playback methods:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Built-in Video Player</Text>: Hover over any playlist and click the orange Play icon to start playing. Once a video ends, the player will automatically advance to the next item in your playlist! You can also click the Next/Prev buttons on the player overlay to skip.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>External Media Players</Text>: If you have configured a custom player (like VLC or MPV) in Settings, clicking play will feed your entire playlist sequence directly to your external player for native local playback.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Collection Stats Badges</Text>
            </View>
            <Text style={styles.paragraph}>
              The Playlists gallery header displays real-time combined statistics of your entire collection:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Playlists Count</Text>: The total number of curated playlists.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Storage Footprint</Text>: Combined disk storage size of all unique files across your playlists.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Total Playtime</Text>: Cumulative playtime of all unique items across your playlists (duplicates across playlists are only counted once!).</Text>
            </View>
          </View>
        </View>
      );

    case 'extension':
      return (
        <View>
          <Text style={styles.contentTitle}>Web Extension & Integration</Text>
          <Text style={styles.contentSubtitle}>Send videos directly to your SauceBox queue without ever leaving your browser. 🌐 🧩</Text>

          {/* Quick Install Guide */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📥</Text>
              <Text style={styles.cardTitle}>How to Install (Chrome/Brave/Edge)</Text>
            </View>
            <Text style={styles.paragraph}>
              SauceBox includes a companion Manifest V3 browser extension. Because it is securely self-hosted offline, you load it directly in your browser using <Text style={styles.highlight}>Developer Mode</Text>:
            </Text>
            
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                1. Copy the extensions settings URL below for your browser, paste it into your browser search bar, and hit Enter:
              </Text>
              
              {/* Copy URL Shortcuts Row */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 }}>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('chrome://extensions', 'Chrome URL')}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>📋 Copy Chrome URL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('brave://extensions', 'Brave URL')}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>📋 Copy Brave URL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('edge://extensions', 'Edge URL')}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>📋 Copy Edge URL</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.bulletItem}>2. Turn on the <Text style={styles.highlight}>Developer mode</Text> toggle switch in the top right corner.</Text>
              <Text style={styles.bulletItem}>3. Click the <Text style={styles.highlight}>Load unpacked</Text> button in the top left.</Text>
              <Text style={styles.bulletItem}>4. Select the <Text style={styles.highlight}>chrome-extension</Text> folder inside your main SauceBox folder.</Text>
              <Text style={styles.bulletItem}>5. The extension is now active! Right-click any video page or click the toolbar icon to queue.</Text>
            </View>
          </View>

          {/* Quick Copy Script Snippets */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>💻</Text>
              <Text style={styles.cardTitle}>Quick Extract Snippets (Desktop Copy)</Text>
            </View>
            <Text style={[styles.paragraph, { marginBottom: 16 }]}>
              Wanna make loading the unpacked extension incredibly easy? Copy and paste the matching command below into your system terminal to instantly extract the extension folder straight to your Desktop:
            </Text>

            {/* Bash / Linux / macOS */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Bash / Terminal (Linux & macOS)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.primary, fontSize: 12 }}>
                  cp -r chrome-extension ~/Desktop/SauceBox-Extension
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('cp -r chrome-extension ~/Desktop/SauceBox-Extension', 'Bash script')}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PowerShell */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Windows PowerShell</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.primary, fontSize: 12 }}>
                  Copy-Item -Path ".\chrome-extension" -Destination "$HOME\Desktop\SauceBox-Extension" -Recurse
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('Copy-Item -Path ".\\chrome-extension" -Destination "$HOME\\Desktop\\SauceBox-Extension" -Recurse', 'PowerShell script')}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CMD Windows */}
            <View>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Windows Command Prompt (CMD)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.primary, fontSize: 12 }}>
                  xcopy /E /I chrome-extension %USERPROFILE%\Desktop\SauceBox-Extension
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('xcopy /E /I chrome-extension %USERPROFILE%\\Desktop\\SauceBox-Extension', 'CMD script')}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Under the Hood / Curl API testing */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📡</Text>
              <Text style={styles.cardTitle}>Integration CLI Testing (For Developers)</Text>
            </View>
            <Text style={[styles.paragraph, { marginBottom: 16 }]}>
              SauceBox runs an offline receiver at <Text style={styles.code}>localhost:13337</Text> to fetch extension requests. You can test and trigger integration directly from your terminal:
            </Text>

            {/* Curl health check */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>1. Check Background Server Connection Health</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.primary, fontSize: 12 }}>
                  curl http://localhost:13337/health
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('curl http://localhost:13337/health', 'Health check command')}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Curl enqueue */}
            <View>
              <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>2. Remotely Enqueue Video Download URL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.primary, fontSize: 11 }}>
                  {"curl -X POST -H \"Content-Type: application/json\" -d '{\"url\":\"https://example.com/video\"}' http://localhost:13337/enqueue"}
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  onPress={() => handleCopyToClipboard('curl -X POST -H "Content-Type: application/json" -d \'{"url":"https://example.com/video"}\' http://localhost:13337/enqueue', 'Enqueue command')}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
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
          <Text style={styles.contentSubtitle}>Watch and trim your videos with professional visual tools directly in the player overlay.</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>▶️</Text>
              <Text style={styles.cardTitle}>Playing Videos</Text>
            </View>
            <Text style={styles.paragraph}>
              Click any video thumbnail in the Gallery, a completed item in the Queue, or launch directly from a Playlist to open the built-in player. Features seamless fullscreen support, keyboard hotkeys (Space to pause, left/right arrows to seek), and automatic transition/advancement to the next video when playing collections.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>✂️</Text>
              <Text style={styles.cardTitle}>Clipping a Highlight (Visual Trimmer)</Text>
            </View>
            <Text style={styles.paragraph}>
              SauceBox features a premium, fully interactive visual trimmer that allows you to cut your videos down to custom highlights in seconds with zero re-encoding or quality degradation.
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Open Trimmer</Text>: Play a video in the built-in player and click the orange scissors <Text style={styles.highlight}>✂️ Clip</Text> icon to open the trimmer panel.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Visual Dual-Slider Scrubbing</Text>: Grab the two white vertical pill handles on the timeline track to visually adjust the orange crop range representing your custom clip. You'll get real-time seek previews as you drag the sliders.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Quick-Cut Snapping</Text>: While watching, click the <Text style={styles.highlight}>[ Set Start</Text> or <Text style={styles.highlight}>Set End ]</Text> buttons to snap the cut boundaries instantly to the player's active timestamp.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Lossless FFmpeg Processing</Text>: Click <Text style={styles.highlight}>💾 Extract Clip</Text>. SauceBox will use ffmpeg to slice the video, automatically creating a standalone video card in your gallery. Your original file remains untouched!</Text>
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
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Auto-Clear & Maintenance</Text>
            </View>
            <Text style={styles.paragraph}>
              In Settings, you can enable <Text style={styles.highlight}>Auto-Clear Completed</Text> to keep your Queue clean. The app also features Maintenance tools to scan your hard drive for exact duplicates, find orphaned files, and clean the database of missing items.
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

    case 'sites':
      return (
        <View>
          <Text style={styles.contentTitle}>Supported Sites</Text>
          <Text style={styles.contentSubtitle}>SauceBox supports thousands of sites natively via yt-dlp. Here are the core adult networks explicitly supported:</Text>

          <View style={styles.card}>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Pornhub</Text> — PornHub, PornHubPagedVideoList, PornHubPlaylist, PornHubUser</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>4tube</Text> — 4tube</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Beeg</Text> — Beeg</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>CAM4</Text> — CAM4</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Camsoda</Text> — Camsoda</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Chaturbate</Text> — Chaturbate</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Eporner</Text> — Eporner</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>HellPorno</Text> — HellPorno</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Motherless</Text> — Motherless, MotherlessGallery</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Nuvid</Text> — Nuvid</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>RedTube</Text> — RedTube</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>SpankBang</Text> — SpankBang, SpankBangPlaylist</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Stripchat</Text> — Stripchat</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>ThisVid</Text> — ThisVid</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>Xvideos</Text> — Included under Pornhub extractors</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>YouPorn</Text> — YouPorn</Text>
              <Text style={styles.bulletItem}><Text style={styles.highlight}>... and MANY more!</Text> (Over 1,000+ online video networks supported natively)</Text>
            </View>
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
              There is no PIN recovery built into the UI. If you are locked out, you can easily disable or reset it by editing the settings file directly on your hard drive.
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>1. Close SauceBox completely.</Text>
              <Text style={styles.bulletItem}>2. Navigate to your OS application data folder (see paths below) and open <Text style={styles.highlight}>saucebox-settings.json</Text> in any text editor.</Text>
              <Text style={styles.bulletItem}>3. Find the <Text style={styles.code}>vaultPin</Text> field and change the 4-digit code to a new one, or simply set <Text style={styles.code}>"vaultEnabled": false</Text> to turn the vault off entirely.</Text>
              <Text style={styles.bulletItem}>4. Save the file and launch SauceBox. You will be able to enter directly or with your newly set PIN!</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📂</Text>
              <Text style={styles.cardTitle}>Where Config & Data is Stored</Text>
            </View>
            <Text style={styles.paragraph}>
              All settings and database records are kept strictly offline on your computer. SauceBox splits your local state into two clean, human-readable JSON files inside the application data directory:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>saucebox-settings.json</Text> — Stores configuration settings: stealth hotkeys, download speed limits, proxy, vault credentials, and system binary paths.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>saucebox-gallery.json</Text> — Stores your complete video database, custom tags, downloaded history, and playlist definitions.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Windows Path</Text>: <Text style={styles.code}>%APPDATA%\saucebox\</Text></Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Linux Path</Text>: <Text style={styles.code}>~/.config/saucebox/</Text></Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>macOS Path</Text>: <Text style={styles.code}>~/Library/Application Support/saucebox/</Text></Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🔄</Text>
              <Text style={styles.cardTitle}>Full Reset</Text>
            </View>
            <Text style={styles.paragraph}>
              If something gets corrupted or you want a fresh start, you can do a complete app reset:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>1. Close the application.</Text>
              <Text style={styles.bulletItem}>2. Delete both <Text style={styles.code}>saucebox-settings.json</Text> and <Text style={styles.code}>saucebox-gallery.json</Text> from the application data directory listed above.</Text>
              <Text style={styles.bulletItem}>3. Re-open SauceBox — it will launch instantly in its factory state and generate fresh default databases.</Text>
              <Text style={styles.bulletItem}>• <Text style={styles.highlight}>Note</Text>: Doing this will reset your configurations and empty your in-app lists, but it will NOT delete your downloaded video files from disk.</Text>
            </View>
          </View>
        </View>
      );

    case 'hub':
      return (
        <View>
          <Text style={styles.contentTitle}>SauceBox Hub & Ecosystem</Text>
          <Text style={styles.contentSubtitle}>Access official project links, browse our underlying engines, and fuel future development directly! 🌐</Text>

          {/* Premium Donation / Support Section */}
          <View style={[styles.card, { borderColor: `${theme.colors.primary}40`, borderWidth: 1, backgroundColor: `${theme.colors.primary}05` }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>💖</Text>
              <Text style={styles.cardTitle}>Support CLOUDWERX LAB</Text>
            </View>
            <Text style={[styles.paragraph, { marginBottom: 16 }]}>
              SauceBox is hand-crafted with absolute passion by <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>CLOUDWERX LAB</Text>. We believe that high-performance, private media tools should belong to everyone. We will <Text style={styles.highlight}>never</Text> track your data, restrict features behind paywalls, or lock your vault.
            </Text>
            <Text style={[styles.paragraph, { marginBottom: 24 }]}>
              Every speed optimization, visual trimmer enhancement, and cross-platform compile takes considerable late nights and high-octane caffeine. If SauceBox has upgraded your media experience, consider throwing some fuel in our tank!
            </Text>

            {/* Donation Tiers Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 12, borderWidth: 1, borderColor: `${theme.colors.primary}20`, padding: 16, alignItems: 'center', cursor: 'pointer' }}
                onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>☕</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 }}>Coffee Tier</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 }}>$5</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 14 }}>Keep us sharp & caffeinated.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 12, borderWidth: 1, borderColor: `${theme.colors.primary}20`, padding: 16, alignItems: 'center', cursor: 'pointer' }}
                onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🍺</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 }}>Beer Tier</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 }}>$10</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 14 }}>For those late-night bug hunts.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 12, borderWidth: 1, borderColor: `${theme.colors.primary}20`, padding: 16, alignItems: 'center', cursor: 'pointer' }}
                onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
              >
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🚀</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 }}>Legend Tier</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 6 }}>$25+</Text>
                <Text style={{ fontSize: 11, color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 14 }}>Accelerate features & releases.</Text>
              </TouchableOpacity>
            </View>

            {/* Master Appeal Button */}
            <View style={{ alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 }}>
              <TouchableOpacity 
                style={{ width: '100%', maxWidth: 360, height: 46, borderRadius: 8, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                onPress={() => openExternal('https://buymeacoffee.com/cloudwerxl3')}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#000000' }}>☕ Buy Me A Coffee (Donate)</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: theme.colors.textTertiary, marginTop: 12, textAlign: 'center', lineHeight: 15 }}>
                All support directly enables cross-platform builds, server maintenance, and future features. Thank you! 🙏
              </Text>
            </View>
          </View>

          {/* Official Projects Grid */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
            {/* Card 1: Official App Ecosystem */}
            <View style={[styles.card, { flex: 1, marginBottom: 0 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🌐</Text>
                <Text style={styles.cardTitle}>Official Hubs</Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: 14, lineHeight: 20, marginBottom: 16 }]}>
                Access our official domains to check for the latest releases, download browser extensions, or learn more about CLOUDWERX LAB.
              </Text>
              
              <View style={{ gap: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onPress={() => openExternal('https://saucebox.app')}
                >
                  <View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>saucebox.app</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Official Homepage</Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onPress={() => openExternal('https://cloudwerxlab.com')}
                >
                  <View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>cloudwerxlab.com</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>CLOUDWERX LAB Homepage</Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2: Developer Ecosystem */}
            <View style={[styles.card, { flex: 1, marginBottom: 0 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🐙</Text>
                <Text style={styles.cardTitle}>Source & Community</Text>
              </View>
              <Text style={[styles.paragraph, { fontSize: 14, lineHeight: 20, marginBottom: 16 }]}>
                Browse the source code, check dependencies, report bugs, or star the repository to show your love on GitHub.
              </Text>
              
              <View style={{ gap: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onPress={() => openExternal('https://github.com/CLOUDWERX-DEV/SauceBox')}
                >
                  <View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>GitHub Repository</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>CLOUDWERX-DEV / SauceBox</Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
                  onPress={() => openExternal('https://github.com/CLOUDWERX-DEV')}
                >
                  <View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>GitHub Profile</Text>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>http://github.com/CLOUDWERX-DEV</Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Under the Hood Engines */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Under the Hood (Core Engines)</Text>
            </View>
            <Text style={[styles.paragraph, { marginBottom: 16 }]}>
              SauceBox stands on the shoulders of giants. Our core media downloading pipelines, file processing, and playback rely heavily on these outstanding open-source libraries:
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                onPress={() => openExternal('https://github.com/yt-dlp/yt-dlp')}
              >
                <Text style={{ fontSize: 20 }}>📥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>yt-dlp Engine</Text>
                  <Text style={{ color: '#666', fontSize: 11, marginTop: 1 }}>Robust adult network extractor</Text>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
                onPress={() => openExternal('https://ffmpeg.org')}
              >
                <Text style={{ fontSize: 20 }}>🎞️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>FFmpeg Core</Text>
                  <Text style={{ color: '#666', fontSize: 11, marginTop: 1 }}>Multimedia frame trimmer & streamer</Text>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
}
