/**
 * Safely formats duration in seconds to a human-readable string (mm:ss or m min).
 * Handles null, undefined, or 0 gracefully.
 */
export function formatDuration(secs: number | null | undefined): string {
  if (!secs || isNaN(secs) || secs < 0) {
    return '0m';
  }

  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);

  if (m === 0) {
    return `${s}s`;
  }
  
  return s === 0 ? `${m} min` : `${m}m ${s}s`;
}

/**
 * Formats seconds to a digital clock format (MM:SS).
 */
export function formatClock(secs: number | null | undefined): string {
  if (!secs || isNaN(secs) || secs < 0) {
    return '00:00';
  }
  
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
