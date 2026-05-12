import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Flame, MapPin, ChevronRight, Activity } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { sessionsService, SessionSummary } from '../../services/sessions.service';
import { SessionCardSkeleton } from '../../components/Skeleton';
import { NetworkErrorBanner } from '../../components/NetworkErrorBanner';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  COMPLETED:   { label: 'Concluído',   color: '#30D158' },
  ABORTED:     { label: 'Interrompido', color: '#FF9500' },
  IN_PROGRESS: { label: 'Em andamento', color: '#DFFF00' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDurationFromDates(start: string, end: string | null): string {
  if (!end) return '—';
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  return `${m} min`;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function fetchHistory(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const data = await sessionsService.getHistory();
      setSessions(data);
    } catch (e) {
      console.warn('[History] Erro:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarrega sempre que a tela ganhar foco (ex: ao voltar do player)
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

  const totalSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalKm = sessions
    .filter((s) => s.total_distance_meters)
    .reduce((acc, s) => acc + (s.total_distance_meters ?? 0), 0) / 1000;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor={Colors.accent} />}
      >
        <Text style={styles.title}>
          Histórico de{'\n'}
          <Text style={styles.accent}>Treinos</Text>
        </Text>

        {/* Summary Cards */}
        {sessions.length > 0 && (
          <View style={styles.summaryRow}>
            <GlassCard style={styles.summaryCard}>
              <Flame size={20} color={Colors.accent} />
              <Text style={styles.summaryValue}>{totalSessions}</Text>
              <Text style={styles.summaryLabel}>Concluídos</Text>
            </GlassCard>
            <GlassCard style={styles.summaryCard}>
              <MapPin size={20} color={Colors.accent} />
              <Text style={styles.summaryValue}>{totalKm.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>km totais</Text>
            </GlassCard>
          </View>
        )}

        {error && <NetworkErrorBanner onRetry={() => fetchHistory()} />}

        {loading ? (
          <View>{[0,1,2,3].map(i => <SessionCardSkeleton key={i} />)}</View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Activity size={48} color={Colors.accent} opacity={0.8} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum treino ainda</Text>
            <Text style={styles.emptySubtitle}>Complete seu primeiro treino e ele aparecerá aqui com as estatísticas detalhadas.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/library')} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>Explorar Treinos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {sessions.map((session) => {
              const status = STATUS_LABEL[session.status] ?? { label: session.status, color: Colors.textMuted };
              return (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/workout-detail', params: { id: String(session.template.id) } })}
                >
                  <GlassCard style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionName} numberOfLines={1}>{session.template.name}</Text>
                        <Text style={styles.sessionDate}>{formatDate(session.started_at)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { borderColor: status.color }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>

                    <View style={styles.sessionMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={Colors.textMuted} />
                        <Text style={styles.metaText}>
                          {formatDurationFromDates(session.started_at, session.ended_at)}
                        </Text>
                      </View>
                      {session.total_distance_meters && (
                        <View style={styles.metaItem}>
                          <MapPin size={12} color={Colors.textMuted} />
                          <Text style={styles.metaText}>
                            {(session.total_distance_meters / 1000).toFixed(2)} km
                          </Text>
                        </View>
                      )}
                      {session.avg_heart_rate && (
                        <View style={styles.metaItem}>
                          <Text style={styles.metaText}>❤️ {session.avg_heart_rate} bpm</Text>
                        </View>
                      )}
                      {session.total_calories_burned && (
                        <View style={styles.metaItem}>
                          <Flame size={12} color={Colors.textMuted} />
                          <Text style={styles.metaText}>{session.total_calories_burned} kcal</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
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
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, alignItems: 'center', gap: 6 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  list: { gap: 10 },
  sessionCard: { gap: 12 },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sessionName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  sessionDate: { fontSize: 12, color: Colors.textMuted },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  sessionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(223,255,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8, backgroundColor: Colors.accent,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.lg,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
