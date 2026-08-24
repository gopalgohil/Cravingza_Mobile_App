// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  DashboardIcon,
  ApprovalsIcon,
  UserManagementIcon,
  AnalyticsIcon,
  SettingsIcon,
  ModernLogoutIcon,
} from './AdminSidebarIcons';

export interface AdminMenuItem {
  id: string;
  label: string;
}

const MENU_ITEMS: AdminMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'users', label: 'User Management' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

interface AdminSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  adminName?: string;
  adminEmail?: string;
}

export const AdminSidebarDrawer: React.FC<AdminSidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onLogout,
  adminName = 'SuperAdmin',
  adminEmail = 'admin@cravingza.com',
}) => {
  const getTabIcon = (id: string, isActive: boolean) => {
    const iconColor = isActive ? '#9A3412' : '#64748B';
    const iconSize = 20;

    switch (id) {
      case 'dashboard':
        return <DashboardIcon color={iconColor} size={iconSize} />;
      case 'approvals':
        return <ApprovalsIcon color={iconColor} size={iconSize} />;
      case 'users':
        return <UserManagementIcon color={iconColor} size={iconSize} />;
      case 'analytics':
        return <AnalyticsIcon color={iconColor} size={iconSize} />;
      case 'settings':
        return <SettingsIcon color={iconColor} size={iconSize} />;
      default:
        return <DashboardIcon color={iconColor} size={iconSize} />;
    }
  };

  const renderMenuItem = ({ item }: { item: AdminMenuItem }) => {
    const isActive = activeTab === item.id;

    return (
      <TouchableOpacity
        style={[styles.menuItemBtn, isActive && styles.menuItemBtnActive]}
        onPress={() => {
          onSelectTab(item.id);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getTabIcon(item.id, isActive)}
        </View>
        <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop click to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Sliding Left Sidebar Drawer */}
        <View style={styles.drawerContent}>
          {/* Top Header: SuperAdmin */}
          <View style={styles.drawerHeader}>
            <View style={styles.adminAvatarBox}>
              <Text style={styles.adminAvatarText}>SA</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitleText}>SuperAdmin</Text>
              <Text style={styles.adminSubtitleText} numberOfLines={1}>
                {adminEmail}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeDrawerBtn} onPress={onClose}>
              <Text style={styles.closeDrawerText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Sidebar Menu Items List using FlatList */}
          <FlatList
            data={MENU_ITEMS}
            keyExtractor={(item) => item.id}
            renderItem={renderMenuItem}
            contentContainerStyle={styles.menuListPadding}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.divider} />

          {/* Bottom Logout Button with Modern Logout Icon */}
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Logout Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerContent: {
    width: '78%',
    maxWidth: 300,
    backgroundColor: COLORS.white,
    height: '100%',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: 'space-between',
    paddingBottom: SPACING.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  adminAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
  },
  adminAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    color: COLORS.primary,
  },
  adminTitleText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    color: '#0F172A',
  },
  adminSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeDrawerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDrawerText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: SPACING.xs,
  },
  menuListPadding: {
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 14,
    backgroundColor: 'transparent',
  },
  menuItemBtnActive: {
    backgroundColor: '#FFF1F2', // Soft reddish-orange pill background matching exact design!
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '600',
    color: '#334155',
  },
  menuItemTextActive: {
    color: '#9A3412', // Bold red-orange text
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    gap: 12,
    marginTop: 'auto',
  },
  logoutBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#DC2626',
  },
});
