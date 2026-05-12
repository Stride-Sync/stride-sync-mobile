/**
 * Calcula a distância entre dois pontos (Haversine) em Kilômetros.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Background location filtering constants
export const MAX_ACCURACY_BACKGROUND = 20; // meters
export const MAX_HUMAN_SPEED_MS = 10; // meters per second (~36 km/h)
export const MIN_MOVEMENT_THRESHOLD = 0.00005; // ~5 meters in degrees
