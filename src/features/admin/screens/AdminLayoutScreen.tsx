// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { AdminSidebarDrawer } from '../components/AdminSidebarDrawer';

// Separate Tab Components
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminApprovalsTab } from './AdminApprovalsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminSettingsTab } from './AdminSettingsTab';

export const AdminLayoutScreen = ({ navigation }: any) => {
  const { user, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Logout from Super Admin Portal?', [
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
      case 'approvals':
        return 'Approvals';
      case 'users':
        return 'User Management';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Platform Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top App Header with Left Hamburger Drawer Icon & SuperAdmin Badge */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.menuIconBtn} onPress={() => setIsDrawerOpen(true)}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.superAdminLabel}>superAdmin</Text>
            <Text style={styles.currentTabLabel}>{getHeaderTitle()}</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Dynamic Tab Screen Component */}
        <View style={styles.bodyContent}>
          {activeTab === 'dashboard' && <AdminDashboardTab onNavigateTab={(t) => setActiveTab(t)} />}
          {activeTab === 'approvals' && <AdminApprovalsTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'analytics' && <AdminAnalyticsTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
        </View>

        {/* 🔹 BOTTOM TAB NAVIGATION BAR */}
        <View style={styles.bottomTabBar}>
          {/* 1. Dashboard */}
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'dashboard' ? '#C2410C' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="3" width="7" height="7" rx="1" />
              <Rect x="14" y="3" width="7" height="7" rx="1" />
              <Rect x="14" y="14" width="7" height="7" rx="1" />
              <Rect x="3" y="14" width="7" height="7" rx="1" />
            </Svg>
            <Text style={[styles.tabBarLabel, activeTab === 'dashboard' && styles.tabBarLabelActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          {/* 2. Approvals */}
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab('approvals')}
            activeOpacity={0.8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'approvals' ? '#C2410C' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <Path d="M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z" />
              <Path d="M9 12l2 2 4-4" />
            </Svg>
            <Text style={[styles.tabBarLabel, activeTab === 'approvals' && styles.tabBarLabelActive]}>
              Approvals
            </Text>
          </TouchableOpacity>

          {/* 3. User */}
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab('users')}
            activeOpacity={0.8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'users' ? '#C2410C' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <Circle cx="9" cy="7" r="4" />
              <Path d="M23 21v-2a4 4 0 00-3-3.87" />
              <Path d="M16 3.13a4 4 0 010 7.75" />
            </Svg>
            <Text style={[styles.tabBarLabel, activeTab === 'users' && styles.tabBarLabelActive]}>
              User
            </Text>
          </TouchableOpacity>

          {/* 4. Analytics */}
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab('analytics')}
            activeOpacity={0.8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'analytics' ? '#C2410C' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M23 6l-9.5 9.5-5-5L1 18" />
              <Path d="M17 6h6v6" />
            </Svg>
            <Text style={[styles.tabBarLabel, activeTab === 'analytics' && styles.tabBarLabelActive]}>
              Analytics
            </Text>
          </TouchableOpacity>

          {/* 5. Settings */}
          <TouchableOpacity
            style={styles.tabBarItem}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'settings' ? '#C2410C' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="3" />
              <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </Svg>
            <Text style={[styles.tabBarLabel, activeTab === 'settings' && styles.tabBarLabelActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Slide-out Left Sidebar Drawer Component */}
        <AdminSidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onLogout={handleLogout}
          onNavigateCustomerSite={() => navigation.navigate('Home')}
          adminName={user?.name || 'superAdmin'}
          adminEmail={user?.email || 'admin@cravingza.com'}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  superAdminLabel: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'lowercase',
  },
  currentTabLabel: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: -2,
  },
  bodyContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  tabBarLabelActive: {
    fontWeight: '800',
    color: '#C2410C',
  },
});
