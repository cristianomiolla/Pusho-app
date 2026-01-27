import React, { useState, useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Circle, Line, vec } from '@shopify/react-native-skia';
import type { Pose } from '../types/pose';
import { resolveCoordinates, type CoordinateTransformOptions } from '../utils/coordinateUtils';
import { colors } from '../theme';

interface Props {
  pose: Pose;
  imageWidth?: number;
  imageHeight?: number;
  /** Se true, applica mirror orizzontale per front camera (default: true) */
  isFrontCamera?: boolean;
}

// Definisce le connessioni tra keypoints per lo skeleton
const SKELETON_CONNECTIONS = [
  // Busto
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],

  // Braccia
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],

  // Gambe
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
] as const;

const MIN_CONFIDENCE = 0.5; // Soglia minima per visualizzare un keypoint
const MIN_CONFIDENCE_LEGS = 0.65; // Soglia più alta per gambe (MediaPipe tende a "indovinare")

// Keypoints delle gambe che richiedono confidence più alta
const LEG_KEYPOINTS = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];

// Helper per ottenere la soglia corretta per un keypoint
const getMinConfidence = (keypointName: string): number => {
  return LEG_KEYPOINTS.includes(keypointName) ? MIN_CONFIDENCE_LEGS : MIN_CONFIDENCE;
};

export const SkeletonOverlay: React.FC<Props> = ({
  pose,
  imageWidth = 0,
  imageHeight = 0,
  isFrontCamera = true, // Default: front camera
}) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Rileva cambiamenti nelle dimensioni dello schermo
  useEffect(() => {
    const updateDimensions = () => setDimensions(Dimensions.get('window'));

    updateDimensions();
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Opzioni di trasformazione memoizzate
  const transformOptions = useMemo<CoordinateTransformOptions>(() => ({
    screenDims: { width: dimensions.width, height: dimensions.height },
    frameDims: {
      width: imageWidth || dimensions.width,
      height: imageHeight || dimensions.height,
    },
    isFrontCamera,
  }), [dimensions, imageWidth, imageHeight, isFrontCamera]);

  // Funzione per trasformare le coordinate normalizzate (0-1) allo schermo
  // Usa la utility centralizzata per consistenza tra snapshot e frame processor
  const transformPoint = (x: number, y: number) => {
    return resolveCoordinates({ x, y }, transformOptions);
  };

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
      pointerEvents="none"
    >
      {/* Disegna linea del collo: dalla testa al centro delle spalle */}
      {pose.keypoints.nose.confidence > MIN_CONFIDENCE &&
        pose.keypoints.leftShoulder.confidence > MIN_CONFIDENCE &&
        pose.keypoints.rightShoulder.confidence > MIN_CONFIDENCE && (() => {
          const nose = transformPoint(pose.keypoints.nose.x, pose.keypoints.nose.y);
          const leftShoulder = transformPoint(pose.keypoints.leftShoulder.x, pose.keypoints.leftShoulder.y);
          const rightShoulder = transformPoint(pose.keypoints.rightShoulder.x, pose.keypoints.rightShoulder.y);

          // Calcola il punto medio tra le due spalle
          const neckX = (leftShoulder.x + rightShoulder.x) / 2;
          const neckY = (leftShoulder.y + rightShoulder.y) / 2;

          const p1 = vec(nose.x, nose.y);
          const p2 = vec(neckX, neckY);

          return (
            <Line
              key="neck"
              p1={p1}
              p2={p2}
              color={colors.primary}
              style="stroke"
              strokeWidth={4}
            />
          );
        })()}

      {/* Disegna linee dello skeleton con effetto glow */}
      {SKELETON_CONNECTIONS.map(([start, end], index) => {
        const startPoint = pose.keypoints[start];
        const endPoint = pose.keypoints[end];

        // Usa soglia più alta per keypoints delle gambe
        const startMinConf = getMinConfidence(start);
        const endMinConf = getMinConfidence(end);

        if (
          startPoint.confidence < startMinConf ||
          endPoint.confidence < endMinConf
        ) {
          return null;
        }

        const startTransformed = transformPoint(startPoint.x, startPoint.y);
        const endTransformed = transformPoint(endPoint.x, endPoint.y);
        const p1 = vec(startTransformed.x, startTransformed.y);
        const p2 = vec(endTransformed.x, endTransformed.y);

        return (
          <Line
            key={`line-${index}`}
            p1={p1}
            p2={p2}
            color={colors.primary}
            style="stroke"
            strokeWidth={4}
          />
        );
      })}

      {/* Disegna un punto per la testa (usando il naso come riferimento) */}
      {pose.keypoints.nose.confidence > MIN_CONFIDENCE && (() => {
        const transformed = transformPoint(pose.keypoints.nose.x, pose.keypoints.nose.y);
        const cx = transformed.x;
        const cy = transformed.y;

        return (
          <Circle
            key="head"
            cx={cx}
            cy={cy}
            r={6}
            color={colors.primary}
          />
        );
      })()}

      {/* Disegna cerchi sui keypoints del corpo (escludi viso) */}
      {Object.entries(pose.keypoints).map(([name, keypoint]) => {
        // Escludi i keypoint del viso
        if (['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar'].includes(name)) {
          return null;
        }

        // Usa soglia più alta per keypoints delle gambe
        const minConf = getMinConfidence(name);
        if (keypoint.confidence < minConf) {
          return null;
        }

        const transformed = transformPoint(keypoint.x, keypoint.y);
        const cx = transformed.x;
        const cy = transformed.y;

        return (
          <Circle
            key={`point-${name}`}
            cx={cx}
            cy={cy}
            r={6}
            color={colors.primary}
          />
        );
      })}
    </Canvas>
  );
};
