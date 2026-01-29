import { useRef } from 'react';
import type { Pose } from '../types/pose';

/**
 * Configurazione avanzata per smoothing anti-jitter
 */
interface SmoothingConfig {
  smoothingFactor: number;      // EMA base (0.3-0.5 = smooth, 0.6-0.8 = reattivo)
  minConfidence: number;         // Soglia confidence minima (default 0.3)
  deadZoneThreshold: number;     // Movimento minimo per considerare movimento reale (pixel)
  velocityAdaptive: boolean;     // Abilita smoothing adattivo alla velocità
}

/**
 * Hook per applicare smoothing avanzato ai keypoints della pose
 * Riduce jitter/tremolio e stabilizza lo skeleton quando sei fermo
 *
 * Ottimizzazioni:
 * 1. Dead Zone: ignora micro-movimenti sotto soglia (elimina tremolio da fermo)
 * 2. Velocity-Adaptive: smoothing più aggressivo quando sei fermo, reattivo quando ti muovi
 * 3. Confidence Filtering: ignora keypoints con confidence troppo bassa
 */
export const usePoseSmoothing = (
  smoothingFactor: number = 0.5,
  config?: Partial<SmoothingConfig>
) => {
  const previousPose = useRef<Pose | null>(null);
  const velocities = useRef<Map<string, number>>(new Map());

  // Configurazione con defaults
  const cfg: SmoothingConfig = {
    smoothingFactor,
    minConfidence: config?.minConfidence ?? 0.3,
    deadZoneThreshold: config?.deadZoneThreshold ?? 0.005, // ~0.5% dello schermo
    velocityAdaptive: config?.velocityAdaptive ?? true,
  };

  /**
   * Calcola distanza euclidea tra due punti (normalizzata 0-1)
   */
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const smoothPose = (currentPose: Pose | null): Pose | null => {
    if (!currentPose) return null;

    // Prima pose - nessuno smoothing
    if (!previousPose.current) {
      previousPose.current = currentPose;
      return currentPose;
    }

    // Applica Exponential Moving Average (EMA) con ottimizzazioni
    const smoothed: Pose = {
      keypoints: {} as any,
    };

    for (const [name, point] of Object.entries(currentPose.keypoints)) {
      const prevPoint = previousPose.current.keypoints[name as keyof typeof currentPose.keypoints];

      // OTTIMIZZAZIONE 1: Filtra keypoints con confidence troppo bassa
      // Se il punto non è affidabile, usa il valore precedente MA con confidence ridotta
      // Questo evita "pallini fantasma" che persistono quando parti del corpo escono dall'inquadratura
      if (point.confidence < cfg.minConfidence) {
        // Decrementa la confidence del punto precedente per farlo sparire gradualmente
        const decayedConfidence = prevPoint.confidence * 0.7; // Decade del 30% ogni frame
        smoothed.keypoints[name as keyof typeof smoothed.keypoints] = {
          ...prevPoint,
          confidence: decayedConfidence,
        };
        continue;
      }

      // Calcola velocità (distanza dal frame precedente)
      const velocity = calculateDistance(point.x, point.y, prevPoint.x, prevPoint.y);
      velocities.current.set(name, velocity);

      // OTTIMIZZAZIONE 2: Dead Zone - se movimento < threshold, considera fermo
      if (velocity < cfg.deadZoneThreshold) {
        // Movimento troppo piccolo - mantieni posizione precedente (zero jitter)
        smoothed.keypoints[name as keyof typeof smoothed.keypoints] = prevPoint;
        continue;
      }

      // OTTIMIZZAZIONE 3: Velocity-Adaptive Smoothing
      // Se ti muovi velocemente -> smoothing leggero (più reattivo)
      // Se ti muovi lentamente -> smoothing aggressivo (più stabile)
      let adaptiveFactor = cfg.smoothingFactor;

      if (cfg.velocityAdaptive) {
        // Normalizza velocity: 0.0-0.05 -> smoothing 0.2-0.6
        const velocityNormalized = Math.min(velocity / 0.05, 1.0);
        // Movimento lento = smoothing basso (0.2), movimento veloce = smoothing alto (0.6)
        adaptiveFactor = 0.2 + (velocityNormalized * 0.4);
      }

      // EMA con smoothing adattivo
      smoothed.keypoints[name as keyof typeof smoothed.keypoints] = {
        x: adaptiveFactor * point.x + (1 - adaptiveFactor) * prevPoint.x,
        y: adaptiveFactor * point.y + (1 - adaptiveFactor) * prevPoint.y,
        confidence: point.confidence,
      };
    }

    previousPose.current = smoothed;
    return smoothed;
  };

  const reset = () => {
    previousPose.current = null;
    velocities.current.clear();
  };

  return { smoothPose, reset };
};
