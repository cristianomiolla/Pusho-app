import { NativeModules, Platform } from 'react-native';

interface MediaPipePoseModule {
  /**
   * Inizializza MediaPipe Pose Landmarker
   * Deve essere chiamato una volta all'avvio dell'app
   */
  initialize(): Promise<boolean>;

  /**
   * Rileva pose da file immagine
   * @param filePath - Path assoluto del file immagine
   * @param timestampMs - Timestamp in millisecondi (per VIDEO mode)
   */
  detectPoseFromFile(filePath: string, timestampMs: number): Promise<MediaPipePoseResult>;

  // ============================================
  // FIRE & POLL PATTERN - Metodi per Frame Processor
  // ============================================

  /**
   * Restituisce l'ultimo risultato elaborato dal Frame Processor.
   * Usato in polling dal JS thread.
   */
  getLastResult(): Promise<MediaPipePoseResult | null>;

  /**
   * Verifica se il Frame Processor è pronto per l'uso
   */
  isFrameProcessorReady(): Promise<boolean>;
}

interface MediaPipePoseResult {
  landmarks: MediaPipeLandmark[];
  imageWidth: number;
  imageHeight: number;
}

interface MediaPipeLandmark {
  x: number; // Coordinata normalizzata 0-1
  y: number; // Coordinata normalizzata 0-1
  z: number; // Profondità relativa
  inFrameLikelihood: number; // Confidenza/visibility 0-1
}

const { MediaPipePose } = NativeModules;

// Flag per verificare se il modulo è disponibile
export const isMediaPipePoseAvailable = !!MediaPipePose;

// Se il modulo non è disponibile, logga un warning invece di crashare
if (!MediaPipePose) {
  console.warn(
    `MediaPipePose native module not found on ${Platform.OS}. ` +
    'Pose detection features will not work. ' +
    (Platform.OS === 'android'
      ? 'Make sure you have run "cd android && ./gradlew clean" and rebuilt the app.'
      : 'Make sure the native module is included in the iOS build.')
  );
}

// Crea un mock per evitare crash quando il modulo non è disponibile
const MediaPipePoseMock: MediaPipePoseModule = {
  initialize: async () => {
    console.warn('MediaPipePose not available - initialize() called on mock');
    return false;
  },
  detectPoseFromFile: async () => {
    console.warn('MediaPipePose not available - detectPoseFromFile() called on mock');
    return { landmarks: [], imageWidth: 0, imageHeight: 0 };
  },
  getLastResult: async () => {
    return null;
  },
  isFrameProcessorReady: async () => {
    return false;
  },
};

export default (MediaPipePose || MediaPipePoseMock) as MediaPipePoseModule;
export type { MediaPipePoseResult, MediaPipeLandmark };
