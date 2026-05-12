import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Clock, Zap, Heart, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { workoutsService, WorkoutTemplate, WorkoutStep } from '../services/workouts.service';
import { sessionsService } from '../services/sessions.service';

const STEP_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  AQUECIMENTO:      { label: 'Aquecimento',     color: '#FF9500' },
  ESFORCO:          { label: 'Esforço',          color: '#DFFF00' },
  DESCANSO_ATIVO:   { label: 'Descanso Ativo',   color: '#30D158' },
  DESCANSO_PASSIVO: { label: 'Descanso Passivo', color: '#64D2FF' },
  RESFRIAMENTO:     { label: 'Resfriamento',     color: '#BF5AF2' },
};

const INTENSITY_LABEL: Record<string, string> = {
  ZONA_1_AQUECIMENTO: 'Muito Leve',
  ZONA_2_AEROBICO:    'Leve (Confortável)',
  ZONA_3_TEMPO:       'Moderado',
  ZONA_4_LIMIAR:      'Forte',
  ZONA_5_VO2MAX:      'Muito Forte',
};

const TYPE_LABEL: Record<string, string> = {
  HIIT:       'Tiro (Intervalado)',
  LISS:       'Corrida Contínua',
  FARTLEK:    'Jogo de Ritmo',
  RECOVERY:   'Recuperação Ativa',
  TEMPO_RUN:  'Ritmo Constante',
  LONG_RUN:   'Corrida Longa',
};

import { formatDuration } from '../utils/time';


export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    workoutsService.getById(Number(id))
      .then(setWorkout)
      .catch((e) => console.warn('[WorkoutDetail] Erro:', e))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStart() {
    if (!workout) return;
    setStarting(true);
    try {
      const session = await sessionsService.startSession(workout.id);
      // Passa o sessionId para o player
      router.push({
        pathname: '/player',
        params: {
          sessionId:   session.id,
          workoutName: workout.name,
          stepsJson:   JSON.stringify(workout.steps),
        },
      });
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Erro ao iniciar sessão.';
      console.error('[WorkoutDetail] Erro ao iniciar:', msg);
    } finally {
      setStarting(false);
    }
  }

  const totalSteps = workout?.steps.length ?? 0;
  const durationMin = workout ? Math.round(workout.expected_duration_secs / 60) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 80 }} />
        ) : !workout ? (
          <Text style={styles.errorText}>Treino não encontrado.</Text>
        ) : (
          <>
            {/* Hero Card */}
            <View style={styles.heroContainer}>
              <BlurView intensity={60} tint="dark" style={styles.heroCard}>
                <Svg style={styles.glowSvg} width={300} height={300}>
                  <Defs>
                    <RadialGradient id="glow2" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%"   stopColor="#DFFF00" stopOpacity="0.5" />
                      <Stop offset="100%" stopColor="#DFFF00" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <SvgCircle cx="150" cy="150" r="150" fill="url(#glow2)" />
                </Svg>

                <Text style={styles.workoutType}>
                  {TYPE_LABEL[workout.scientific_type] ?? workout.scientific_type} • {INTENSITY_LABEL[workout.base_intensity] ?? workout.base_intensity}
                </Text>
                <Text style={styles.workoutName}>{workout.name}</Text>
                {workout.description && (
                  <Text style={styles.workoutDesc}>{workout.description}</Text>
                )}

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Clock size={16} color={Colors.accent} />
                    <Text style={styles.statValue}>{durationMin} min</Text>
                    <Text style={styles.statLabel}>Duração</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <ChevronRight size={16} color={Colors.accent} />
                    <Text style={styles.statValue}>{totalSteps}</Text>
                    <Text style={styles.statLabel}>Etapas</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Zap size={16} color={Colors.accent} />
                    <Text style={styles.statValue}>
                      {INTENSITY_LABEL[workout.base_intensity]?.split(' ')[0] ?? '—'}
                    </Text>
                    <Text style={styles.statLabel}>Intensidade</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Steps */}
            <View>
              <Text style={styles.sectionTitle}>Sequência de Etapas</Text>
              {workout.steps.map((step, idx) => (
                <StepCard key={step.id} step={step} index={idx} />
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.startBtn, starting && { opacity: 0.7 }]}
              onPress={handleStart}
              disabled={starting}
              activeOpacity={0.8}
            >
              {starting
                ? <ActivityIndicator color="#000" />
                : <><Play size={18} color="#000" fill="#000" /><Text style={styles.startBtnText}>INICIAR TREINO</Text></>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepCard({ step, index }: { step: WorkoutStep; index: number }) {
  const typeInfo = STEP_TYPE_LABEL[step.type] ?? { label: step.type, color: Colors.accent };
  return (
    <GlassCard style={styles.stepCard}>
      <View style={[styles.stepIndicator, { backgroundColor: typeInfo.color }]}>
        <Text style={styles.stepNumber}>{index + 1}</Text>
      </View>
      <View style={styles.stepInfo}>
        <Text style={styles.stepType}>{typeInfo.label}</Text>
        <Text style={styles.stepDuration}>{formatDuration(step.duration_seconds)}</Text>
        {(step.target_heart_rate_low || step.target_heart_rate_high) && (
          <View style={styles.stepBpm}>
            <Heart size={11} color={Colors.textMuted} />
            <Text style={styles.stepBpmText}>
              {step.target_heart_rate_low ?? '—'}–{step.target_heart_rate_high ?? '—'} bpm
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 20, paddingBottom: 40 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  heroContainer: { borderRadius: Radius.xl, overflow: 'hidden' },
  heroCard: { padding: Spacing.lg, backgroundColor: 'rgba(20,20,20,0.4)' },
  glowSvg: { position: 'absolute', top: -80, right: -80 },
  workoutType: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  workoutName: { fontSize: 28, fontWeight: '800', color: Colors.accent, lineHeight: 34, marginBottom: 10 },
  workoutDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.glassBorder },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  stepIndicator: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: 13, fontWeight: '900', color: '#000' },
  stepInfo: { flex: 1, gap: 3 },
  stepType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  stepDuration: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  stepBpm: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBpmText: { fontSize: 11, color: Colors.textMuted },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: 18,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, marginTop: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  errorText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginTop: 80 },
});
