import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Search } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { workoutsService, WorkoutTemplate } from '../../services/workouts.service';
import { cacheService } from '../../services/cache.service';
import { WorkoutCardSkeleton } from '../../components/Skeleton';
import { NetworkErrorBanner } from '../../components/NetworkErrorBanner';

const TYPE_COLOR: Record<string, string> = {
  HIIT:      '#DFFF00',
  LISS:      '#30D158',
  FARTLEK:   '#FF9500',
  RECOVERY:  '#64D2FF',
  TEMPO_RUN: '#FF3B30',
  LONG_RUN:  '#BF5AF2',
};

const TYPE_LABEL: Record<string, string> = {
  HIIT:      'HIIT',
  LISS:      'LISS',
  FARTLEK:   'Fartlek',
  RECOVERY:  'Recuperação',
  TEMPO_RUN: 'Tempo Run',
  LONG_RUN:  'Longão',
};

const INTENSITY_LABEL: Record<string, string> = {
  ZONA_1_AQUECIMENTO: 'Suave',
  ZONA_2_AEROBICO:    'Aeróbico',
  ZONA_3_TEMPO:       'Moderado',
  ZONA_4_LIMIAR:      'Forte',
  ZONA_5_VO2MAX:      'Máximo',
};

export default function LibraryScreen() {
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [filtered, setFiltered] = useState<WorkoutTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function fetchWorkouts() {
    try {
      // 1. STALE
      const cached = await cacheService.get<WorkoutTemplate[]>('workouts:all');
      if (cached) {
        setWorkouts(cached);
        setFiltered(cached);
      }

      if (!cached) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(false);
      // 2. REVALIDATE
      const data = await workoutsService.getAll(true);
      setWorkouts(data);
      setFiltered(data);
    } catch (e) {
      if (workouts.length === 0) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchWorkouts(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(workouts);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      workouts.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (TYPE_LABEL[w.scientific_type] ?? w.scientific_type).toLowerCase().includes(q),
      ),
    );
  }, [search, workouts]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <Text style={styles.title}>
            Catálogo de{'\n'}
            <Text style={styles.accent}>Treinos</Text>
          </Text>
          {refreshing && <ActivityIndicator size="small" color={Colors.accent} />}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar treino..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {error && <NetworkErrorBanner onRetry={fetchWorkouts} />}

        {loading ? (
          <View>{[0,1,2,3,4].map(i => <WorkoutCardSkeleton key={i} />)}</View>
        ) : (
          <View style={styles.list}>
            {filtered.length === 0 && (
              <Text style={styles.emptyText}>Nenhum treino encontrado.</Text>
            )}
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/workout-detail', params: { id: String(item.id) } })}
              >
                <GlassCard style={styles.row}>
                  <View style={[styles.indicator, { backgroundColor: TYPE_COLOR[item.scientific_type] ?? Colors.accent }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.workoutTitle}>{item.name}</Text>
                    <Text style={styles.workoutSub}>
                      {TYPE_LABEL[item.scientific_type] ?? item.scientific_type}
                      {' • '}
                      {Math.round(item.expected_duration_secs / 60)} min
                      {' • '}
                      {INTENSITY_LABEL[item.base_intensity] ?? item.base_intensity}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.textMuted} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 20, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, lineHeight: 32 },
  accent: { color: Colors.accent },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  indicator: { width: 4, height: 44, borderRadius: 2 },
  workoutTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  workoutSub: { fontSize: 12, color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
});
