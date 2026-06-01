import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing } from '../constants/Theme';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
  loading?: boolean;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

export function CustomAlert({ visible, title, message, buttons, onClose }: CustomAlertProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  disabled={btn.loading}
                  style={[
                    styles.button,
                    isCancel ? styles.buttonCancel : styles.buttonDefault,
                    isDestructive && styles.buttonDestructive
                  ]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    else onClose();
                  }}
                >
                  {btn.loading ? (
                    <ActivityIndicator color={isCancel ? Colors.textPrimary : '#000'} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel ? styles.textCancel : styles.textDefault,
                        isDestructive && styles.textDestructive
                      ]}
                    >
                      {btn.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.bgCardSolid,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonDefault: {
    backgroundColor: Colors.accent,
  },
  buttonDestructive: {
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  buttonText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  textCancel: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  textDefault: {
    color: '#000',
    fontWeight: '800',
  },
  textDestructive: {
    color: Colors.danger,
    fontWeight: '800',
  },
});
