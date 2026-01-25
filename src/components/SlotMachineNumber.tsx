import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface SlotMachineNumberProps {
  value: number;
  style?: TextStyle;
  trigger?: number;
  duration?: number;
}

const DIGIT_HEIGHT = 32;
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface DigitColumnProps {
  digit: string;
  delay: number;
  duration: number;
  style?: TextStyle;
  trigger: number;
}

const DigitColumn: React.FC<DigitColumnProps> = ({ digit, delay, duration, style, trigger }) => {
  const translateY = useSharedValue(0);
  const targetDigit = parseInt(digit, 10);

  useEffect(() => {
    // Reset e poi anima
    translateY.value = 0;
    translateY.value = withDelay(
      delay,
      withTiming(-targetDigit * DIGIT_HEIGHT, {
        duration: duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [trigger, targetDigit, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const fontSize = style?.fontSize || 24;
  const dynamicHeight = fontSize * 1.2;

  return (
    <View style={[styles.digitContainer, { height: dynamicHeight }]}>
      <Animated.View style={[styles.digitColumn, animatedStyle]}>
        {DIGITS.map((d) => (
          <View key={d} style={[styles.digitWrapper, { height: DIGIT_HEIGHT }]}>
            <Text style={[styles.digit, style]}>{d}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

export const SlotMachineNumber: React.FC<SlotMachineNumberProps> = ({
  value,
  style,
  trigger = 0,
  duration = 800,
}) => {
  const digits = Math.abs(Math.round(value)).toString().split('');

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <DigitColumn
          key={`${index}-${digits.length}`}
          digit={digit}
          delay={index * 80}
          duration={duration + index * 100}
          style={style}
          trigger={trigger}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitContainer: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  digitColumn: {
    flexDirection: 'column',
  },
  digitWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontSize: 24,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
  },
});
