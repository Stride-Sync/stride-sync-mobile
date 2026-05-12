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
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing } from '../constants/Theme';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { authService } from '../services/auth.service';

export default function SignUpScreen() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    birth: '2000-01-01',
  });
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signUp(form);

      // Persiste dados básicos (Isolado para não travar o fluxo em caso de erro de storage)
      try {
        await AsyncStorage.multiSet([
          ['@stridesync:user_name', result.user.name],
          ['@stridesync:user_email', result.user.email],
        ]);
      } catch (storageError) {
        console.error('[SignUp] Falha ao persistir dados locais:', storageError);
      }

      // Vai direto para o quiz
      router.replace('/quiz');
    } catch (error: any) {
      console.error('[SignUp] Erro:', error.response?.data || error.message);
      
      const responseData = error.response?.data;
      let msg = 'Não foi possível criar sua conta. Verifique sua conexão ou tente novamente.';

      // Extração robusta de mensagem do NestJS
      if (responseData) {
        if (typeof responseData.message === 'string') {
          msg = responseData.message;
        } else if (Array.isArray(responseData.message)) {
          msg = responseData.message[0];
        } else if (responseData.error) {
          msg = responseData.error;
        }
      } else if (error.message) {
        msg = error.message;
      }
      
      Alert.alert('Falha no Cadastro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Criar <Text style={styles.accent}>Conta</Text></Text>
          <Text style={styles.subtitle}>Junte-se à elite da corrida científica.</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Nome Completo"
            placeholder="Ex: Pedro Silva"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <InputField
            label="Nome de Usuário"
            placeholder="Ex: pedrosilva"
            value={form.username}
            onChangeText={(v) => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, '') })}
            autoCapitalize="none"
          />
          <InputField
            label="Email"
            placeholder="pedro@exemplo.com"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry
          />

          <Button
            title="Criar Conta"
            onPress={handleSignUp}
            loading={loading}
            icon={!loading ? <ChevronRight size={20} color="#000" /> : undefined}
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDeep },
  container: { padding: Spacing.lg, gap: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: 10 },
  header: { marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary },
  accent: { color: Colors.accent },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: 16 },
});
