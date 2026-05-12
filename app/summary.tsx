import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Clock, MapPin, Flame, Heart, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { sessionsService, SessionSummary } from '../services/sessions.service';

export default function SummaryScreen() {
  const { sessionId, elapsed } = useLocalSearchParams<{ sessionId: string; elapsed: string }>();
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    // Busca os dados finais da sessão (já com métricas agregadas)
    sessionsService.getSession(Number(sessionId))
      .then(setSession)
      .catch((e) => console.warn('[Summary] Erro ao buscar sessão:', e))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const elapsedSecs = parseInt(elapsed ?? '0', 10);
  const elapsedMin = Math.floor(elapsedSecs / 60);

  const metrics = [
    {
      icon: <Clock size={20} color={Colors.accent} />,
      label: 'Duração',
      value: session?.ended_at
        ? `${Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)} min`
        : `${elapsedMin} min`,
    },
    {
      icon: <MapPin size={20} color={Colors.accent} />,
      label: 'Distância',
      value: session?.total_distance_meters
        ? `${(session.total_distance_meters / 1000).toFixed(2)} km`
        : '— km',
    },
    {
      icon: <Heart size={20} color={Colors.accent} />,
      label: 'FC Média',
      value: session?.avg_heart_rate ? `${session.avg_heart_rate} bpm` : '— bpm',
    },
    {
      icon: <Flame size={20} color={Colors.accent} />,
      label: 'Calorias',
      value: session?.total_calories_burned ? `${session.total_calories_burned} kcal` : '— kcal',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <CheckCircle size={56} color={Colors.accent} />
          <Text style={styles.title}>Treino Concluído!</Text>
          <Text style={styles.subtitle}>
            {session?.template?.name ?? 'Sessão finalizada com sucesso.'}
          </Text>
        </View>

        {/* Metrics Grid */}
        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.grid}>
            {metrics.map((m, i) => (
              <GlassCard key={i} style={styles.metricCard}>
                {m.icon}
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Pace Médio Destaque */}
        <GlassCard style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>PACE MÉDIO DO TRAJETO</Text>
          <Text style={styles.highlightValue}>
            {session?.avg_pace 
              ? `${Math.floor(session.avg_pace)}:${String(Math.round((session.avg_pace - Math.floor(session.avg_pace)) * 60)).padStart(2, '0')}`
              : '--:--'}
            <Text style={styles.highlightUnit}> min/km</Text>
          </Text>
        </GlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Voltar ao Início</Text>
            <ChevronRight size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/history')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Ver Histórico</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 24, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 12, marginTop: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    width: '47%', alignItems: 'center', gap: 8,
  },
  metricValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  highlightCard: { alignItems: 'center', gap: 6 },
  highlightLabel: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  highlightValue: { fontSize: 40, fontWeight: '800', color: Colors.accent },
  highlightUnit: { fontSize: 20, color: Colors.textMuted },
  actions: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: 18,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  secondaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.lg, paddingVertical: 18,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
});
