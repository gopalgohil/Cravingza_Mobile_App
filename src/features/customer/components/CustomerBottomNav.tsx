// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../../utils/theme';

export interface CustomerBottomNavProps {
  activeTab: 'Home' | 'Offers' | 'Orders' | 'Profile';
  navigation: any;
}

const renderNavIcon = (name: string, active: boolean) => {
  const color = active ? COLORS.primary : '#94A3B8';
  const size = 22;

  switch (name) {
    case 'Home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <Path d="M9 22V12h6v10" fill={active ? '#FFF' : 'none'} />
        </Svg>
      );
    case 'Offers':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <Circle cx="7" cy="7" r="1.5" fill={active ? '#FFF' : color} />
        </Svg>
      );
    case 'Orders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <Path d="M3 6h18" />
          <Path d="M16 10a4 4 0 01-8 0" />
        </Svg>
      );
    case 'Profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    default:
      return null;
  }
};

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  activeTab,
  navigation,
}) => {
  const tabs = ['Home', 'Offers', 'Orders', 'Profile'];

  const handleTabPress = (tabName: string) => {
    if (tabName === activeTab) return;
    navigation.navigate(tabName);
  };

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tabName) => {
        const isActive = activeTab === tabName;
        return (
          <TouchableOpacity
            key={tabName}
            style={styles.navItem}
            onPress={() => handleTabPress(tabName)}
            activeOpacity={0.7}
          >
            <View style={styles.navIconContainer}>
              {renderNavIcon(tabName, isActive)}
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tabName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
