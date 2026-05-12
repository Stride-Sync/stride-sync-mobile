import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Play, Clock, Zap, Info, ChevronRight, BatteryFull, BatteryMedium, BatteryLow, Timer } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { workoutsService, WorkoutTemplate } from '../../services/workouts.service';
import { cacheService } from '../../services/cache.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeaturedCardSkeleton } from '../../components/Skeleton';
import { NetworkErrorBanner } from '../../components/NetworkErrorBanner';

import { sessionsService, StatsSummary } from '../../services/sessions.service';

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Sunday to Saturday (since JS getDay() starts at Sunday=0)

const INTENSITY_LABEL: Record<string, string> = {
  ZONA_1_AQUECIMENTO: 'MUITO LEVE',
  ZONA_2_AEROBICO:    'LEVE (CONFORTÁVEL)',
  ZONA_3_TEMPO:       'MODERADO',
  ZONA_4_LIMIAR:      'FORTE',
  ZONA_5_VO2MAX:      'MUITO FORTE',
};

const TYPE_LABEL: Record<string, string> = {
  HIIT:       'TIRO (INTERVALADO)',
  LISS:       'CORRIDA CONTÍNUA',
  FARTLEK:    'JOGO DE RITMO',
  RECOVERY:   'RECUPERAÇÃO ATIVA',
  TEMPO_RUN:  'RITMO CONSTANTE',
  LONG_RUN:   'CORRIDA LONGA',
};

const TIME_OPTIONS = [15, 30, 45, 60, 90];
const READINESS_OPTIONS = [
  { id: 'LOW', label: 'Cansado', Icon: BatteryLow, color: '#FF453A' },
  { id: 'NORMAL', label: 'Normal', Icon: BatteryMedium, color: '#30D158' },
  { id: 'HIGH', label: 'Energizado', Icon: BatteryFull, color: Colors.accent },
];

