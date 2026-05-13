import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme';

// logo.png lives in public/ which webpack-dev-server serves as static files
// and Electron serves via the file:// protocol from the app root.
// Use a relative path so it works in both dev and production.
const FALLBACK_URI = './logo.png';

/**
 * Renders a video thumbnail.
 * Falls back to the SauceBox logo (centered, padded) if no thumbnail URI
 * is provided or if the image fails to load, so cards never break.
 */
export default function VideoThumbnail({ uri, style }) {
  const [useFallback, setUseFallback] = useState(!uri);

  return (
    <View style={[styles.wrapper, style]}>
      {useFallback ? (
        <View style={[styles.fallback, style]}>
          <Image
            source={{ uri: FALLBACK_URI }}
            style={styles.fallbackImage}
            resizeMode="contain"
          />
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[styles.fill, style]}
          resizeMode="cover"
          onError={() => setUseFallback(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  fallbackImage: {
    width: '55%',
    height: '55%',
    opacity: 0.35,
  },
});
