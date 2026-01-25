import type { Pose, Keypoint } from '../types/pose';

// MediaPipe/ML Kit restituiscono 33 landmarks, ma noi ne usiamo solo 17
// Mappatura indici -> nostri nomi keypoint
const KEYPOINT_MAPPING: { [key: string]: number } = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

interface PoseLandmark {
  x: number; // normalizzato 0-1
  y: number; // normalizzato 0-1
  z?: number; // profondità (opzionale)
  inFrameLikelihood?: number; // confidenza (0-1)
}

interface DetectedPose {
  landmarks: PoseLandmark[];
}

/**
 * Converte l'output di MediaPipe/ML Kit nel formato Pose usato dall'app
 */
export const parsePoseOutput = (
  detectedPose: DetectedPose,
  frameWidth: number,
  frameHeight: number
): Pose => {
  'worklet';

  const keypoints: any = {};

  // Le coordinate arrivano GIÀ NORMALIZZATE (0-1) dal modulo Android
  // Non dobbiamo più dividerle per frameWidth/frameHeight
  for (const [name, mlkitIndex] of Object.entries(KEYPOINT_MAPPING)) {
    const landmark = detectedPose.landmarks[mlkitIndex];

    if (landmark) {
      keypoints[name] = {
        x: landmark.x, // già normalizzato 0-1
        y: landmark.y, // già normalizzato 0-1
        confidence: landmark.inFrameLikelihood ?? 0,
      } as Keypoint;
    } else {
      // Fallback se il landmark non esiste
      keypoints[name] = {
        x: 0,
        y: 0,
        confidence: 0,
      } as Keypoint;
    }
  }

  return { keypoints } as Pose;
};

