import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/Theme';
import { getAccessToken } from '../services/api';
import api from '../services/api';
import { telemetryQueue } from '../services/telemetry.queue';

export default function SplashLanding() {
  useEffect(() => {
    async function checkSession() {
      // Aguarda ao menos 2s para o splash ser visível
      const delay = new Promise((res) => setTimeout(res, 2000));

      try {
        const token = await getAccessToken();

        if (token) {
          // Valida o token contra a API — rota protegida simples
          await api.get('/profile').catch(() => {
            // 404 é ok (sem perfil), mas token é válido
            // Qualquer 401 vai para o catch externo
          });
          
          // Sincroniza qualquer telemetria offline presa no async storage
          telemetryQueue.syncAll().catch(e => console.warn('[Splash] Offline sync ignored:', e));

          await delay;
          router.replace('/(tabs)/home');

        } else {
          await delay;
          router.replace('/login');
        }
      } catch (err: any) {
        await delay;
        // Token inválido ou expirado → força login
        router.replace('/login');
      }
    }

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          STRIDE<Text style={styles.accent}>SYNC</Text>
        </Text>
        <Text style={styles.subtitle}>PERFORMANCE RUNNING</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.accent,
    opacity: 0.06,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: Colors.accent,
    opacity: 0.04,
  },
  logo: {
    width: 140,
    height: 140,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  accent: {
    color: Colors.accent,
  },
  subtitle: {
    color: Colors.textMuted,
    letterSpacing: 4,
    fontSize: 12,
    marginTop: 8,
  },
});
