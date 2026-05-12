import api from './api';
import { cacheService } from './cache.service';

export interface WorkoutTemplate {
  id: number;
  uuid: string;
  name: string;
  description: string | undefined;
  scientific_type: string;
  is_recommended: boolean;
  base_intensity: string;
  expected_duration_secs: number;
  steps: WorkoutStep[];
}

export interface WorkoutStep {
  id: number;
  order: number;
  type: string;
  duration_seconds: number;
  target_heart_rate_low?: number;
  target_heart_rate_high?: number;
  target_pace_min_km?: number;
}

export const workoutsService = {
  async getAll(forceRefresh = false): Promise<WorkoutTemplate[]> {
    const cacheKey = 'workouts:all';
    if (!forceRefresh) {
      const cached = await cacheService.get<WorkoutTemplate[]>(cacheKey);
      if (cached) return cached;
    }

    const { data } = await api.get<WorkoutTemplate[]>('/workouts');
    await cacheService.set(cacheKey, data, 15 * 60 * 1000); // 15 min TTL for catalog
    return data;
  },

  async getById(id: number): Promise<WorkoutTemplate> {
    const { data } = await api.get<WorkoutTemplate>(`/workouts/${id}`);
    return data;
  },

  async getRecommendations(time?: number, readiness?: string, forceRefresh = false): Promise<WorkoutTemplate[]> {
    const t = time ?? 'any';
    const r = readiness ?? 'any';
    const cacheKey = `workouts:recs:${t}:${r}`;
    
    if (!forceRefresh) {
      const cached = await cacheService.get<WorkoutTemplate[]>(cacheKey);
      if (cached) return cached;
    }

    const params = new URLSearchParams();
    if (time) params.append('time', String(time));
    if (readiness) params.append('readiness', readiness);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const { data } = await api.get<WorkoutTemplate[]>(`/workouts/recommendations${qs}`);
    
    await cacheService.set(cacheKey, data, 10 * 60 * 1000); // 10 min TTL
    return data;
  },
};
