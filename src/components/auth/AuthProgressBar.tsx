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
  return (
    <View style={styles.container}>
      <View style={styles.segmentsRow}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;

          return (
            <View
              key={index}
              style={[
                styles.segment,
                isCompleted ? styles.segmentCompleted : styles.segmentIncomplete,
                index < totalSteps - 1 && styles.segmentMargin,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
  },
  segmentCompleted: {
    backgroundColor: colors.gray900,
  },
  segmentIncomplete: {
    backgroundColor: colors.gray200,
  },
  segmentMargin: {
    marginRight: 8,
  },
});
