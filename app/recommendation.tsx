import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Award, Clock } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';

export default function RecommendationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <CheckCircle
            size={80}
            color={Colors.accent}
            style={styles.heroIcon}
          />
          <Text style={styles.heroTitle}>
            Seu Plano Ideal{'\n'}para{' '}
            <Text style={styles.accent}>Endurance</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Treino gerado para seu peso (75kg) e tempo disponível (45min).
          </Text>

          <View style={styles.heroMeta}>
            <Text style={styles.accent}>TREINO DE RITMOS</Text>
            <Text style={styles.heroBpm}>
              Batimentos do Coração Alvo: 142 - 158 BPM
            </Text>
          </View>
        </View>

        {/* Expected Results */}
        <View style={{ gap: 16 }}>
          <Text style={styles.sectionTitle}>Resultados Esperados</Text>

          <GlassCard style={styles.resultRow}>
            <Award size={24} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>Melhora no Fôlego: +1.2</Text>
              <Text style={styles.resultSub}>
                Previsão para o primeiro mês
              </Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.resultRow}>
            <Clock size={24} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>3x por Semana</Text>
              <Text style={styles.resultSub}>
                Ritmo sugerido pela nossa IA
              </Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ marginTop: 'auto' }}>
          <Button
            title="Iniciar Meus Treinos"
            onPress={() => router.replace('/(tabs)/home')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    gap: 24,
  },
  accent: {
    color: Colors.accent,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  heroIcon: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 40,
  },
  heroDesc: {
    color: Colors.textPrimary,
    opacity: 0.9,
    fontSize: 15,
  },
  heroMeta: {
    marginTop: 24,
    gap: 8,
  },
  heroBpm: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resultTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  resultSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
