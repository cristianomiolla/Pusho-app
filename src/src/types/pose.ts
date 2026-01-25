export interface Keypoint {
  x: number; // 0-1 (normalizzato rispetto alla larghezza frame)
  y: number; // 0-1 (normalizzato rispetto all'altezza frame)
  confidence: number; // 0-1
}

export interface Pose {
  keypoints: {
    nose: Keypoint;
    leftEye: Keypoint;
    rightEye: Keypoint;
    leftEar: Keypoint;
    rightEar: Keypoint;
    leftShoulder: Keypoint;
    rightShoulder: Keypoint;
    leftElbow: Keypoint;
    rightElbow: Keypoint;
    leftWrist: Keypoint;
    rightWrist: Keypoint;
    leftHip: Keypoint;
    rightHip: Keypoint;
    leftKnee: Keypoint;
    rightKnee: Keypoint;
    leftAnkle: Keypoint;
    rightAnkle: Keypoint;
  };
}

export const KEYPOINT_NAMES = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
] as const;
