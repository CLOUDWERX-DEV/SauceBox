import React from 'react';
import { View, Text } from 'react-native';
import { downloadStyles as styles } from './DownloadStyles';

export default function HowToUseCard() {
  return (
    <View style={styles.tipsCard}>
      <Text style={styles.tipsTitle}>📖 How to Use SauceBox</Text>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
          <Text style={styles.tip}>Paste any video or playlist URL into the input field above.</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
          <Text style={styles.tip}>Click the 👁️ Preview button to inspect video qualities and select a specific resolution.</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
          <Text style={styles.tip}>Hit 🚀 Download (or press Enter) to fetch the video and automatically extract metadata.</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>4</Text></View>
          <Text style={styles.tip}>Monitor progress in the Queue, or manage concurrent downloads in Settings.</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>5</Text></View>
          <Text style={styles.tip}>Head to the Gallery to play locally, cast to your VR headset, or trim scenes!</Text>
        </View>
        <View style={styles.tipItem}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>🧩</Text></View>
          <Text style={styles.tip}>Use the Chrome Extension to right-click and send videos instantly to SauceBox.</Text>
        </View>
      </View>
    </View>
  );
}
