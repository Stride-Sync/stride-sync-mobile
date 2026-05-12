import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius } from '../constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
  textStyle,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#000' : Colors.textPrimary} />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              isPrimary && styles.textPrimary,
              isDanger && styles.textDanger,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  secondary: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  danger: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textPrimary: {
    color: '#000',
  },
  textDanger: {
    color: Colors.danger,
  },
});
