import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

interface LockedFeatureSectionProps {
  children: React.ReactNode;
}

export const LockedFeatureSection: React.FC<LockedFeatureSectionProps> = ({
  children,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Contenuto originale */}
      <View style={styles.contentWrapper}>
        {children}
      </View>

      {/* Overlay bloccato */}
      <View style={styles.overlay}>
        <View style={styles.lockBadge}>
          <MaterialCommunityIcons name="lock" size={24} color={colors.black} />
          <Text style={styles.lockText}>{t('community.comingSoon')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  contentWrapper: {
    opacity: 0.4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lockText: {
    fontSize: 18,
    fontFamily: 'Agdasima-Bold',
    color: colors.black,
    letterSpacing: 0.3,
  },
});
