import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, BatteryFull, BatteryMedium, BatteryLow, Timer, ChevronLeft } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { workoutsService } from '../services/workouts.service';
import { NetworkErrorBanner } from '../components/NetworkErrorBanner';

const TIME_OPTIONS = [15, 30, 45, 60, 90];
const READINESS_OPTIONS = [
  { id: 'LOW', label: 'Cansado', Icon: BatteryLow, color: '#FF453A' },
  { id: 'NORMAL', label: 'Normal', Icon: BatteryMedium, color: '#30D158' },
  { id: 'HIGH', label: 'Energizado', Icon: BatteryFull, color: Colors.accent },
];

export default function CheckinScreen() {
  const [selectedTime, setSelectedTime] = useState<number>(30);
  const [selectedReadiness, setSelectedReadiness] = useState<string>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleAdjustWorkout() {
    setLoading(true);
    setError(false);
    try {
      const recs = await workoutsService.getRecommendations(selectedTime, selectedReadiness);
      const featured = recs[0];
      if (featured) {
        // Redireciona diretamente para o preview do treino
        router.replace({ pathname: '/workout-detail', params: { id: String(featured.id) } });
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (e) {
      console.warn('[Checkin] Erro ao buscar recomendações:', e);
      setError(true);
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustar Treino</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {error && <NetworkErrorBanner onRetry={() => setError(false)} />}

        <View style={styles.content}>
          <Text style={styles.title}>Como você está se sentindo hoje?</Text>
          <Text style={styles.subtitle}>
            A IA usará essas informações para modificar a estrutura e o tipo do seu treino diário.
          </Text>

          {/* Time Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Timer size={18} color={Colors.textMuted} />
              <Text style={styles.sectionLabel}>TEMPO DISPONÍVEL</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              contentContainerStyle={{ gap: 8, paddingRight: 24, paddingBottom: 8 }}
            >
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pillBtn, selectedTime === t && styles.pillBtnActive]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>
                    {t} min
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Readiness Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Zap size={18} color={Colors.textMuted} />
              <Text style={styles.sectionLabel}>NÍVEL DE ENERGIA</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {READINESS_OPTIONS.map((r) => {
                const active = selectedReadiness === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.readinessBtn, active && { borderColor: r.color, backgroundColor: `${r.color}15` }]}
                    onPress={() => setSelectedReadiness(r.id)}
                  >
                    <r.Icon size={24} color={active ? r.color : Colors.textMuted} />
                    <Text style={[styles.readinessText, active && { color: r.color }]}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnStart, loading && { opacity: 0.7 }]}
          onPress={handleAdjustWorkout}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Zap size={20} color="#000" fill="#000" />
              <Text style={styles.btnStartText}>AJUSTAR TREINO</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  header: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, 
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  container: { padding: Spacing.lg, gap: 24, paddingBottom: 40 },
  content: { gap: 32, marginTop: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.accent, lineHeight: 34, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginTop: -20 },
  
  section: { gap: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  
  pillBtn: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 100,
    backgroundColor: Colors.bgCardSolid, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  pillBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  pillTextActive: { color: '#000', fontWeight: '800' },
  
  readinessBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 8,
    backgroundColor: Colors.bgCardSolid, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
  },
  readinessText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 24,
    backgroundColor: Colors.bgDeep,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  btnStart: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: 16,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnStartText: { fontWeight: '800', fontSize: 15, color: '#000', letterSpacing: 0.5 },
});
