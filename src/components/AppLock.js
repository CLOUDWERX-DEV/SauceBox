import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../store';
import { theme } from '../theme';

export default function AppLock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const correctPin = useStore(state => state.settings.vaultPin);

  const handlePress = (num) => {
    if (error) setError(false);
    if (pin.length >= 4) return;
    
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length === 4) {
      if (newPin === correctPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, error, correctPin]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Vault Locked</Text>
      <Text style={styles.subtitle}>Enter your 4-digit PIN to access SauceBox</Text>
      
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map(i => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              pin.length > i && styles.dotActive,
              error && styles.dotError
            ]} 
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <TouchableOpacity key={num} style={styles.key} onPress={() => handlePress(num.toString())}>
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.keyEmpty} />
        <TouchableOpacity style={styles.key} onPress={() => handlePress('0')}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dotError: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  keypad: {
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: '600',
  }
});
