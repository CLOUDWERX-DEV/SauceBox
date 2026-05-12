import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../theme';

export default function HelpModal({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>LocalFap Help & Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📥 How to Download</Text>
              <Text style={styles.paragraph}>
                Paste a link from your favorite tube site into the top bar on the Download page. You can paste a single video URL or a full playlist. Once loaded, click "Start Download" (or use Auto-Download in Settings) to add it to your Queue.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold', color: theme.colors.primary}}>Pro Tip: </Text>
                Use the included Chrome Extension to right-click any video and hit "Send to LocalFap" to skip copy-pasting entirely.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎥 Importing Local Videos</Text>
              <Text style={styles.paragraph}>
                Have an existing collection? Go to the Gallery and click "Import Videos". You can select individual videos or a whole folder. LocalFap will automatically generate thumbnails and scrape resolutions/sizes for you. 
              </Text>
              <Text style={styles.paragraph}>
                When importing folders, you can choose "Auto-detect" to let the app do all the work, or "Wizard" to set custom titles and tags for every file.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥷 Stealth & Privacy Options</Text>
              <Text style={styles.paragraph}>
                Privacy is our priority. Enable "Vault Mode" in Settings to require a 4-digit PIN every time the app opens.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold', color: theme.colors.primary}}>Panic Button: </Text>
                Press <Text style={styles.code}>Ctrl+Shift+H</Text> (or Cmd+Shift+H on Mac) anywhere on your computer to instantly hide the app, pause all downloads, and mute audio. You can customize what the Panic Button does in Settings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏷️ Organization & Tags</Text>
              <Text style={styles.paragraph}>
                Keep your stash organized! LocalFap automatically tags videos based on their source domain. You can add your own tags (like "Favorites", "Cinematic") by clicking the Edit button on any Gallery card.
              </Text>
              <Text style={styles.paragraph}>
                The Gallery features a smart filter bar at the top where you can instantly filter by any combination of Tags, Ratings, Resolutions, and search terms.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✂️ Highlight Clipper</Text>
              <Text style={styles.paragraph}>
                Watching a 2-hour movie and only want to keep a 5-minute scene? Click the "Clip" icon in the video player, set your start and end times, and LocalFap will instantly save the highlight without quality loss or re-encoding.
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚙️ Advanced Configuration</Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold'}}>Concurrent Downloads: </Text> Limit how many videos download at once to save bandwidth. Set to 0 for unlimited.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold'}}>Proxies: </Text> Set an HTTP/SOCKS5 proxy in Settings if you need to bypass ISP blocks.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{fontWeight: 'bold'}}>Storage Protection: </Text> The app automatically pauses downloads if your drive falls below a minimum free space limit (5GB default).
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
              <Text style={styles.saveButtonText}>Got it, Boss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    width: 600,
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    color: theme.colors.textSecondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.surfaceLight,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  }
});
