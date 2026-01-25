import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ModernCard: React.FC<ModernCardProps> = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BDEEE7',
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
});
