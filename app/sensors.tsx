import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Watch,
  Heart,
  Radio,
  Bluetooth,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';

const sensors = [
  {
    icon: Heart,
    name: 'Monitor Cardíaco',
    status: 'Conectado',
    connected: true,
  },
  {
    icon: Watch,
    name: 'Smartwatch',
    status: 'Não detectado',
    connected: false,
  },
  {
    icon: Radio,
    name: 'Sensor de Cadência',
    status: 'Não detectado',
    connected: false,
  },
];

export default function SensorsScreen() {
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
          <Text style={styles.headerTitle}>Conectar Sensores</Text>
        </View>

        {/* Bluetooth status */}
        <GlassCard style={styles.btCard}>
          <Bluetooth size={24} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.btTitle}>Bluetooth</Text>
            <Text style={styles.btStatus}>Ativo • Procurando dispositivos...</Text>
          </View>
          <View style={styles.btDot} />
        </GlassCard>

        {/* Sensors list */}
        <Text style={styles.sectionLabel}>DISPOSITIVOS</Text>
        <GlassCard noPadding>
          {sensors.map((sensor, i) => {
            const Icon = sensor.icon;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.sensorRow,
                  i === sensors.length - 1 && { borderBottomWidth: 0 },
                ]}
                activeOpacity={0.6}
              >
                <View style={styles.sensorLeft}>
                  <View
                    style={[
                      styles.sensorIcon,
                      sensor.connected && styles.sensorIconActive,
                    ]}
                  >
                    <Icon
                      size={20}
                      color={sensor.connected ? '#000' : Colors.textMuted}
                    />
                  </View>
                  <View>
                    <Text style={styles.sensorName}>{sensor.name}</Text>
                    <Text
                      style={[
                        styles.sensorStatus,
                        sensor.connected && { color: Colors.accent },
                      ]}
                    >
                      {sensor.status}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        {/* Scan button */}
        <TouchableOpacity style={styles.scanBtn} activeOpacity={0.8}>
          <Bluetooth size={18} color="#000" />
          <Text style={styles.scanBtnText}>Procurar Novos Dispositivos</Text>
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
    gap: 20,
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
  btCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  btTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  btStatus: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 2,
  },
  btDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  sensorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sensorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIconActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  sensorName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  sensorStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
