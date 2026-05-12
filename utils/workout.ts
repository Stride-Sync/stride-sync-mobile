import { WorkoutStep } from '../services/workouts.service';

export interface CalculatedWorkoutStep extends WorkoutStep {
  startSec: number;
  endSec: number;
}

/**
 * Parses workout steps from JSON and calculates start/end seconds for each step.
 * Includes safety validation as recommended.
 */
export function parseAndCalculateSteps(stepsJson: string): CalculatedWorkoutStep[] {
  if (!stepsJson) return [];

  try {
    const steps = JSON.parse(stepsJson);

    if (!Array.isArray(steps)) {
      console.error('[WorkoutUtils] Invalid steps format: expected array');
      return [];
    }

    let current = 0;
    return steps.map((step: any) => {
      const start = current;
      // Use duration_seconds from refactored backend contract
      const duration = Number(step.duration_seconds) || 0;
      current += duration;
      
      return {
        ...step,
        startSec: start,
        endSec: current,
      };
    });
  } catch (error) {
    console.error('[WorkoutUtils] Error parsing steps JSON:', error);
    return [];
  }
}