export default function HomeScreen() {
  const [userName, setUserName] = useState('Atleta');
  const [recommendations, setRecommendations] = useState<WorkoutTemplate[]>([]);
  const [featured, setFeatured] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  
  // Stats
  const [chartHeights, setChartHeights] = useState<number[]>([0,0,0,0,0,0,0]);
  const [hasData, setHasData] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  async function loadData() {
    try {
      // 1. TENTATIVA DE CARGA INSTANTÂNEA (STALE)
      // Buscamos as chaves específicas que o serviço usa
      const [cachedRecs, cachedStats] = await Promise.all([
        cacheService.get<WorkoutTemplate[]>('workouts:recs:any:any'),
        cacheService.get<StatsSummary>('stats:week'),
      ]);

      if (cachedRecs) {
        setRecommendations(cachedRecs.slice(1));
        setFeatured(cachedRecs[0] ?? null);
      }
      if (cachedStats) {
        updateStatsState(cachedStats);
      }

      // Se não temos nada, mostramos loading principal. Se temos, mostramos o refreshing sutil.
      if (!cachedRecs && !cachedStats) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(false);
      const stored = await AsyncStorage.getItem('@stridesync:user_name');
      if (stored) setUserName(stored.split(' ')[0]);

      // 2. REVALIDAÇÃO (REFRESH)
      // Forçamos o refresh nos serviços para pegar dados novos da API
      const [recs, stats] = await Promise.all([
        workoutsService.getRecommendations(undefined, undefined, true),
        sessionsService.getStats('week', true),
      ]);

      setRecommendations(recs.slice(1));
      setFeatured(recs[0] ?? null);
      updateStatsState(stats);

    } catch (e) {
      console.warn('[Home] Erro ao carregar dados:', e);
      // Se já temos dados (mesmo que do cache), não mostramos erro crítico
      if (recommendations.length === 0) {
        setError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function updateStatsState(stats: StatsSummary) {
    const maxDist = Math.max(...stats.chart_data);
    if (maxDist > 0) {
      setHasData(true);
      setChartHeights(stats.chart_data.map((km: number) => (km / maxDist) * 100));
    } else {
      setHasData(false);
      setChartHeights([0,0,0,0,0,0,0]);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      // Carrega dados sempre que focar, mas o cache garante que seja instantâneo
      loadData();

      // Scroll to top when tab is focused
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }, [])
  );

  // Removido o useEffect redundante que chamava loadData no mount

  const durationMin = featured
    ? Math.round(featured.expected_duration_secs / 60)
    : 45;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userName} 👋</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>Visão Geral</Text>
              {refreshing && <ActivityIndicator size="small" color={Colors.accent} />}
            </View>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <User size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {error && (
          <NetworkErrorBanner onRetry={() => { setError(false); }} />
        )}

        {/* Dynamic Card Area (Featured Workout) */}
        {loading ? (
          <FeaturedCardSkeleton />
        ) : (
          <View style={styles.workoutCardContainer}>
            <BlurView intensity={60} tint="dark" style={styles.workoutCard}>
              <Svg style={styles.glowSvg} width={360} height={360}>
                <Defs>
                  <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%"   stopColor="#DFFF00" stopOpacity="0.55" />
                    <Stop offset="40%"  stopColor="#DFFF00" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <SvgCircle cx="180" cy="180" r="180" fill="url(#glow)" />
              </Svg>

              <View style={styles.workoutTop}>
                <Text style={styles.workoutLabel}>RECOMENDADO PARA HOJE</Text>
              </View>

              <Text style={styles.workoutTitle} numberOfLines={2}>
                {featured?.name ?? 'Treino Mágico'}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Clock size={14} color={Colors.accent} />
                  <Text style={styles.badgeText}>{durationMin} MIN</Text>
                </View>
                <View style={styles.badge}>
                  <Zap size={14} color={Colors.accent} />
                  <Text style={styles.badgeText}>
                    {featured ? INTENSITY_LABEL[featured.base_intensity] ?? featured.base_intensity : 'FORTE'}
                  </Text>
                </View>
                {featured && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {TYPE_LABEL[featured.scientific_type] ?? featured.scientific_type}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.btnStart}
                  onPress={() => featured && router.push({ pathname: '/workout-detail', params: { id: String(featured.id) } })}
                  activeOpacity={0.8}
                >
                  <Play size={16} color="#000" fill="#000" />
                  <Text style={styles.btnStartText}>INICIAR TREINO</Text>
                </TouchableOpacity>
                
                {/* Option to recalculate */}
                <TouchableOpacity
                  style={styles.btnAdjust}
                  onPress={() => router.push('/checkin')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnAdjustText}>AJUSTAR</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )}

        {/* Library Banner */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/library')} activeOpacity={0.8}>
          <GlassCard style={styles.libraryBanner}>
            <View style={styles.libraryBannerLeft}>
              <Zap size={24} color={Colors.accent} />
              <View>
                <Text style={styles.libraryBannerTitle}>Explorar Acervo de Treinos</Text>
                <Text style={styles.libraryBannerDesc}>Descubra novos estímulos e rotinas completas</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </GlassCard>
        </TouchableOpacity>

        {/* Weekly Evolution */}
        <TouchableOpacity onPress={() => router.push('/stats')} activeOpacity={0.7}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Evolução Semanal</Text>
            <Text style={styles.sectionLink}>Ver detalhes</Text>
          </View>
          <GlassCard>
            {!hasData ? (
              <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={loading ? Colors.accent : 'transparent'} />
                {!loading && (
                  <>
                    <Zap size={32} color={Colors.glassBorder} />
                    <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 8 }}>Nenhum treino registrado esta semana.</Text>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.chartRow}>
                {weekDays.map((day, i) => {
                  const val = chartHeights[i];
                  const isPeak = val === 100;
                  return (
                    <View key={i} style={styles.chartCol}>
                      {isPeak && <Text style={styles.peakLabel}>PICO</Text>}
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${Math.max(val, 5)}%`, // at least 5% so the bar exists if data > 0 but very small
                            backgroundColor: isPeak ? Colors.accent : 'rgba(255, 255, 255, 0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chartDayLabel,
                            { color: isPeak ? '#000' : Colors.textPrimary },
                            !isPeak && { opacity: 0.6 },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>

        {/* Tip */}
        <View>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Dica do Stridesync</Text>
          <GlassCard style={{ flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' }}>
            <Info size={20} color={Colors.accent} />
            <Text style={styles.tipText}>
              A IA adapta os treinos do dia baseada no seu check-in. Tente manter a honestidade sobre seu cansaço!
            </Text>
          </GlassCard>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 18, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  workoutCardContainer: { borderRadius: Radius.xl, overflow: 'hidden' },
  workoutCard: { padding: 16, backgroundColor: 'rgba(20, 20, 20, 0.4)' },
  glowSvg: { position: 'absolute', top: -180, right: -180 },
  workoutTop: { marginBottom: 12 },
  workoutLabel: { fontSize: 10, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  workoutTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.accent,
    lineHeight: 32, marginBottom: 12, letterSpacing: -0.5,
  },
  
  // Checkin Form UI
  checkinSection: { marginBottom: 20 },
  checkinHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  checkinLabel: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  pillBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.glassBorder,
  },
  pillBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  pillTextActive: { color: '#000', fontWeight: '800' },
  readinessBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
  },
  readinessText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.glassBorder,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: 12 },
  btnStart: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: 14,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnStartText: { fontWeight: '800', fontSize: 13, color: '#000', letterSpacing: 0.5 },
  btnAdjust: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.lg, paddingVertical: 14,
  },
  btnAdjustText: { fontWeight: '700', fontSize: 13, color: Colors.textPrimary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sectionLink: { fontSize: 12, color: Colors.accent },
  libraryBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  libraryBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  libraryBannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  libraryBannerDesc: { fontSize: 11, color: Colors.textMuted },
  chartRow: { flexDirection: 'row', gap: 8, height: 85, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  chartBar: { width: '100%', borderRadius: 4, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  chartDayLabel: { fontSize: 9, fontWeight: '900', color: Colors.textPrimary, opacity: 0.8 },
  peakLabel: { fontSize: 8, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  tipText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
});
