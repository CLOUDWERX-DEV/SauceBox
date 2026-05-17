import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <View 
      style={styles.container}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <View style={[styles.tooltip, styles[position]]}>
          <Text style={styles.tooltipText}>{content}</Text>
          <View style={[styles.arrow, styles[`arrow_${position}`]]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#111111',
    borderColor: `${theme.colors.primary}40`,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 1000,
    pointerEvents: 'none',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    // Align self centers the absolutely positioned box horizontally relative to parent
    alignSelf: 'center',
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    // Prevent wrapping for standard short tooltips
    whiteSpace: 'nowrap',
  },
  arrow: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#111111',
    borderColor: `${theme.colors.primary}40`,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  top: {
    bottom: '135%',
  },
  arrow_top: {
    bottom: -4,
    alignSelf: 'center',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  bottom: {
    top: '135%',
  },
  arrow_bottom: {
    top: -4,
    alignSelf: 'center',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  }
});
