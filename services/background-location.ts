import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { telemetryQueue } from './telemetry.queue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  haversineKm, 
  MAX_ACCURACY_BACKGROUND, 
  MAX_HUMAN_SPEED_MS, 
  MIN_MOVEMENT_THRESHOLD 
} from '../utils/geo';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';


let lastPosition: { lat: number; lng: number; timestamp: number } | null = null;

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Erro na task:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    const activeSessionStr = await AsyncStorage.getItem('@active_session_id');
    if (!activeSessionStr) {
      Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
      lastPosition = null;
      return;
    }

    const sessionId = Number(activeSessionStr);

    for (const loc of locations) {
      const { latitude, longitude, accuracy } = loc.coords;
      const timestamp = loc.timestamp;

      // 1. Filtro de Precisão (Background pode ser mais ruidoso, mas mantemos o rigor)
      if (accuracy && accuracy > MAX_ACCURACY_BACKGROUND) continue;

      if (lastPosition) {
        const timeDiff = (timestamp - lastPosition.timestamp) / 1000;
        if (timeDiff > 0) {
          const d = haversineKm(
            lastPosition.lat, lastPosition.lng,
            latitude, longitude
          );
          
          // 2. Filtro de Velocidade Humana
          const speedMs = (d * 1000) / timeDiff;
          if (speedMs > MAX_HUMAN_SPEED_MS) continue; 

          // 3. Movimento Mínimo Validado (Dinâmico conforme a precisão)
          const minMovement = Math.max((accuracy || 0) / 1000, MIN_MOVEMENT_THRESHOLD);
          if (d < minMovement) continue;
        }
      }

      lastPosition = { lat: latitude, lng: longitude, timestamp };

      telemetryQueue.addPoint(sessionId, {
        timestamp: new Date(loc.timestamp).toISOString(),
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
      });
      
      console.log(`[BackgroundLocation] Ponto validado salvo: lat=${latitude.toFixed(5)} lng=${longitude.toFixed(5)}`);
    }
  }
});
