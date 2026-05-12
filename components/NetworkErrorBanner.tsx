import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { Colors } from '../constants/Theme';

interface NetworkErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function NetworkErrorBanner({
  message = 'Sem conexão com o servidor',
  onRetry,
}: NetworkErrorBannerProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <WifiOff size={16} color="#FF3B30" />
      <Text style={styles.text} numberOfLines={1}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.7}>
          <RefreshCw size={14} color={Colors.accent} />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
});
