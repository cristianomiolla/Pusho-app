import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

// Import all spritesheet frames
const frames = [
  require('../../assets/spritesheet/ezgif-frame-001.png'),
  require('../../assets/spritesheet/ezgif-frame-002.png'),
  require('../../assets/spritesheet/ezgif-frame-003.png'),
  require('../../assets/spritesheet/ezgif-frame-004.png'),
  require('../../assets/spritesheet/ezgif-frame-005.png'),
  require('../../assets/spritesheet/ezgif-frame-006.png'),
  require('../../assets/spritesheet/ezgif-frame-007.png'),
  require('../../assets/spritesheet/ezgif-frame-008.png'),
  require('../../assets/spritesheet/ezgif-frame-009.png'),
  require('../../assets/spritesheet/ezgif-frame-010.png'),
  require('../../assets/spritesheet/ezgif-frame-011.png'),
  require('../../assets/spritesheet/ezgif-frame-012.png'),
  require('../../assets/spritesheet/ezgif-frame-013.png'),
  require('../../assets/spritesheet/ezgif-frame-014.png'),
  require('../../assets/spritesheet/ezgif-frame-015.png'),
  require('../../assets/spritesheet/ezgif-frame-016.png'),
  require('../../assets/spritesheet/ezgif-frame-017.png'),
  require('../../assets/spritesheet/ezgif-frame-018.png'),
  require('../../assets/spritesheet/ezgif-frame-019.png'),
  require('../../assets/spritesheet/ezgif-frame-020.png'),
  require('../../assets/spritesheet/ezgif-frame-021.png'),
  require('../../assets/spritesheet/ezgif-frame-022.png'),
  require('../../assets/spritesheet/ezgif-frame-023.png'),
  require('../../assets/spritesheet/ezgif-frame-024.png'),
  require('../../assets/spritesheet/ezgif-frame-025.png'),
  require('../../assets/spritesheet/ezgif-frame-026.png'),
  require('../../assets/spritesheet/ezgif-frame-027.png'),
  require('../../assets/spritesheet/ezgif-frame-028.png'),
  require('../../assets/spritesheet/ezgif-frame-029.png'),
  require('../../assets/spritesheet/ezgif-frame-030.png'),
  require('../../assets/spritesheet/ezgif-frame-031.png'),
  require('../../assets/spritesheet/ezgif-frame-032.png'),
  require('../../assets/spritesheet/ezgif-frame-033.png'),
  require('../../assets/spritesheet/ezgif-frame-034.png'),
  require('../../assets/spritesheet/ezgif-frame-035.png'),
  require('../../assets/spritesheet/ezgif-frame-036.png'),
  require('../../assets/spritesheet/ezgif-frame-037.png'),
  require('../../assets/spritesheet/ezgif-frame-038.png'),
  require('../../assets/spritesheet/ezgif-frame-039.png'),
  require('../../assets/spritesheet/ezgif-frame-040.png'),
  require('../../assets/spritesheet/ezgif-frame-041.png'),
  require('../../assets/spritesheet/ezgif-frame-042.png'),
  require('../../assets/spritesheet/ezgif-frame-043.png'),
  require('../../assets/spritesheet/ezgif-frame-044.png'),
  require('../../assets/spritesheet/ezgif-frame-045.png'),
  require('../../assets/spritesheet/ezgif-frame-046.png'),
  require('../../assets/spritesheet/ezgif-frame-047.png'),
  require('../../assets/spritesheet/ezgif-frame-048.png'),
  require('../../assets/spritesheet/ezgif-frame-049.png'),
  require('../../assets/spritesheet/ezgif-frame-050.png'),
  require('../../assets/spritesheet/ezgif-frame-051.png'),
  require('../../assets/spritesheet/ezgif-frame-052.png'),
  require('../../assets/spritesheet/ezgif-frame-053.png'),
  require('../../assets/spritesheet/ezgif-frame-054.png'),
  require('../../assets/spritesheet/ezgif-frame-055.png'),
  require('../../assets/spritesheet/ezgif-frame-056.png'),
  require('../../assets/spritesheet/ezgif-frame-057.png'),
  require('../../assets/spritesheet/ezgif-frame-058.png'),
  require('../../assets/spritesheet/ezgif-frame-059.png'),
  require('../../assets/spritesheet/ezgif-frame-060.png'),
  require('../../assets/spritesheet/ezgif-frame-061.png'),
  require('../../assets/spritesheet/ezgif-frame-062.png'),
  require('../../assets/spritesheet/ezgif-frame-063.png'),
  require('../../assets/spritesheet/ezgif-frame-064.png'),
  require('../../assets/spritesheet/ezgif-frame-065.png'),
  require('../../assets/spritesheet/ezgif-frame-066.png'),
  require('../../assets/spritesheet/ezgif-frame-067.png'),
  require('../../assets/spritesheet/ezgif-frame-068.png'),
  require('../../assets/spritesheet/ezgif-frame-069.png'),
  require('../../assets/spritesheet/ezgif-frame-070.png'),
  require('../../assets/spritesheet/ezgif-frame-071.png'),
  require('../../assets/spritesheet/ezgif-frame-072.png'),
  require('../../assets/spritesheet/ezgif-frame-073.png'),
  require('../../assets/spritesheet/ezgif-frame-074.png'),
  require('../../assets/spritesheet/ezgif-frame-075.png'),
  require('../../assets/spritesheet/ezgif-frame-076.png'),
  require('../../assets/spritesheet/ezgif-frame-077.png'),
  require('../../assets/spritesheet/ezgif-frame-078.png'),
  require('../../assets/spritesheet/ezgif-frame-079.png'),
  require('../../assets/spritesheet/ezgif-frame-080.png'),
];

interface SpriteAnimationProps {
  fps?: number;
  style?: ViewStyle;
  width?: number;
  height?: number;
}

export const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
  fps = 24,
  style,
  width = 300,
  height = 300,
}) => {
  // Double buffer approach: two images that alternate
  const [bufferA, setBufferA] = useState(0);
  const [bufferB, setBufferB] = useState(1);
  const [showA, setShowA] = useState(true);
  const frameRef = useRef(0);
  const frameInterval = 1000 / fps;

  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames.length;
      const nextFrame = (frameRef.current + 1) % frames.length;

      if (showA) {
        setBufferB(frameRef.current);
        // Preload next frame in A
        setBufferA(nextFrame);
      } else {
        setBufferA(frameRef.current);
        // Preload next frame in B
        setBufferB(nextFrame);
      }
      setShowA(!showA);
    }, frameInterval);

    return () => clearInterval(interval);
  }, [frameInterval, showA]);

  const imageStyle = { width, height };

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={frames[bufferA]}
        style={[styles.frame, imageStyle, { opacity: showA ? 1 : 0 }]}
        resizeMode="contain"
        fadeDuration={0}
      />
      <Image
        source={frames[bufferB]}
        style={[styles.frame, imageStyle, { opacity: showA ? 0 : 1 }]}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    position: 'absolute',
  },
});
