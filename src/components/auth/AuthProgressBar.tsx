import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface AuthProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const AuthProgressBar: React.FC<AuthProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  track: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
