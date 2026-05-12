import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const QUEUE_KEY = '@stride_telemetry_queue';
const syncingSessions = new Set<number>();

export interface TelemetryPoint {
  timestamp: string;
  heart_rate?: number;
  cadence?: number;
  pace?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
}

export interface QueuedBatch {
  sessionId: number;
  points: TelemetryPoint[];
}

export const telemetryQueue = {
  /**
   * Adiciona um ponto à fila local. Se a fila da sessão passar de 10 itens, 
   * tenta sincronizar automaticamente.
   */
  async addPoint(sessionId: number, point: TelemetryPoint) {
    try {
      const rawQueue = await AsyncStorage.getItem(QUEUE_KEY);
      let queue: Record<number, TelemetryPoint[]> = rawQueue ? JSON.parse(rawQueue) : {};

      if (!queue[sessionId]) {
        queue[sessionId] = [];
      }
      
      queue[sessionId].push(point);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      // Se acumulou mais de 10 pontos offline, tenta esvaziar
      if (queue[sessionId].length >= 10) {
        void this.syncQueue(sessionId).catch((e) =>
          console.warn('[TelemetryQueue] Sync automático falhou:', e),
        );
      }
    } catch (e) {
      console.warn('[TelemetryQueue] Erro ao adicionar ponto:', e);
    }
  },

  /**
   * Tenta enviar todos os pontos acumulados de uma sessão para o backend.
   * Se falhar, mantém na fila para tentar depois.
   */
  async syncQueue(sessionId: number): Promise<boolean> {
    if (syncingSessions.has(sessionId)) return true;
    syncingSessions.add(sessionId);
    try {
      const rawQueue = await AsyncStorage.getItem(QUEUE_KEY);
      if (!rawQueue) return true;
      
      let queue: Record<number, TelemetryPoint[]> = JSON.parse(rawQueue);
      const points = queue[sessionId];

      if (!points || points.length === 0) return true;

      // Pega um snapshot de até 50 pontos para não fazer requests giganges de uma vez
      const batchToSync = points.slice(0, 50);

      console.log(`[TelemetryQueue] Tentando sincronizar ${batchToSync.length} pontos offline...`);
      await api.post(`/sessions/${sessionId}/telemetry`, { points: batchToSync });

      // Sucesso! Remove apenas os pontos que enviamos com sucesso.
      queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '{}'); // Lê de novo caso tenha chegado mais no meio do request
      if (queue[sessionId]) {
        queue[sessionId] = queue[sessionId].slice(batchToSync.length);
        if (queue[sessionId].length === 0) {
          delete queue[sessionId];
        }
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
      
      console.log('[TelemetryQueue] Sincronização offline bem sucedida!');
      return true;
    } catch (e: any) {
      const status = e?.response?.status as number | undefined;
      // Sessão encerrada/ inválida (ex.: app terminou e ainda sobrou fila)
      if (status === 404 || status === 422) {
        console.warn(
          `[TelemetryQueue] Backend rejeitou telemetria da sessão ${sessionId} (HTTP ${status}). Limpando fila local dessa sessão.`,
        );
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        const queue: Record<number, TelemetryPoint[]> = raw ? JSON.parse(raw) : {};
        if (queue[sessionId]) {
          delete queue[sessionId];
          await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        }
        return true;
      }

      console.warn('[TelemetryQueue] Erro ao sincronizar. Mantendo dados na fila offline.');
      return false; // Mantém no AsyncStorage
    } finally {
      syncingSessions.delete(sessionId);
    }
  },

  /**
   * Força o sync de todas as sessões paradas na fila (útil ao abrir o app)
   */
  async syncAll() {
    try {
      const rawQueue = await AsyncStorage.getItem(QUEUE_KEY);
      if (!rawQueue) return;
      const queue: Record<number, TelemetryPoint[]> = JSON.parse(rawQueue);
      
      for (const sessionId of Object.keys(queue)) {
        await this.syncQueue(Number(sessionId));
      }
    } catch (e) {
      console.warn('[TelemetryQueue] Erro no syncAll:', e);
    }
  }
};
