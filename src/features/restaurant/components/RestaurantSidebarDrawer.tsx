// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  OwnerDashboardIcon,
  OwnerOrdersIcon,
  OwnerMenuIcon,
  OwnerSettingsIcon,
  OwnerLogoutIcon,
} from './RestaurantSidebarIcons';

interface RestaurantSidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  restaurantName?: string;
}

export const RestaurantSidebarDrawer: React.FC<RestaurantSidebarDrawerProps> = ({
  visible,
  onClose,
  activeTab,
  onSelectTab,
  onLogout,
  restaurantName = 'Cravingza Restaurant Partner',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: OwnerDashboardIcon },
    { id: 'orders', label: 'Live Orders', Icon: OwnerOrdersIcon },
    { id: 'menu', label: 'Food Menu', Icon: OwnerMenuIcon },
    { id: 'settings', label: 'Store Settings', Icon: OwnerSettingsIcon },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.drawerContent}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'bottom']}>
            {/* Header: restaurantAdmin Branding */}
            <View style={styles.drawerHeader}>
              <View style={styles.brandingBox}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>🏪 PARTNER PORTAL</Text>
                </View>
                <Text style={styles.brandTitle}>restaurantAdmin</Text>
                <Text style={styles.restaurantSubText} numberOfLines={1}>
                  {restaurantName}
                </Text>
              </View>
            </View>

            {/* Navigation Tabs List */}
            <ScrollView style={styles.navSection} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>NAVIGATION MENU</Text>

              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.Icon;
                const activeColor = '#EA580C';
                const inactiveColor = '#475569';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.navBtn, isActive && styles.navBtnActive]}
                    onPress={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <IconComponent
                      color={isActive ? activeColor : inactiveColor}
                      size={20}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicatorDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Bottom Logout Area */}
            <View style={styles.footerArea}>
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
                <OwnerLogoutIcon color="#DC2626" size={20} />
                <Text style={styles.logoutBtnText}>Logout Partner Account</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContent: {
    width: '78%',
    maxWidth: 310,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  drawerHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF7ED',
  },
  brandingBox: {
    gap: 4,
  },
  badgePill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: '900',
    color: '#9A3412',
    letterSpacing: -0.5,
  },
  restaurantSubText: {
    fontSize: FONT_SIZE.xs,
    color: '#475569',
    fontWeight: '600',
  },
  navSection: {
    flex: 1,
    paddingHorizontal: SPACING.sm + 2,
    paddingTop: SPACING.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs + 2,
    paddingHorizontal: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
  },
  navBtnActive: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  navLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  navLabelActive: {
    fontWeight: '800',
    color: '#C2410C',
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  footerArea: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#DC2626',
  },
});
