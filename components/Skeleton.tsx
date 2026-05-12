import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        styles.base,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Skeleton pré-montado para card de treino na lista
export function WorkoutCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardIndicator} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={11} width="50%" />
      </View>
    </View>
  );
}

// Skeleton para o card principal da Home
export function FeaturedCardSkeleton() {
  return (
    <View style={styles.featured}>
      <Skeleton height={12} width="40%" />
      <Skeleton height={32} width="80%" style={{ marginTop: 12 }} />
      <Skeleton height={32} width="60%" />
      <View style={styles.badgeRow}>
        <Skeleton height={28} width={80} borderRadius={8} />
        <Skeleton height={28} width={100} borderRadius={8} />
      </View>
      <Skeleton height={48} borderRadius={14} style={{ marginTop: 8 }} />
    </View>
  );
}

// Skeleton para item de sessão no histórico
export function SessionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton height={14} width="65%" />
        <Skeleton height={11} width="35%" />
        <View style={styles.metaRow}>
          <Skeleton height={10} width={60} />
          <Skeleton height={10} width={60} />
        </View>
      </View>
      <Skeleton height={22} width={70} borderRadius={6} />
    </View>
  );
}

// Skeleton para o grid de perfil
export function ProfileGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.gridItem}>
          <Skeleton height={12} width={60} />
          <Skeleton height={16} width="80%" style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.glassBorder,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  cardIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: Colors.glassBorder,
  },
  featured: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 20,
    padding: 20,
    gap: 4,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
  },
});
