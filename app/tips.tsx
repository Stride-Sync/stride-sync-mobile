import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Lightbulb, Volume2 } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';

export default function TipsScreen() {
  const [showTips, setShowTips] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

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
          <Text style={styles.headerTitle}>Dicas e Avisos</Text>
        </View>

        <GlassCard noPadding>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Lightbulb size={20} color={Colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Dicas de Treino</Text>
                <Text style={styles.settingDesc}>Mostrar dicas na tela inicial</Text>
              </View>
            </View>
            <Switch
              value={showTips}
              onValueChange={setShowTips}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor={showTips ? '#FFFFFF' : '#A0A0A0'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Volume2 size={20} color={Colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Alertas Sonoros</Text>
                <Text style={styles.settingDesc}>Sons durante mudanças de série</Text>
              </View>
            </View>
            <Switch
              value={audioAlerts}
              onValueChange={setAudioAlerts}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor={audioAlerts ? '#FFFFFF' : '#A0A0A0'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.accent} />
              <View>
                <Text style={styles.settingTitle}>Notificações Push</Text>
                <Text style={styles.settingDesc}>Lembretes de treino diários</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor={pushNotifications ? '#FFFFFF' : '#A0A0A0'}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.previewCard}>
          <Lightbulb size={20} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle}>Exemplo de Dica</Text>
            <Text style={styles.previewText}>
              O descanso entre os esforços rápidos deve ser longo o suficiente
              para você recuperar o fôlego.
            </Text>
          </View>
        </GlassCard>
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
  previewCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(223,255,0,0.05)',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
