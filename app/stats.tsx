import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flame,
  MapPin,
  Clock,
  Heart,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { sessionsService, SessionSummary, StatsSummary } from '../services/sessions.service';
import { cacheService } from '../services/cache.service';
import { NetworkErrorBanner } from '../components/NetworkErrorBanner';

const TYPE_LABEL: Record<string, string> = {
  HIIT:      'HIIT',
  LISS:      'LISS',
  FARTLEK:   'Fartlek',
  RECOVERY:  'Recuperação',
  TEMPO_RUN: 'Tempo Run',
  LONG_RUN:  'Longão',
};

const PERIODS = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Geral' },
] as const;

function formatDurationSecs(start: string, end: string | null): number {
  if (!end) return 0;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
}

function secsToMinStr(s: number): string {
  return `${Math.floor(s / 60)} min`;
}

// Componente de barra animada para o gráfico
function AnimatedBar({ value, maxValue, label, isHighlight }: {
  value: number;
  maxValue: number;
  label: string;
  isHighlight: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = maxValue > 0 ? value / maxValue : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700 + Math.random() * 200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  // Garante que pelo menos um pouco da barra aparece (2%) se houver valor
  const minHeight = value > 0 ? 0.02 : 0;
  const outputMax = Math.max(pct, minHeight) * 100;
  
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${outputMax}%`] });

  return (
    <View style={barStyles.col}>
      <Animated.View
        style={[
          barStyles.bar,
          {
            height,
            backgroundColor: isHighlight ? Colors.accent : 'rgba(255,255,255,0.15)',
          },
        ]}
      />
      <Text style={barStyles.label}>{label}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 100 },
  bar: { width: '70%', borderRadius: 4, minHeight: 4 },
  label: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '700' },
});

export default function StatsScreen() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. STALE
        const [cachedHist, cachedSt] = await Promise.all([
          cacheService.get<SessionSummary[]>('sessions:history'),
          cacheService.get<StatsSummary>(`stats:${period}`),
        ]);

        if (cachedHist) setSessions(cachedHist);
        if (cachedSt) setStats(cachedSt);

        if (!cachedHist && !cachedSt) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        
        setError(false);
        // 2. REVALIDATE
        const [hist, st] = await Promise.all([
          sessionsService.getHistory(true),
          sessionsService.getStats(period, true)
        ]);
        setSessions(hist);
        setStats(st);
      } catch (err) {
        console.error('[Stats] Error loading data:', err);
        if (sessions.length === 0) setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    loadData();
  }, [period]);

  // ── Aggregations ──────────────────────────────────────────────
  const completed = sessions.filter((s) => s.status === 'COMPLETED');

  // Melhor sessão (maior distância) histórica
  const bestSession = [...completed].sort(
    (a, b) => (b.total_distance_meters ?? 0) - (a.total_distance_meters ?? 0),
  )[0] ?? null;

  // Breakdown por tipo histórico
  const byType: Record<string, number> = {};
  completed.forEach((s) => {
    const t = s.template?.scientific_type ?? 'OUTROS';
    byType[t] = (byType[t] ?? 0) + 1;
  });
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const weekDayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Graph is always day distribution

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Minha Evolução</Text>
          {refreshing && <ActivityIndicator size="small" color={Colors.accent} style={{ marginLeft: 8 }} />}
        </View>

        {/* Period Filters */}
        <View style={styles.filterRow}>
          {PERIODS.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.filterPill, period === p.id && styles.filterPillActive]}
              onPress={() => setPeriod(p.id)}
            >
              <Text style={[styles.filterPillText, period === p.id && styles.filterPillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <NetworkErrorBanner onRetry={() => setPeriod(period)} />}

        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : !stats || stats.total_distance_km === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <TrendingUp size={32} color={Colors.accent} />
            <Text style={styles.emptyTitle}>Sem dados no período</Text>
            <Text style={styles.emptySubtitle}>
              Você não possui treinos finalizados neste período selecionado.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/library')}>
              <Text style={styles.emptyBtnText}>Explorar Treinos</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <>
            {/* Totais */}
            <View style={styles.grid}>
              <StatCard icon={<MapPin size={18} color={Colors.accent} />} label="KM Totais"      value={stats.total_distance_km.toFixed(1)} unit="km"  />
              <StatCard icon={<Clock size={18} color={Colors.accent} />}   label="Tempo Total"   value={secsToMinStr(stats.total_time_secs)} unit="" />
              <StatCard icon={<Flame size={18} color={Colors.accent} />}   label="Cal. Totais"   value={String(stats.total_calories)}    unit="kcal" />
              <StatCard icon={<TrendingUp size={18} color={Colors.accent} />} label="Pace Médio" value={stats.avg_pace_min_km.toFixed(2)} unit="min/km" />
            </View>

            {/* Gráfico de Distância por Dia da Semana */}
            <GlassCard style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>Volume por Dia</Text>
              <Text style={styles.sectionSub}>Soma de distância ao longo dos dias (km)</Text>
              <View style={styles.chartContainer}>
                {stats.chart_data.map((km, i) => (
                  <AnimatedBar
                    key={i}
                    value={km}
                    maxValue={Math.max(...stats.chart_data, 1)}
                    label={weekDayLabels[i]}
                    isHighlight={km > 0 && km === Math.max(...stats.chart_data)}
                  />
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Dia com maior volume de corrida</Text>
              </View>
            </GlassCard>

            {/* Melhor Sessão */}
            {bestSession && (
              <GlassCard style={{ gap: 12 }}>
                <View style={styles.sectionHeaderRow}>
                  <Award size={18} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Melhor Sessão</Text>
                </View>
                <Text style={styles.bestName} numberOfLines={1}>
                  {bestSession.template?.name ?? 'Sessão'}
                </Text>
                <View style={styles.bestMeta}>
                  {bestSession.total_distance_meters ? (
                    <Text style={styles.bestMetaItem}>
                      📍 {(bestSession.total_distance_meters / 1000).toFixed(2)} km
                    </Text>
                  ) : null}
                  {bestSession.avg_heart_rate ? (
                    <Text style={styles.bestMetaItem}>
                      ❤️ {bestSession.avg_heart_rate} bpm média
                    </Text>
                  ) : null}
                  {bestSession.total_calories_burned ? (
                    <Text style={styles.bestMetaItem}>
                      🔥 {bestSession.total_calories_burned} kcal
                    </Text>
                  ) : null}
                  <Text style={styles.bestMetaItem}>
                    🗓️{' '}
                    {new Date(bestSession.started_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </GlassCard>
            )}

            {/* Tipos de treino */}
            {topTypes.length > 0 && (
              <GlassCard style={{ gap: 12 }}>
                <Text style={styles.sectionTitle}>Treinos por Tipo</Text>
                {topTypes.map(([type, count]) => {
                  const pct = completed.length > 0 ? count / completed.length : 0;
                  return (
                    <View key={type} style={styles.typeRow}>
                      <Text style={styles.typeLabel}>{TYPE_LABEL[type] ?? type}</Text>
                      <View style={styles.typeBarBg}>
                        <View style={[styles.typeBarFill, { width: `${pct * 100}%` }]} />
                      </View>
                      <Text style={styles.typeCount}>{count}×</Text>
                    </View>
                  );
                })}
              </GlassCard>
            )}

            {/* Resumo numérico */}
            <GlassCard style={{ alignItems: 'center', gap: 4 }}>
              <Text style={styles.totalCount}>{completed.length}</Text>
              <Text style={styles.totalLabel}>treinos concluídos no total</Text>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, unit }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <GlassCard style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  statUnit: { fontSize: 11, color: Colors.accent, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textAlign: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.lg, backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  filterPillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterPillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterPillTextActive: { color: '#000', fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sectionSub: { fontSize: 12, color: Colors.textMuted, marginTop: -8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartContainer: { flexDirection: 'row', height: 100, gap: 6, alignItems: 'flex-end' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  legendText: { fontSize: 11, color: Colors.textMuted },
  bestName: { fontSize: 18, fontWeight: '700', color: Colors.accent },
  bestMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bestMetaItem: { fontSize: 13, color: Colors.textSecondary },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeLabel: { width: 80, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  typeBarBg: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  typeBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  typeCount: { fontSize: 12, color: Colors.textMuted, width: 24, textAlign: 'right' },
  totalCount: { fontSize: 48, fontWeight: '800', color: Colors.accent },
  totalLabel: { fontSize: 14, color: Colors.textMuted },
  emptyCard: { alignItems: 'center', gap: 12, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
