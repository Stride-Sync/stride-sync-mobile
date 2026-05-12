import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const distanceOptions = ['Quilômetros (km)', 'Milhas (mi)'];
const weightOptions = ['Quilogramas (kg)', 'Libras (lb)'];
const paceOptions = ['min/km', 'min/mi'];

export default function UnitsScreen() {
  const [distance, setDistance] = useState('Quilômetros (km)');
  const [weight, setWeight] = useState('Quilogramas (kg)');
  const [pace, setPace] = useState('min/km');

  useEffect(() => {
    async function loadUnits() {
      try {
        const storedDistance = await AsyncStorage.getItem('@stridesync:unit_distance');
        const storedWeight = await AsyncStorage.getItem('@stridesync:unit_weight');
        const storedPace = await AsyncStorage.getItem('@stridesync:unit_pace');
        if (storedDistance) setDistance(storedDistance);
        if (storedWeight) setWeight(storedWeight);
        if (storedPace) setPace(storedPace);
      } catch (e) {
        console.warn('Erro ao carregar unidades', e);
      }
    }
    loadUnits();
  }, []);

  const handleSelect = async (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(`@stridesync:unit_${key}`, value);
    } catch (e) {
      console.warn('Erro ao salvar unidade', e);
    }
  };

  const renderOptions = (
    options: string[],
    selected: string,
    onSelect: (v: string) => void
  ) => (
    <GlassCard noPadding>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.optionRow,
            i === options.length - 1 && { borderBottomWidth: 0 },
          ]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.optionText,
              selected === opt && { color: Colors.accent },
            ]}
          >
            {opt}
          </Text>
          {selected === opt && <Check size={18} color={Colors.accent} />}
        </TouchableOpacity>
      ))}
    </GlassCard>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Unidades de Medida</Text>
        </View>

        <Text style={styles.sectionLabel}>DISTÂNCIA</Text>
        {renderOptions(distanceOptions, distance, (v) => handleSelect('distance', v, setDistance))}

        <Text style={styles.sectionLabel}>PESO CORPORAL</Text>
        {renderOptions(weightOptions, weight, (v) => handleSelect('weight', v, setWeight))}

        <Text style={styles.sectionLabel}>RITMO (PACE)</Text>
        {renderOptions(paceOptions, pace, (v) => handleSelect('pace', v, setPace))}
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
    padding: Spacing.lg,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});
