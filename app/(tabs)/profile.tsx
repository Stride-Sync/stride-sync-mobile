import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  ChevronRight,
  LogOut,
  Target,
  Weight,
  Activity,
  Edit3,
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';
import { authService } from '../../services/auth.service';
import { profileService, BiophysicalProfile } from '../../services/profile.service';
import { cacheService } from '../../services/cache.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const menuItems = [
  { label: 'Segurança e Privacidade', route: '/security' },
  { label: 'Unidades de Medida', route: '/units' },
  { label: 'Dicas e Avisos', route: '/tips' },
  { label: 'Conectar Sensores', route: '/sensors' },
];

export default function ProfileScreen() {
  const [userName, setUserName] = useState('Atleta');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<BiophysicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(showRefresh = false) {
    try {
      // 1. STALE
      const [name, email, cachedProf] = await Promise.all([
        AsyncStorage.getItem('@stridesync:user_name'),
        AsyncStorage.getItem('@stridesync:user_email'),
        cacheService.get<BiophysicalProfile>('profile'),
      ]);
      
      if (name) setUserName(name);
      if (email) setUserEmail(email);
      if (cachedProf) setProfile(cachedProf);

      if (showRefresh || cachedProf) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // 2. REVALIDATE
      const prof = await profileService.get(true);
      setProfile(prof);
    } catch (e) {
      console.warn('[Profile] Erro ao carregar:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarrega ao focar, mas o cache evita o ActivityIndicator intrusivo
  useFocusEffect(useCallback(() => { loadData(); }, [profile]));

  function handleLogout() {
    Alert.alert(
      'Encerrar Sessão',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            await AsyncStorage.multiRemove([
              '@stridesync:user_name',
              '@stridesync:user_email',
            ]);
            router.replace('/login');
          },
        },
      ]
    );
  }

  // Iniciais do nome para o avatar
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={Colors.accent} />
        }
      >
        <Text style={styles.title}>Meu Perfil</Text>

        {/* Avatar + Nome */}
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{userName}</Text>
            {userEmail ? <Text style={styles.email}>{userEmail}</Text> : null}
            {profile ? (
              <Text style={styles.meta}>
                {profileService.fitnessLabel(profile.fitness_level)} •{' '}
                {profile.weight_kg ? `${profile.weight_kg}kg` : '—'}
              </Text>
            ) : (
              !loading && (
                <TouchableOpacity onPress={() => router.push('/quiz')}>
                  <Text style={styles.setupProfile}>Configurar perfil →</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* Biophysical Profile Card */}
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : profile ? (
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileCardHeader}>
              <Text style={styles.profileCardTitle}>Perfil Biofísico</Text>
              <TouchableOpacity onPress={() => router.push('/quiz')} style={styles.editBtn}>
                <Edit3 size={14} color={Colors.accent} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileGrid}>
              <ProfileStat
                icon={<Target size={16} color={Colors.accent} />}
                label="Objetivo"
                value={profileService.goalLabel(profile.focus_goal)}
              />
              <ProfileStat
                icon={<Activity size={16} color={Colors.accent} />}
                label="Nível"
                value={profileService.fitnessLabel(profile.fitness_level)}
              />
              {profile.weight_kg && (
                <ProfileStat
                  icon={<Weight size={16} color={Colors.accent} />}
                  label="Peso"
                  value={`${profile.weight_kg} kg`}
                />
              )}
              {profile.height_cm && (
                <ProfileStat
                  icon={<User size={16} color={Colors.accent} />}
                  label="Altura"
                  value={`${profile.height_cm} cm`}
                />
              )}
            </View>
          </GlassCard>
        ) : (
          <TouchableOpacity onPress={() => router.push('/quiz')} activeOpacity={0.8}>
            <GlassCard style={styles.emptyProfileCard}>
              <Activity size={32} color={Colors.accent} />
              <Text style={styles.emptyProfileTitle}>Complete seu Perfil</Text>
              <Text style={styles.emptyProfileSub}>
                Responda ao quiz para receber treinos personalizados ao seu nível e objetivo.
              </Text>
              <View style={styles.emptyProfileBtn}>
                <Text style={styles.emptyProfileBtnText}>Fazer Quiz Agora</Text>
                <ChevronRight size={16} color="#000" />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <GlassCard noPadding>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.menuRow,
                i === menuItems.length - 1 && { borderBottomWidth: 0 },
              ]}
              activeOpacity={0.6}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.menuText}>{item.label}</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color="#FF3B30" />
          <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 20, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: 20 },

  // Avatar / Header
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#000' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  meta: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  setupProfile: { fontSize: 13, color: Colors.accent, marginTop: 4, fontWeight: '600' },

  // Biophysical Card
  profileCard: { gap: 16 },
  profileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md, padding: 12, gap: 4,
  },
  statIcon: { marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Empty profile CTA
  emptyProfileCard: { alignItems: 'center', gap: 10 },
  emptyProfileTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptyProfileSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 4,
  },
  emptyProfileBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },

  // Menu
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
  },
  menuText: { fontWeight: '500', color: Colors.textPrimary, fontSize: 15 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)',
    borderRadius: Radius.lg, backgroundColor: 'rgba(255,59,48,0.06)',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
});
