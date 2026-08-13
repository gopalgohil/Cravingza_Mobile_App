// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { RestaurantSidebarDrawer } from '../components/RestaurantSidebarDrawer';
import { OwnerDashboardTab } from './OwnerDashboardTab';
import { OwnerOrdersTab } from './OwnerOrdersTab';
import { OwnerMenuTab } from './OwnerMenuTab';
import { OwnerSettingsTab } from './OwnerSettingsTab';
import {
  OwnerDashboardIcon,
  OwnerOrdersIcon,
  OwnerMenuIcon,
  OwnerSettingsIcon,
} from '../components/RestaurantSidebarIcons';

export const RestaurantOwnerLayoutScreen = ({ navigation }: any) => {
  const { currentUser, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>(
    currentUser?.restaurantName || currentUser?.restaurant || 'Punjabi Dhaba & Grill'
  );

  React.useEffect(() => {
    const fetchOwnerRestaurantDetails = async () => {
      try {
        const res = await getOwnerDashboardStatsApi();
        const name = res?.data?.restaurantName || res?.restaurantName || res?.data?.name || res?.name;
        if (name) {
          setRestaurantName(name);
        }
      } catch (e) {}
    };
    fetchOwnerRestaurantDetails();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Logout from Restaurant Partner Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout 🚪',
        style: 'destructive',
        onPress: () => {
          authLogout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'orders':
        return 'Live Orders';
      case 'menu':
        return 'Food Menu';
      case 'settings':
        return 'Store Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'orders':
        return <OwnerOrdersTab />;
      case 'menu':
        return <OwnerMenuTab />;
      case 'settings':
        return <OwnerSettingsTab />;
      default:
        return <OwnerDashboardTab onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top App Header with Left Hamburger Drawer Icon & restaurantAdmin Title */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.menuIconBtn} onPress={() => setIsDrawerOpen(true)}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.portalLabel}>restaurantAdmin • {restaurantName}</Text>
            <Text style={styles.currentTabLabel}>{getHeaderTitle()}</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Dynamic Tab Screen Component */}
        <View style={styles.contentArea}>{renderCurrentTab()}</View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomTabBar}>
          {[
            { id: 'dashboard', label: 'Dashboard', Icon: OwnerDashboardIcon },
            { id: 'orders', label: 'Orders', Icon: OwnerOrdersIcon },
            { id: 'menu', label: 'Menu', Icon: OwnerMenuIcon },
            { id: 'settings', label: 'Settings', Icon: OwnerSettingsIcon },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.Icon;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <IconComponent color={isActive ? '#EA580C' : '#64748B'} size={20} />
                <Text style={[styles.tabBtnLabel, isActive && styles.tabBtnLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Left Side Slide-out Drawer Component */}
        <RestaurantSidebarDrawer
          visible={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onLogout={handleLogout}
          restaurantName={restaurantName}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  menuIconText: {
    fontSize: 20,
    color: '#EA580C',
    fontWeight: '800',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  currentTabLabel: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  contentArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
});
