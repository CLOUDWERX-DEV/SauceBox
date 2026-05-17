import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { theme } from '../theme';

export default function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  confirmColor = theme.colors.error,
  // Optional checkbox
  checkboxLabel = null,
  checkboxValue = false,
  onCheckboxChange = null,
  // Optional text input confirmation
  requireInputText = null,
}) {
  const [inputText, setInputText] = React.useState('');

  React.useEffect(() => {
    if (visible) setInputText('');
  }, [visible]);

  if (!visible) return null;

  const isConfirmDisabled = requireInputText ? inputText !== requireInputText : false;

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {checkboxLabel && (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => onCheckboxChange && onCheckboxChange(!checkboxValue)}
            >
              <View style={[styles.checkbox, checkboxValue && styles.checkboxChecked]}>
                {checkboxValue && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{checkboxLabel}</Text>
            </TouchableOpacity>
          )}

          {requireInputText && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrompt}>
                Type <Text style={styles.requireMatchText}>"{requireInputText}"</Text> to confirm:
              </Text>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={requireInputText}
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton, 
                { backgroundColor: confirmColor },
                isConfirmDisabled && { opacity: 0.5 }
              ]}
              onPress={onConfirm}
              disabled={isConfirmDisabled}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: 420,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    cursor: 'pointer',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  checkmark: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputPrompt: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  requireMatchText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.text,
    fontSize: 14,
  }
});
