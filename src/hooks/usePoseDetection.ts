import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { VisionCameraProxy } from 'react-native-vision-camera';
import type { Camera } from 'react-native-vision-camera';
import type { Pose } from '../types/pose';
import { parsePoseOutput } from '../utils/poseParser';
import MediaPipePose from '../modules/MediaPipePose';
import { usePoseSmoothing } from './usePoseSmoothing';

/**
 * Hook per rilevamento pose in tempo reale usando Frame Processor.
 *
 * Pattern: Fire & Poll
 * - Frame Processor "spara" frame al plugin nativo (non aspetta risposta)
 * - JS thread fa polling ogni ~33ms per recuperare l'ultimo risultato
 *
 * Performance target: 20-30 FPS con latenza ~50-70ms
 *
 * @param isActive - Se false, il processing viene fermato
 */
export const usePoseDetection = (isActive: boolean = true) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // Tracking per FPS e latenza
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const lastResultTimestampRef = useRef(0);
  const latencySamplesRef = useRef<number[]>([]);

  // Flag per evitare race condition
  const isPollingRef = useRef(false);

  // Smoothing
  const { smoothPose } = usePoseSmoothing(0.5, {
    minConfidence: 0.3,
    deadZoneThreshold: 0.01,
    velocityAdaptive: true,
  });

  // Inizializza il plugin Frame Processor
  const plugin = useRef(
    VisionCameraProxy.initFrameProcessorPlugin('detectPose', {})
  );

  // Inizializza MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        console.log('🚀 [Frame Processor] Inizializzazione MediaPipe...');
        const success = await MediaPipePose.initialize();

        if (success) {
          setIsModelLoaded(true);
          console.log('✅ [Frame Processor] MediaPipe inizializzato');
        } else {
          console.error('❌ [Frame Processor] Inizializzazione fallita');
        }
      } catch (error) {
        console.error('❌ [Frame Processor] Errore inizializzazione:', error);
      }
    };

    initMediaPipe();
  }, []);

  // Frame Processor: "Fire and Forget"
  // Invia frame al plugin nativo, non aspetta risposta
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      // Chiama il plugin nativo
      // Il plugin elabora il frame e salva il risultato nello stato condiviso
      // Non ritorna nulla di utile - usiamo polling per recuperare i dati
      if (plugin.current) {
        try {
          plugin.current.call(frame, {});
        } catch (e) {
          // Ignora errori nel worklet
        }
      }
    },
    [plugin.current]
  );

  // Ref per smoothPose per evitare re-render del polling loop
  const smoothPoseRef = useRef(smoothPose);
  smoothPoseRef.current = smoothPose;

  // Ref per imageDimensions per evitare re-render
  const imageDimensionsRef = useRef(imageDimensions);
  imageDimensionsRef.current = imageDimensions;

  // Polling loop: recupera risultati dal modulo nativo
  useEffect(() => {
    if (!isModelLoaded || !isActive) return;

    console.log('🔄 [Poll] Avvio polling loop...');

    const pollForResults = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const result = await MediaPipePose.getLastResult();

        if (result && result.landmarks && result.landmarks.length > 0) {
          // Evita di processare lo stesso risultato due volte
          const resultTimestamp = (result as any).timestamp || 0;
          if (resultTimestamp <= lastResultTimestampRef.current) {
            isPollingRef.current = false;
            return;
          }
          lastResultTimestampRef.current = resultTimestamp;

          // Calcola latenza
          const processingTime = (result as any).processingTime || 0;
          if (processingTime > 0) {
            latencySamplesRef.current.push(processingTime);
            if (latencySamplesRef.current.length > 30) {
              latencySamplesRef.current.shift();
            }
            const avgLatency = Math.round(
              latencySamplesRef.current.reduce((a, b) => a + b, 0) /
                latencySamplesRef.current.length
            );
            setLatency(avgLatency);
          }

          // Calcola FPS
          frameCountRef.current++;
          const now = Date.now();
          if (now - lastFpsTimeRef.current >= 1000) {
            const currentFps = Math.round(
              (frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)
            );
            setFps(currentFps);
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }

          // Converti al formato Pose
          const detectedPose = parsePoseOutput(
            result,
            result.imageWidth,
            result.imageHeight
          );

          // Aggiorna dimensioni immagine (usando ref per evitare loop)
          const currentDimensions = imageDimensionsRef.current;
          if (
            !currentDimensions ||
            currentDimensions.width !== result.imageWidth ||
            currentDimensions.height !== result.imageHeight
          ) {
            setImageDimensions({
              width: result.imageWidth,
              height: result.imageHeight,
            });
          }

          // Applica smoothing e aggiorna stato (usando ref)
          const smoothedPose = smoothPoseRef.current(detectedPose);
          setPose(smoothedPose);
        }
      } catch (error) {
        // Ignora errori di polling (possono capitare durante cleanup)
      } finally {
        isPollingRef.current = false;
      }
    };

    // Polling a 30Hz (ogni 33ms)
    const interval = setInterval(pollForResults, 33);

    return () => {
      console.log('🛑 [Poll] Stop polling loop');
      clearInterval(interval);
    };
  }, [isModelLoaded, isActive]); // Rimosso smoothPose e imageDimensions dalla dependency array

  return {
    cameraRef,
    pose,
    fps,
    latency,
    isModelLoaded,
    imageDimensions,
    frameProcessor, // Da passare alla Camera
  };
};
