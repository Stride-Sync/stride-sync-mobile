import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, Lock, Eye } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersService } from '../services/users.service';

export default function SecurityScreen() {
  const [dataSharing, setDataSharing] = useState(false);
  const [locationTracking, setLocationTracking] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const user = await usersService.getMe();
        
        const d = await AsyncStorage.getItem('@stridesync:sec_datasharing');
        const l = await AsyncStorage.getItem('@stridesync:sec_location');
        if (d !== null) setDataSharing(d === 'true');
        if (l !== null) setLocationTracking(l === 'true');
      } catch (e) {
        console.warn('Erro ao carregar configurações de segurança', e);
      }
    }
    loadSettings();
  }, []);

  const toggleSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(`@stridesync:sec_${key}`, String(value));
    } catch (e) {
      console.warn('Erro ao salvar config', e);
    }
  };

  const handleEraseData = () => {
    Alert.alert(
      'Apagar Todos os Dados',
      'Tem certeza que deseja apagar todo o seu histórico de treinos? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Apagar', 
          style: 'destructive',
          onPress: async () => {
            // Placeholder: log out and clear storage
            await AsyncStorage.clear();
            router.replace('/login');
          }
        }
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Segurança e Privacidade</Text>
        </View>

        <GlassCard style={styles.infoCard}>
          <Shield size={24} color={Colors.accent} />
          <Text style={styles.infoText}>
            Seus dados de treino são criptografados e armazenados localmente no dispositivo.
          </Text>
        </GlassCard>

        <GlassCard noPadding>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Eye size={20} color={Colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Compartilhar Dados</Text>
                <Text style={styles.settingDesc}>Enviar dados anônimos para melhorias</Text>
              </View>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={(v) => toggleSetting('datasharing', v, setDataSharing)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor={dataSharing ? '#FFFFFF' : '#A0A0A0'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={Colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Rastreamento de Localização</Text>
                <Text style={styles.settingDesc}>Registrar rotas de corrida</Text>
              </View>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={(v) => toggleSetting('location', v, setLocationTracking)}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor={locationTracking ? '#FFFFFF' : '#A0A0A0'}
            />
          </View>
        </GlassCard>

        <TouchableOpacity style={styles.dangerBtn} activeOpacity={0.7} onPress={handleEraseData}>
          <Text style={styles.dangerBtnText}>Apagar Todos os Dados</Text>
        </TouchableOpacity>
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
    gap: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(223,255,0,0.05)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dangerBtn: {
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
