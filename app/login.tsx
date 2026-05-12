import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Zap, Shield } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/Theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { authService } from '../services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    performLogin(email, password);
  }

  async function performLogin(emailVal: string, passVal: string) {
    setLoading(true);
    try {
      const result = await authService.signIn({ email: emailVal, password: passVal });
      
      // Persiste nome e email para as telas de perfil e home
      await AsyncStorage.multiSet([
        ['@stridesync:user_name', result.user.name],
        ['@stridesync:user_email', result.user.email],
      ]);
      console.log('[Login] Sucesso:', result.user.name);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Evolua seu{'\n'}
            <Text style={styles.accent}>Desempenho</Text>
          </Text>
          <Text style={styles.subtitle}>Desenvolva sua corrida com ciência.</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Email"
            placeholder="nome@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title={loading ? '' : 'Entrar'}
            onPress={handleLogin}
            icon={
              loading
                ? <ActivityIndicator size="small" color="#000" />
                : <ChevronRight size={20} color="#000" />
            }
            style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          />
          <Button
            title="Criar Conta"
            variant="secondary"
            onPress={() => router.push('/signup')}
          />
        </View>

        <View style={styles.socialBlock}>
          <Text style={styles.socialText}>Ou entre com</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Zap size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Shield size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
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
    gap: 32,
  },
  header: {
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  accent: {
    color: Colors.accent,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  socialBlock: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  socialText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 20,
  },
  socialBtn: {
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 12,
    borderRadius: Radius.md,
  },
});
