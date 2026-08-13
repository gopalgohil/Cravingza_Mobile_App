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

        {/* Slide-out Left Sidebar Drawer Component */}
        <AdminSidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onLogout={handleLogout}
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
  profileBadgeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  bodyContent: {
    flex: 1,
  },
});
