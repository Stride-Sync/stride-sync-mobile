import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Activity,
  Zap,
  TrendingUp,
  Scale,
  Ruler,
  CalendarDays,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import api from '../services/api';
import { cacheService } from '../services/cache.service';

// Mapeamento dos valores do quiz → campos da API
const GOAL_MAP: Record<string, string> = {
  EMAGRECIMENTO: 'EMAGRECIMENTO',
  CARDIO:        'CARDIO',
  MANUTENCAO:    'MANUTENCAO',
  PREPARACAO:    'PREPARACAO_PROVA',
};

const LEVEL_MAP: Record<string, string> = {
  INICIANTE:     'INICIANTE',
  INTERMEDIARIO: 'INTERMEDIARIO',
  AVANCADO:      'AVANCADO',
  ELITE:         'ELITE',
};

const goals = [
  { id: 'EMAGRECIMENTO', label: 'Emagrecimento',    sub: 'Queima de Gordura',   Icon: Zap },
  { id: 'CARDIO',        label: 'Cardio Geral',     sub: 'Mais Fôlego',         Icon: Activity },
  { id: 'PREPARACAO',    label: 'Preparar Prova',   sub: 'Foco em Performance', Icon: TrendingUp },
  { id: 'MANUTENCAO',    label: 'Manutenção',       sub: 'Ritmo Constante',     Icon: Activity },
];

const levels = [
  { id: 'INICIANTE',     label: 'Iniciante',     sub: 'Começando agora' },
  { id: 'INTERMEDIARIO', label: 'Intermediário', sub: 'Pratico regularmente' },
  { id: 'AVANCADO',      label: 'Avançado',      sub: 'Treino intenso' },
  { id: 'ELITE',         label: 'Elite',         sub: 'Atleta competitivo' },
];

const TOTAL_STEPS = 4;

export default function QuizScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    goal:        'EMAGRECIMENTO',
    level:       'INICIANTE',
    weight:      '75',
    height:      '175',
    weekly_days: 3,
  });

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  async function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    // Último step — envia para a API
    setLoading(true);
    try {
      const payload = {
        fitness_level: LEVEL_MAP[data.level],
        focus_goal:    GOAL_MAP[data.goal],
        weight_kg:     parseFloat(data.weight) || 75,
        height_cm:     parseInt(data.height, 10) || 175,
        weekly_days:   data.weekly_days,
      };
      await api.post('/profile', payload);
      try {
        await cacheService.invalidate('profile');
      } catch (e) {
        console.warn('[Quiz] Falha ao invalidar cache:', e);
      }

      // Tudo certo — vai para a home com perfil salvo
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        // Perfil já existe — apenas redireciona
        router.replace('/(tabs)/home');
        return;
      }
      Alert.alert('Erro', Array.isArray(msg) ? msg[0] : (msg || 'Erro ao salvar perfil.'));
    } finally {
      setLoading(false);
    }
  }

  const renderStep = () => {
    switch (step) {

      // STEP 0 — Objetivo
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                Qual seu <Text style={styles.accent}>Objetivo?</Text>
              </Text>
              <Text style={styles.stepSubtitle}>
                Isso personaliza suas recomendações de treino.
              </Text>
            </View>
            <View style={styles.goalGrid}>
              {goals.map((g) => {
                const active = data.goal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalCard, active && styles.goalCardActive]}
                    onPress={() => setData({ ...data, goal: g.id })}
                    activeOpacity={0.7}
                  >
                    <g.Icon size={32} color={active ? Colors.accent : Colors.textPrimary} />
                    <Text style={[styles.goalLabel, active && { color: Colors.textPrimary }]}>{g.label}</Text>
                    <Text style={styles.goalSub}>{g.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // STEP 1 — Nível Fitness
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                Seu <Text style={styles.accent}>Nível Atual</Text>
              </Text>
              <Text style={styles.stepSubtitle}>
                Seja honesto — isso calibra a intensidade dos treinos.
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              {levels.map((l) => {
                const active = data.level === l.id;
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.levelCard, active && styles.goalCardActive]}
                    onPress={() => setData({ ...data, level: l.id })}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalLabel, active && { color: Colors.textPrimary }]}>{l.label}</Text>
                      <Text style={styles.goalSub}>{l.sub}</Text>
                    </View>
                    {active && (
                      <View style={styles.activeIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // STEP 2 — Dados Físicos
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                Seus <Text style={styles.accent}>Dados Físicos</Text>
              </Text>
              <Text style={styles.stepSubtitle}>
                Usados para estimar calorias e adequar o ritmo.
              </Text>
            </View>
            <View style={{ gap: 24 }}>
              <InputField
                label="PESO CORPORAL (KG)"
                icon={<Scale size={18} color={Colors.accent} />}
                value={data.weight}
                onChangeText={(t) => setData({ ...data, weight: t })}
                keyboardType="numeric"
              />
              <InputField
                label="ALTURA (CM)"
                icon={<Ruler size={18} color={Colors.accent} />}
                value={data.height}
                onChangeText={(t) => setData({ ...data, height: t })}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      // STEP 3 — Lesões + Confirmação
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>
                Quantos dias por semana você <Text style={styles.accent}>quer treinar?</Text>
              </Text>
              <Text style={styles.stepSubtitle}>
                Isso ajuda a calibrar consistência e volume de estímulo.
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              {[
                { value: 2, label: '2 dias', sub: 'Ritmo leve e sustentável' },
                { value: 3, label: '3 dias', sub: 'Equilíbrio ideal' },
                { value: 4, label: '4 dias', sub: 'Evolução rápida com disciplina' },
                { value: 5, label: '5+ dias', sub: 'Alta consistência (com recuperação)' },
              ].map((opt) => {
                const active = data.weekly_days === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.levelCard, active && styles.goalCardActive]}
                    onPress={() => setData({ ...data, weekly_days: opt.value })}
                    activeOpacity={0.7}
                  >
                    <CalendarDays size={24} color={active ? Colors.accent : Colors.textPrimary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.goalLabel, active && { color: Colors.textPrimary }]}>{opt.label}</Text>
                      <Text style={styles.goalSub}>{opt.sub}</Text>
                    </View>
                    {active && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.bottomAction}>
        <Button
          title={step === TOTAL_STEPS - 1 ? 'SALVAR MEU PERFIL' : 'PRÓXIMO PASSO'}
          onPress={handleNext}
          loading={loading}
          icon={!loading ? <ChevronRight size={20} color="#000" /> : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  progressBarContainer: {
    height: 6, backgroundColor: Colors.bgCardSolid,
    borderRadius: 10, marginHorizontal: Spacing.lg, marginTop: Spacing.md, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 10 },
  scroll: { flexGrow: 1, padding: Spacing.lg },
  stepContainer: { gap: Spacing.xl, marginTop: 10 },
  stepHeader: { marginBottom: 8 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  stepSubtitle: { fontSize: 14, color: Colors.textMuted },
  accent: { color: Colors.accent },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  goalCard: {
    width: '47%', backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.xl, padding: 24, alignItems: 'center', gap: 12,
  },
  levelCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.lg, padding: 20, gap: 12,
  },
  goalCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  goalLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  goalSub: { fontSize: 10, color: Colors.textMuted },
  bottomAction: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
});
