import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface AuthProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

export const AuthProgressBar: React.FC<AuthProgressBarProps> = ({
  currentStep,
  totalSteps,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.gray900} />
          </TouchableOpacity>
        )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  segmentsRow: {
    flex: 1,
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
