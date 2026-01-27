import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '../utils/haptics';

interface SlideToStopProps {
  onStop: () => void;
}

const SLIDE_THRESHOLD = 0.7; // 70% dello slider per confermare

export const SlideToStop: React.FC<SlideToStopProps> = ({ onStop }) => {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth - 80; // padding laterale
  const maxSlide = containerWidth - 80; // larghezza slider - larghezza thumb

  const slideAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Ferma qualsiasi animazione in corso
        slideAnim.stopAnimation();
        backgroundAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(0, Math.min(gestureState.dx, maxSlide));
        const progress = newValue / maxSlide;

        // Usa setValue per movimento fluido 1:1 con il dito
        slideAnim.setValue(newValue);
        backgroundAnim.setValue(progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        const slideDistance = gestureState.dx;
        const slidePercentage = slideDistance / maxSlide;

        if (slidePercentage >= SLIDE_THRESHOLD) {
          // Slide completato: conferma stop con vibrazione
          haptics.success();

          // Anima fino alla fine
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: maxSlide,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.timing(backgroundAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Callback dopo animazione
            setTimeout(onStop, 100);
          });
        } else {
          // Slide non completato: ritorna indietro senza vibrazione
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 8,
            }),
            Animated.timing(backgroundAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        // Se il gesture viene interrotto, ritorna alla posizione iniziale
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }),
          Animated.timing(backgroundAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      },
    })
  ).current;

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 59, 48, 0.2)', 'rgba(255, 59, 48, 0.9)'],
  });

  const textOpacity = backgroundAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sliderTrack, { backgroundColor }]}>
        <Animated.Text style={[styles.sliderText, { opacity: textOpacity }]}>
          {t('workout.slideToStop')}
        </Animated.Text>

        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <MaterialCommunityIcons name="stop" size={28} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  sliderTrack: {
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  sliderText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sliderThumb: {
    position: 'absolute',
    left: 5,
    width: 70,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
