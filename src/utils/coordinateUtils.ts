/**
 * Utility per la trasformazione delle coordinate da MediaPipe allo schermo.
 *
 * MediaPipe restituisce coordinate normalizzate (0-1).
 * Questo modulo gestisce:
 * - Mirror orizzontale per front camera
 * - Scaling "cover" mode (come CSS background-size: cover)
 * - Offset per il crop
 */

import { Platform } from 'react-native';

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface CoordinateTransformOptions {
  /** Dimensioni dello schermo di rendering */
  screenDims: Dimensions;
  /** Dimensioni del frame della camera (dopo eventuale rotazione) */
  frameDims: Dimensions;
  /** Se true, applica mirror orizzontale (per front camera) */
  isFrontCamera: boolean;
}

/**
 * Trasforma un punto da coordinate normalizzate MediaPipe (0-1)
 * a coordinate pixel dello schermo.
 *
 * @param point - Punto con coordinate x, y normalizzate (0-1)
 * @param options - Opzioni di trasformazione
 * @returns Punto con coordinate pixel per lo schermo
 */
export function resolveCoordinates(
  point: Point,
  options: CoordinateTransformOptions
): Point {
  const { screenDims, frameDims, isFrontCamera } = options;

  // 1. Mirror orizzontale per front camera
  // Su Android: la preview è specchiata, MediaPipe processa l'immagine raw -> dobbiamo specchiare le coordinate
  // Su iOS: VisionCamera presenta la preview specchiata, ma MediaPipe processa l'immagine già orientata
  //         correttamente, quindi NON dobbiamo specchiare le coordinate
  const shouldMirror = isFrontCamera && Platform.OS === 'android';
  let x = shouldMirror ? 1 - point.x : point.x;
  let y = point.y;

  // 2. Cover mode scaling
  // L'immagine viene scalata per riempire lo schermo, croppando l'eccesso
  const scaleX = screenDims.width / frameDims.width;
  const scaleY = screenDims.height / frameDims.height;
  const scale = Math.max(scaleX, scaleY); // "cover" usa il max per riempire

  // 3. Calcola dimensioni dell'immagine scalata
  const scaledWidth = frameDims.width * scale;
  const scaledHeight = frameDims.height * scale;

  // 4. Calcola offset per centrare (parte croppata)
  const xOffset = (scaledWidth - screenDims.width) / 2;
  const yOffset = (scaledHeight - screenDims.height) / 2;

  // 5. Trasforma a coordinate pixel schermo
  return {
    x: x * scaledWidth - xOffset,
    y: y * scaledHeight - yOffset,
  };
}

/**
 * Trasforma un intero set di keypoints.
 * Utility per trasformare tutti i punti di una pose in una volta.
 *
 * @param keypoints - Oggetto con keypoints (ogni valore ha x, y, confidence)
 * @param options - Opzioni di trasformazione
 * @returns Nuovo oggetto con keypoints trasformati
 */
export function resolveAllKeypoints<T extends Record<string, { x: number; y: number; confidence: number }>>(
  keypoints: T,
  options: CoordinateTransformOptions
): T {
  const transformed = {} as T;

  for (const [name, keypoint] of Object.entries(keypoints)) {
    const resolved = resolveCoordinates({ x: keypoint.x, y: keypoint.y }, options);
    (transformed as any)[name] = {
      x: resolved.x,
      y: resolved.y,
      confidence: keypoint.confidence,
    };
  }

  return transformed;
}

/**
 * Calcola se un punto trasformato è visibile sullo schermo.
 *
 * @param point - Punto in coordinate schermo
 * @param screenDims - Dimensioni dello schermo
 * @param margin - Margine di tolleranza (default 50px)
 * @returns true se il punto è visibile
 */
export function isPointVisible(
  point: Point,
  screenDims: Dimensions,
  margin: number = 50
): boolean {
  return (
    point.x >= -margin &&
    point.x <= screenDims.width + margin &&
    point.y >= -margin &&
    point.y <= screenDims.height + margin
  );
}
