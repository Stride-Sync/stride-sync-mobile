import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Theme';
import { useAppInitialization } from '../hooks/useAppInitialization';

// Importa para registrar a task de background location imediatamente
import '../services/background-location';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const StrideDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bgDeep,
    card: Colors.bgDeep,
    text: Colors.textPrimary,
    primary: Colors.accent,
    border: Colors.glassBorder,
  },
};

export default function RootLayout() {
  const { isReady } = useAppInitialization();

  if (!isReady) return null;

  return (
    <ThemeProvider value={StrideDark}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgDeep },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="recommendation" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="player"
          options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen name="summary" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkin" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="stats" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="security" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="units" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tips" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sensors" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="workout-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ThemeProvider>
  );
}
