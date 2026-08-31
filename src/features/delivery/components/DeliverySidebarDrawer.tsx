// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

interface DeliverySidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  currentUser?: any;
  isOnline: boolean;
  onToggleOnline: (val: boolean) => void;
}

const renderDrawerNavIcon = (name: string, active: boolean) => {
  const color = active ? '#EA580C' : '#475569';
  const size = 20;

  switch (name) {
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
        </Svg>
      );
    case 'orders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#EA580C' : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <Path d="M3 6h18" />
          <Path d="M16 10a4 4 0 01-8 0" />
        </Svg>
      );
    case 'dboy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#EA580C' : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
      );
    default:
      return null;
  }
};

export const DeliverySidebarDrawer: React.FC<DeliverySidebarDrawerProps> = ({
  visible,
  onClose,
  activeTab,
  onSelectTab,
  onLogout,
  currentUser,
  isOnline,
  onToggleOnline,
}) => {
  const riderName = currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Delivery Partner');
  const riderEmail = currentUser?.email || 'partner@cravingza.com';
  const riderAvatar =
    currentUser?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Live Orders' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.drawerContent}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'bottom']}>
            {/* Header: Rider Info (Avatar, Name, Email) */}
            <View style={styles.drawerHeader}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>🚴 DELIVERY PARTNER PORTAL</Text>
              </View>

              <View style={styles.userCard}>
                <Image source={{ uri: riderAvatar }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.riderName} numberOfLines={1}>
                    {riderName}
                  </Text>
                  <Text style={styles.riderEmail} numberOfLines={1}>
                    {riderEmail}
                  </Text>
                </View>
              </View>

              {/* Duty Toggle inside Sidebar Drawer */}
              <View style={styles.onlineToggleRow}>
                <Text style={styles.dutyLabel}>
                  {isOnline ? '🟢 Duty: ONLINE' : '🔴 Duty: OFFLINE'}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={onToggleOnline}
                  trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
                  thumbColor={isOnline ? '#16A34A' : '#94A3B8'}
                />
              </View>
            </View>

            {/* Navigation Tabs List */}
            <ScrollView style={styles.navSection} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>NAVIGATION MENU</Text>

              {navItems.map((item) => {
                const isActive = activeTab === item.id;
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
                    {renderDrawerNavIcon(item.id, isActive)}
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
                <Text style={styles.logoutBtnText}>Logout Account</Text>
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
    gap: 8,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  riderName: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  riderEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginTop: 4,
  },
  dutyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
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
