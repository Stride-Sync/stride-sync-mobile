import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/Theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function InputField({ label, icon, containerStyle, style, ...props }: InputFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {(label || icon) && (
        <View style={styles.labelRow}>
          {icon}
          {label && <Text style={styles.label}>{label}</Text>}
        </View>
      )}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 16,
  },
});
