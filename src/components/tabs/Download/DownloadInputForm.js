import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { downloadStyles as styles } from './DownloadStyles';

const funnyPlaceholders = [
  "Paste that spicy link here... 🌶️",
  "Drop the URL like it's hot 🔥",
  "Your secret's safe with us 🤫",
  "Time to expand the collection 📚",
  "What are we downloading today? 😏",
  "Another one for the vault 🔐",
  "Building that library 📖",
  "Quality content incoming 💎"
];

export default function DownloadInputForm({ url, setUrl, loading, loadingMsg, handlePreview, handleDownload }) {
  const randomPlaceholder = useMemo(() => {
    return funnyPlaceholders[Math.floor(Math.random() * funnyPlaceholders.length)];
  }, []);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>📎 Video URL</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={randomPlaceholder}
          placeholderTextColor="#555"
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={() => handleDownload()}
        />
        <TouchableOpacity
          style={[styles.previewButton, loading && styles.downloadButtonDisabled]}
          onPress={handlePreview}
          disabled={loading}
        >
          <Text style={styles.previewButtonText}>
            {loading ? '⏳' : '👁️'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.downloadButton, loading && styles.downloadButtonDisabled]}
          onPress={() => handleDownload()}
          disabled={loading}
        >
          <Text style={styles.downloadButtonText}>
            {loading ? (loadingMsg || '⏳ Fetching...') : '🚀 Download'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.inputHint}>
        Supports most major video platforms & playlists • Press Enter to download • Use Preview to inspect video info and choose download quality
      </Text>
    </View>
  );
}
