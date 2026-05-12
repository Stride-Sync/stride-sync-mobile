import api from './api';
import { cacheService } from './cache.service';

export interface SessionSummary {
  id: number;
  uuid: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_distance_meters: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_pace: number | null;
  total_calories_burned: number | null;
  template: {
    id: number;
    name: string;
    scientific_type: string;
  };
}

export interface StatsSummary {
  period: string;
  total_distance_km: number;
  total_calories: number;
  total_time_secs: number;
  avg_pace_min_km: number;
  chart_data: number[];
}

export const sessionsService = {
  async startSession(templateId: number): Promise<any> {
    const { data } = await api.post('/sessions', { template_id: templateId });
    await this.clearCache();
    return data;
  },

  async getHistory(forceRefresh = false): Promise<SessionSummary[]> {
    const cacheKey = 'sessions:history';
    
    if (!forceRefresh) {
      const cached = await cacheService.get<SessionSummary[]>(cacheKey);
      if (cached) return cached;
    }

    const { data } = await api.get('/sessions');
    cacheService.set(cacheKey, data, 15 * 60 * 1000); // 15 min
    return data;
  },

  async getStats(period: 'week' | 'month' | 'all', forceRefresh = false): Promise<StatsSummary> {
    const cacheKey = `stats:${period}`;
    
    if (!forceRefresh) {
      const cached = await cacheService.get<StatsSummary>(cacheKey);
      if (cached) return cached;
    }

    const { data } = await api.get(`/sessions/stats?period=${period}`);
    cacheService.set(cacheKey, data, 15 * 60 * 1000); // 15 min
    return data;
  },

  async getSession(id: number): Promise<any> {
    const { data } = await api.get(`/sessions/${id}`);
    return data;
  },

  async finishSession(id: number): Promise<any> {
    const { data } = await api.patch(`/sessions/${id}/finish`);
    await this.clearCache();
    return data;
  },

  async abortSession(id: number): Promise<any> {
    const { data } = await api.patch(`/sessions/${id}/abort`);
    await this.clearCache();
    return data;
  },

  async sendTelemetry(sessionId: number, points: any[]): Promise<any> {
    const { data } = await api.post(`/sessions/${sessionId}/telemetry`, { points });
    return data;
  },

  async clearCache() {
    await cacheService.invalidate();
  }
};
