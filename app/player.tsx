import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  X,
  MapPinOff,
  Clock,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

import { Colors, Spacing } from '../constants/Theme';
import { sessionsService } from '../services/sessions.service';
import { cacheService } from '../services/cache.service';
import { workoutsService, WorkoutTemplate } from '../services/workouts.service';
import { telemetryQueue, TelemetryPoint } from '../services/telemetry.queue';
import { parseAndCalculateSteps } from '../utils/workout';
import { formatClock } from '../utils/time';
import { GeoKalmanFilter } from '../utils/KalmanFilter';
import { MovementDetector } from '../utils/MovementDetector';
import { haversineKm } from '../utils/geo';


const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const BACKGROUND_LOCATION_TASK = 'background-location-task';

function useRealisticBPM(baseBPM: number, isPlaying: boolean) {
  const [bpm, setBpm] = useState(baseBPM);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setBpm(baseBPM + Math.round((Math.random() - 0.5) * 6));
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, baseBPM]);

  return { bpm, pulseAnim };
}

export default function PlayerScreen() {
  const kalman = useMemo(() => new GeoKalmanFilter(), []);
  const movement = useMemo(() => new MovementDetector(), []);

  const [workout, setWorkout] = useState<WorkoutTemplate | null>(null);
  const { sessionId, workoutName, stepsJson } = useLocalSearchParams<{
    sessionId: string;
    workoutName: string;
    stepsJson: string;
  }>();

  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);
  const [elapsed, setElapsed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [paceDisplay, setPaceDisplay] = useState('--:--');

  const lastPosition = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const { bpm, pulseAnim } = useRealisticBPM(154, isPlaying);

  // Swipe do círculo
  const [circleMetric, setCircleMetric] = useState(0); // 0=PACE, 1=DIST, 2=BPM
  const circleMetricRef = useRef(0); // Ref para o PanResponder não pegar estado antigo
  
  const slideX = useRef(new Animated.Value(0)).current;
  const stageBannerAnim = useRef(new Animated.Value(1)).current;
  const statsOpacity = useRef(new Animated.Value(1)).current;

  // Sincroniza a ref com o estado
  useEffect(() => {
    circleMetricRef.current = circleMetric;
  }, [circleMetric]);

  const stageThresholds = useMemo(() => {
    return parseAndCalculateSteps(stepsJson as string);
  }, [stepsJson]);

  useEffect(() => {
    // Sinaliza treino ativo para o SecurityGuard
    AsyncStorage.setItem('@stridesync:active_session', 'true');
    
    return () => {
      AsyncStorage.removeItem('@stridesync:active_session');
    };
  }, []);

  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          const dir = gestureState.dx > 0 ? -1 : 1;
          const next = (circleMetricRef.current + dir + 3) % 3;
          
          Animated.parallel([
            Animated.timing(slideX, { toValue: -dir * 100, duration: 150, useNativeDriver: true }),
            Animated.timing(statsOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(() => {
            setCircleMetric(next);
            slideX.setValue(dir * 100);
            Animated.parallel([
              Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(statsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
          });
        }
      },
    })
  ).current;

  const ringAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------
  // GPS & TRACKING (ESTILO STRAVA)
  // ---------------------------------------------------------
  // ---------------------------------------------------------
  // GPS & TRACKING (ALTA PRECISÃO - SENSOR FUSION)
  // ---------------------------------------------------------
  useEffect(() => {
    let sub: any = null;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      setGpsActive(true);
      kalman.reset();
      
      // Inicia detecção de movimento físico (Acelerômetro)
      movement.start((moving) => {
        if (__DEV__) console.log('[Movement] Status:', moving ? 'MOVING' : 'STATIONARY');
      });

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1, // Deixa o Kalman tratar a suavização
        },
        (location: Location.LocationObject) => {
          if (!isPlayingRef.current || !location) return;
          const { latitude, longitude, accuracy } = location.coords;
          const timestamp = location.timestamp;
          
          // 1. FILTRO DE ACURÁCIA (REJEITA SINAL RUIM)
          if (accuracy && accuracy > 20) {
            setGpsAccuracy(Math.round(accuracy));
            return;
          }
          setGpsAccuracy(Math.round(accuracy || 0));

          // 2. VALIDAÇÃO POR SENSOR FUSION (ACELERÔMETRO)
          // Se o acelerômetro diz que estamos parados, ignoramos oscilações de GPS
          if (!movement.getStatus()) return;

          // 3. SUAVIZAÇÃO DE KALMAN
          const filtered = kalman.process(latitude, longitude, accuracy || 10);

          if (lastPosition.current) {
            const timeDiff = (timestamp - lastPosition.current.timestamp) / 1000;
            if (timeDiff <= 0) return;

            const d = haversineKm(
              lastPosition.current.lat, lastPosition.current.lng,
              filtered.latitude, filtered.longitude,
            );

            // 4. HEURÍSTICA DE VELOCIDADE HUMANA (0.8m/s a 10m/s)
            // 0.8 m/s = 2.8 km/h (Corte de ruído estacionário)
            // 10 m/s = 36 km/h (Limite humano de corrida)
            const speedMs = (d * 1000) / timeDiff;
            
            if (speedMs >= 0.8 && speedMs <= 10) {
              setDistanceKm((prev) => prev + d);
              lastPosition.current = { lat: filtered.latitude, lng: filtered.longitude, timestamp };
            }
          } else {
            lastPosition.current = { lat: filtered.latitude, lng: filtered.longitude, timestamp };
          }
        }
      );
    }

    if (isPlaying) {
      startTracking();
    } else {
      sub?.remove();
      movement.stop();
      setGpsActive(false);
    }
    return () => { 
      sub?.remove(); 
      movement.stop();
    };
  }, [isPlaying]);

  useEffect(() => {
    if (sessionId) {
      AsyncStorage.setItem('@active_session_id', String(sessionId));
    }
    return () => { AsyncStorage.removeItem('@active_session_id'); };
  }, [sessionId]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Detector de estágio
  useEffect(() => {
    if (stageThresholds.length === 0) return;
    const newIdx = stageThresholds.findIndex(
      (s: any) => elapsed >= s.startSec && elapsed < s.endSec
    );
    const resolved = newIdx === -1 ? stageThresholds.length - 1 : newIdx;
    if (resolved !== activeStageIdx) {
      setActiveStageIdx(resolved);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(stageBannerAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.spring(stageBannerAnim, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [elapsed, stageThresholds]);

  // Atualização de Pace Reativa
  useEffect(() => {
    if (!isPlaying || distanceKm < 0.001) return;
    const paceDecimal = (elapsed / 60) / distanceKm;
    if (paceDecimal > 0 && paceDecimal < 60) {
      const paceM = Math.floor(paceDecimal);
      const paceS = Math.floor((paceDecimal - paceM) * 60);
      setPaceDisplay(`${paceM}:${String(paceS).padStart(2, '0')}`);
    }
  }, [isPlaying, distanceKm, elapsed]);

  // Cronômetro
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => setElapsed((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Telemetria (arredondando heart_rate)
  useEffect(() => {
    if (!isPlaying || !sessionId) return;
    const interval = setInterval(async () => {
      const [m, s] = paceDisplay.split(':').map((val: string) => Number(val));
      const rawPace = isNaN(m) ? 0 : (m + (s || 0) / 60);
      const pace = Number(rawPace.toFixed(2));
      
      const point: TelemetryPoint = {
        timestamp: new Date().toISOString(),
        heart_rate: Math.round(bpm),
        pace: isNaN(pace) ? 0 : pace,
      };
      if (lastPosition.current) {
        point.latitude  = lastPosition.current.lat;
        point.longitude = lastPosition.current.lng;
      }
      telemetryQueue.addPoint(Number(sessionId), point);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, sessionId, bpm, paceDisplay]);

  async function handleFinish() {
    Alert.alert('Finalizar Treino', 'Deseja encerrar a sessão agora?', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Finalizar', style: 'destructive', onPress: async () => {
        setIsPlaying(false);
        setFinishing(true);
        try {
          if (sessionId) {
            await telemetryQueue.syncQueue(Number(sessionId));
            await sessionsService.finishSession(Number(sessionId));
            
            // Invalida caches afetados por um novo treino (Isolado)
            try {
              await Promise.all([
                cacheService.invalidate('stats:week'),
                cacheService.invalidate('stats:month'),
                cacheService.invalidate('stats:all'),
                cacheService.invalidate('sessions:history'),
              ]);
            } catch (e) {
              console.warn('[Player] Falha ao invalidar cache após treino:', e);
            }
          }
          router.replace({ pathname: '/summary', params: { sessionId: sessionId ?? '', elapsed: String(elapsed) } });
        } catch {
          Alert.alert('Erro', 'Falha ao salvar. Tentaremos mais tarde.');
          setFinishing(false);
        }
      }},
    ]);
  }

  async function handleAbort() {
    Alert.alert('Abandonar Treino', 'Seu progresso será salvo até aqui.', [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Abandonar', style: 'destructive', onPress: async () => {
        setIsPlaying(false);
        try { if (sessionId) await sessionsService.abortSession(Number(sessionId)); }
        finally { router.back(); }
      }},
    ]);
  }


  const distanceDisplay = distanceKm < 0.5
    ? { value: Math.round(distanceKm * 1000).toString(), unit: 'm' }
    : { value: distanceKm.toFixed(2), unit: 'km' };

  const metricsData = [
    { label: 'PACE MÉDIO',     value: paceDisplay,           unit: 'MIN/KM' },
    { label: 'DISTÂNCIA',       value: distanceDisplay.value, unit: distanceDisplay.unit.toUpperCase() },
    { label: 'FREQ. CARDÍACA', value: String(bpm),           unit: 'BPM' },
  ];

  const strokeDashoffset = ringAnim.interpolate({
    inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0],
  });

  const STEP_TYPE_INFO: Record<string, { label: string; color: string; tip: string }> = {
    AQUECIMENTO:      { label: 'Aquecimento',     color: '#FF9500', tip: 'Aqueça gradualmente.' },
    ESFORCO:          { label: 'Esforço',          color: Colors.accent, tip: 'Dê o seu melhor!' },
    DESCANSO_ATIVO:   { label: 'Descanso Ativo',   color: '#30D158', tip: 'Trote leve.' },
    DESCANSO_PASSIVO: { label: 'Descanso Passivo', color: '#64D2FF', tip: 'Respire fundo.' },
    RESFRIAMENTO:     { label: 'Resfriamento',     color: '#BF5AF2', tip: 'Reduza o ritmo.' },
  };

  const activeStage = stageThresholds[activeStageIdx] ?? null;
  const stageInfo   = activeStage ? (STEP_TYPE_INFO[activeStage.type] ?? { label: activeStage.type, color: Colors.accent, tip: 'Foco!' }) : null;
  const stagePct    = activeStage ? Math.min(1, (elapsed - activeStage.startSec) / activeStage.duration_seconds) : 0;
  const stageSecsLeft = activeStage ? Math.max(0, activeStage.endSec - elapsed) : 0;
  const stageTimeLeft = formatClock(stageSecsLeft);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.focusBadge}><Text style={styles.focusBadgeText}>{workoutName ?? 'TREINO EM ANDAMENTO'}</Text></View>
          <TouchableOpacity onPress={handleAbort} style={styles.abortBtn}><X size={20} color={Colors.textMuted} /></TouchableOpacity>
        </View>

        <Text style={styles.timer}>{formatClock(elapsed)}</Text>

        {stageInfo && (
          <Animated.View style={[styles.stageCardContainer, { opacity: stageBannerAnim }]}>
            <BlurView intensity={40} tint="dark" style={styles.stageCard}>
              <View style={styles.stageCardContent}>
                <View style={styles.stageCardHeader}>
                  <Text style={[styles.stageCardLabel, { color: stageInfo.color }]}>{stageInfo.label.toUpperCase()}</Text>
                  <Text style={styles.stageCardOf}>{activeStageIdx + 1} / {stageThresholds.length}</Text>
                </View>
                <View style={styles.stageCardMain}>
                  <View style={styles.stageTimeContainer}><Text style={styles.stageTimeValue}>{stageTimeLeft}</Text></View>
                  <Text style={styles.stageCardTip} numberOfLines={2}>{stageInfo.tip}</Text>
                </View>
              </View>
              <View style={styles.stageCardProgressBg}>
                <View style={[styles.stageCardProgressFill, { width: `${stagePct * 100}%`, backgroundColor: stageInfo.color }]} />
              </View>
            </BlurView>
          </Animated.View>
        )}

        <View style={styles.circleContainer}>
          <View style={styles.circleInner} {...panResponder.panHandlers}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svgRing}>
              <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE_WIDTH} fill="transparent" />
              <AnimatedCircle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={Colors.accent} strokeWidth={STROKE_WIDTH} fill="transparent" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} strokeLinecap="round" rotation="-90" origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`} />
            </Svg>
            <Animated.View style={[styles.circleContent, { transform: [{ translateX: slideX }] }]}>
              <Text style={styles.bpmLabel}>{metricsData[circleMetric].label}</Text>
              <Text style={styles.bpmValue}>{metricsData[circleMetric].value}</Text>
              <Text style={styles.bpmUnit}>{metricsData[circleMetric].unit}</Text>
            </Animated.View>
            <View style={styles.dotsRow}>
              {[0,1,2].map(i => <View key={i} style={[styles.dot, circleMetric === i && styles.dotActive]} />)}
            </View>
          </View>
        </View>

        <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
          {metricsData.map((m, i) => ({ ...m, id: i })).filter((m) => m.id !== circleMetric).map((m) => (
            <View key={m.id} style={styles.statItem}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>{m.label}</Text>
                {m.id === 1 && gpsAccuracy != null && gpsAccuracy > 40 && <MapPinOff size={14} color="#FF9500" />}
              </View>
              <Text style={styles.statValue}>{m.value} <Text style={{ fontSize: 14, color: Colors.textMuted }}>{m.unit}</Text></Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.playPause} onPress={() => setIsPlaying(!isPlaying)} activeOpacity={0.7}>
            {isPlaying ? <Pause size={28} color={Colors.textPrimary} /> : <Play size={28} color={Colors.textPrimary} fill={Colors.textPrimary} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.finishBtn, finishing && { opacity: 0.7 }]} onPress={handleFinish} disabled={finishing} activeOpacity={0.8}>
            <Text style={styles.finishText}>{finishing ? 'Salvando...' : 'Finalizar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: Spacing.lg, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  focusBadge: { flex: 1, backgroundColor: Colors.accentSoft, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, alignSelf: 'flex-start' },
  focusBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.accent, letterSpacing: 1 },
  abortBtn: { padding: 8 },
  timer: { fontSize: 64, fontWeight: '800', color: Colors.accent, letterSpacing: 2, marginTop: 8 },
  circleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleInner: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center' },
  svgRing: { position: 'absolute' },
  circleContent: { alignItems: 'center', justifyContent: 'center' },
  bpmLabel: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 2, marginBottom: 4 },
  bpmValue: { fontSize: 80, fontWeight: '800', color: Colors.textPrimary, lineHeight: 88 },
  bpmUnit: { fontSize: 20, fontWeight: '800', color: Colors.accent, letterSpacing: 2, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 32 },
  statItem: { flex: 1, gap: 6 },
  statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  statValue: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  controls: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  playPause: { width: 70, height: 70, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  finishBtn: { flex: 1, height: 70, backgroundColor: Colors.accent, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  finishText: { fontSize: 20, fontWeight: '700', color: '#000' },
  dotsRow: { position: 'absolute', bottom: 22, flexDirection: 'row', gap: 6, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: Colors.accent, width: 16, borderRadius: 3 },
  stageCardContainer: { borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  stageCard: { padding: 16, gap: 8 },
  stageCardContent: { gap: 8 },
  stageCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageCardLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  stageCardOf: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  stageCardMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stageTimeContainer: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  stageTimeValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  stageCardTip: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 16, fontWeight: '500' },
  stageCardProgressBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.05)' },
  stageCardProgressFill: { height: '100%' },
});
