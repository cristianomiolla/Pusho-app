import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Location, CommunityPeriod, LocationRadius } from '../../types/community';
import { haptics } from '../../utils/haptics';

interface HeaderLocationProps {
  location: Location;
  period: CommunityPeriod;
  radius: LocationRadius;
  onChangeArea: () => void;
  onChangePeriod: (period: CommunityPeriod) => void;
}

export const HeaderLocation: React.FC<HeaderLocationProps> = ({
  location,
  period,
  radius,
  onChangeArea,
  onChangePeriod,
}) => {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(0);

  const PERIOD_LABELS: Record<CommunityPeriod, string> = {
    today: t('community.today'),
    week: t('community.week'),
    month: t('community.month'),
  };
  const translateX = useRef(new Animated.Value(0)).current;

  const periods: CommunityPeriod[] = ['today', 'week', 'month'];
  const segmentWidth = containerWidth / periods.length;

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  // Anima il background quando cambia il periodo
  useEffect(() => {
    if (containerWidth > 0) {
      const activeIndex = periods.findIndex(p => p === period);

      Animated.spring(translateX, {
        toValue: activeIndex * segmentWidth,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  }, [period, containerWidth, segmentWidth, translateX, periods]);

  return (
    <View style={styles.container}>
      {/* Location e Periodo */}
      <View style={styles.locationRow}>
        <View style={styles.locationInfo}>
          <View style={styles.cityRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#BDEEE7" />
            <Text style={styles.cityText}>{location.city}</Text>
          </View>
        </View>

        {/* CTA Cambia Area - Disabilitato (coming soon) */}
        <View style={styles.changeButtonDisabled}>
          <Text style={styles.changeButtonTextDisabled}>{t('community.comingSoon')}</Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector} onLayout={handleLayout}>
        {/* Background animato */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.periodActiveBackground,
              {
                width: segmentWidth - 8,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {/* Bottoni */}
        {periods.map((p) => (
          <TouchableOpacity
            key={p}
            style={styles.periodChip}
            onPress={() => {
              haptics.light();
              onChangePeriod(p);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodChipText,
                period === p && styles.periodChipTextActive,
              ]}
            >
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F7',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 28,
    fontFamily: 'Agdasima-Bold',
    color: '#000',
    letterSpacing: 0.3,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#BDEEE7',
    borderRadius: 12,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 0.5,
  },
  changeButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
  },
  changeButtonTextDisabled: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Agdasima-Bold',
    letterSpacing: 0.5,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
  },
  periodActiveBackground: {
    position: 'absolute',
    backgroundColor: '#BDEEE7',
    borderRadius: 10,
    top: 4,
    bottom: 4,
    left: 4,
    shadowColor: '#BDEEE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  periodChipActive: {
    // Stile gestito dal background animato
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.1,
  },
  periodChipTextActive: {
    color: '#000',
  },
});
