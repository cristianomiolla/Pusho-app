import type { Keypoint } from '../types/pose';

export const calculateAngle = (
  point1: Keypoint,
  vertex: Keypoint,
  point2: Keypoint
): number => {
  'worklet';

  // Calcola vettori
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
  };

  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y,
  };

  // Calcola angolo usando prodotto scalare
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
  const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
  const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

  const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
};

