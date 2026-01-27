import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { colors } from '../theme';

interface Tab {
  id: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface TabChipsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabChips: React.FC<TabChipsProps> = ({ tabs, activeTab, onTabChange }) => {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const segmentWidth = containerWidth / tabs.length;

  React.useEffect(() => {
    if (containerWidth > 0) {
      const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

      Animated.spring(translateX, {
        toValue: activeIndex * segmentWidth,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  }, [activeTab, containerWidth, tabs, segmentWidth, translateX]);

  return (
    <View style={styles.container}>
      <View style={styles.switcherContainer} onLayout={handleLayout}>
        {/* Background animato */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              styles.activeBackground,
              {
                width: segmentWidth - 12,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {/* Tabs */}
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => {
              haptics.light();
              onTabChange(tab.id);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {tab.icon && (
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.id ? colors.white : colors.gray500}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
  },
  activeBackground: {
    position: 'absolute',
    backgroundColor: colors.black,
    borderRadius: 13,
    top: 6,
    bottom: 6,
    left: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gray500,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: colors.white,
  },
});
