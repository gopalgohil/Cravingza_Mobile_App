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
import { OwnerOffersTab } from './OwnerOffersTab';
import { OwnerAnalyticsTab } from './OwnerAnalyticsTab';
import { OwnerReviewsTab } from './OwnerReviewsTab';
import Svg, { Path } from 'react-native-svg';
import { Modal, ScrollView } from 'react-native';
import { getOwnerDashboardStatsApi, getOwnerOrdersApi } from '../services/restaurantOwnerApi';
import { subscribeOrderSync, getSharedOrders } from '../../../services/orderSyncStore';
import {
  OwnerDashboardSkeleton,
  OwnerOrdersSkeleton,
  OwnerMenuSkeleton,
  OwnerSettingsSkeleton,
  OfferCardSkeleton,
} from '../../../components/ui/SkeletonPlaceholder';
import {
  OwnerDashboardIcon,
  OwnerOrdersIcon,
  OwnerMenuIcon,
  OwnerSettingsIcon,
} from '../components/RestaurantSidebarIcons';

export const RestaurantOwnerLayoutScreen = ({ navigation }: any) => {
  const { currentUser, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>(
    currentUser?.restaurantName || currentUser?.restaurant || 'Burger Boss'
  );

  const handleSwitchTab = (tabId: string) => {
    setIsDrawerOpen(false);
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setIsTabChanging(true);
    setTimeout(() => {
      setIsTabChanging(false);
    }, 400);
  };

  // Live Notification States for Restaurant Admin
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [notificationBanner, setNotificationBanner] = useState({
    visible: false,
    title: '',
    message: '',
    time: 'now',
  });

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

  // 🔹 Real-Time Auto-Polling (every 8 seconds) for Incoming Customer Orders
  React.useEffect(() => {
    const knownOrderIds = new Set<string>();
    let isInitialFetch = true;

    const pollIncomingOrders = async () => {
      try {
        const res = await getOwnerOrdersApi();
        const ordList = res?.data || res?.orders || (Array.isArray(res) ? res : []);
        if (Array.isArray(ordList)) {
          if (isInitialFetch) {
            // Record existing orders on initial load so no old orders fire notifications
            ordList.forEach((o: any) => {
              const id = o._id || o.id;
              if (id) knownOrderIds.add(id);
            });
            isInitialFetch = false;
          } else {
            // Check if any genuinely NEW order arrived in the last 8 seconds
            const newOrders = ordList.filter((o: any) => {
              const id = o._id || o.id;
              return id && !knownOrderIds.has(id);
            });

            if (newOrders.length > 0) {
              newOrders.forEach((newOrd: any) => {
                const id = newOrd._id || newOrd.id;
                knownOrderIds.add(id);

                const ordNum =
                  newOrd.orderNumber || `#CRV-${String(id).slice(-4).toUpperCase()}`;
                const custName =
                  newOrd.customer?.name || newOrd.user?.name || newOrd.userName || 'Customer';
                const totalAmt = newOrd.totalAmount || newOrd.totalPrice || 0;

                const notifTitle = `🔔 New Order Received! ${ordNum}`;
                const notifMsg = `${custName} placed an order worth ₹${totalAmt}! Click to accept & prepare.`;

                // Top Push Notification Banner
                setNotificationBanner({
                  visible: true,
                  title: notifTitle,
                  message: notifMsg,
                  time: 'now',
                });

                // Add to Notifications Array for Red Badge Counter & Modal List
                setNotifications((prev) => [
                  {
                    id: `notif_owner_${Date.now()}_${id}`,
                    title: notifTitle,
                    message: notifMsg,
                    time: 'Just now',
                    read: false,
                    orderId: id,
                  },
                  ...prev,
                ]);

                setTimeout(() => {
                  setNotificationBanner((prev) => ({ ...prev, visible: false }));
                }, 6000);
              });
            }
          }
        }
      } catch (e) {
        // Silent catch for network hiccups during background polling
      }
    };

    // Initial fetch on mount
    pollIncomingOrders();

    // 🔄 Auto-Poll every 8 seconds in the background
    const intervalId = setInterval(pollIncomingOrders, 8000);

    // Also subscribe to local order store for instant local sync
    const unsubscribeSync = subscribeOrderSync(() => {
      pollIncomingOrders();
    });

    return () => {
      clearInterval(intervalId);
      unsubscribeSync();
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Logout from Restaurant Partner Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
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
      case 'menu':
        return 'Menu Management';
      case 'orders':
        return 'Incoming Orders';
      case 'offers':
        return 'Offers & Coupons';
      case 'analytics':
        return 'Analytics';
      case 'reviews':
        return 'Customer Reviews';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };



  const renderCurrentTab = () => {
    if (isTabChanging) {
      switch (activeTab) {
        case 'orders':
        case 'incoming':
          return <OwnerOrdersSkeleton />;
        case 'menu':
          return <OwnerMenuSkeleton />;
        case 'settings':
          return <OwnerSettingsSkeleton />;
        case 'offers':
          return <OfferCardSkeleton />;
        default:
          return <OwnerDashboardSkeleton />;
      }
    }

    switch (activeTab) {
      case 'orders':
      case 'incoming':
        return <OwnerOrdersTab />;
      case 'menu':
        return <OwnerMenuTab />;
      case 'offers':
        return <OwnerOffersTab />;
      case 'analytics':
        return <OwnerAnalyticsTab />;
      case 'reviews':
        return <OwnerReviewsTab />;
      case 'settings':
        return <OwnerSettingsTab />;
      default:
        return <OwnerDashboardTab onNavigateTab={handleSwitchTab} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Heads-Up Push Notification Banner */}
        {notificationBanner.visible && (
          <TouchableOpacity
            style={styles.notifBannerCard}
            onPress={() => {
              setNotificationBanner({ visible: false, title: '', message: '', time: '' });
              handleSwitchTab('orders');
            }}
            activeOpacity={0.95}
          >
            <View style={styles.notifBannerHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.notifAppIcon}>
                  <Text style={{ fontSize: 10, color: '#FFF' }}>🏪</Text>
                </View>
                <Text style={styles.notifAppName}>RESTAURANT ADMIN</Text>
              </View>
              <Text style={styles.notifTimeText}>{notificationBanner.time || 'now'}</Text>
            </View>

            <Text style={styles.notifBannerTitleText}>{notificationBanner.title}</Text>
            <Text style={styles.notifBannerMsgText}>{notificationBanner.message}</Text>
          </TouchableOpacity>
        )}

        {/* Top App Header with Left Hamburger Drawer Icon & Right Live Notification Bell */}
        <View style={styles.topHeader}>
          {/* Left: Hamburger Drawer Icon */}
          <TouchableOpacity
            style={styles.menuIconBtn}
            onPress={() => {
              console.log('☰ Hamburger button pressed! Opening sidebar drawer...');
              setIsDrawerOpen(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>

          {/* Center: Title Box */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.portalLabel}>restaurantAdmin • {restaurantName}</Text>
            <Text style={styles.currentTabLabel}>{getHeaderTitle()}</Text>
          </View>

          {/* Right: Live Notification Bell Icon with Dynamic Red Badge Counter */}
          <TouchableOpacity
            style={styles.notifBellBtn}
            onPress={() => {
              setShowNotifModal(true);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <Path d="M13.73 21a2 2 0 01-3.46 0" />
            </Svg>
            {unreadCount > 0 && (
              <View style={styles.notifBadgeCircle}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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
                onPress={() => handleSwitchTab(tab.id)}
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
          onSelectTab={(tabId) => handleSwitchTab(tabId)}
          onLogout={handleLogout}
          onNavigateCustomerSite={() => navigation.navigate('Home')}
          restaurantName={restaurantName}
        />

        {/* Live Order Notifications Modal */}
        <Modal
          visible={showNotifModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotifModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.notifModalCard}>
              <View style={styles.notifModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>🔔</Text>
                  <Text style={styles.notifModalTitle}>Live Customer Order Alerts</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                  <Text style={styles.notifModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyNotifText}>No order alerts right now.</Text>
                ) : (
                  notifications.map((n) => (
                    <View key={n.id} style={styles.notifCardItem}>
                      <View style={styles.notifCardHeader}>
                        <Text style={styles.notifCardTitle}>{n.title}</Text>
                        <Text style={styles.notifCardTime}>{n.time}</Text>
                      </View>
                      <Text style={styles.notifCardMessage}>{n.message}</Text>
                      {n.orderId && (
                        <TouchableOpacity
                          style={styles.btnNotifAction}
                          onPress={() => {
                            setShowNotifModal(false);
                            setActiveTab('orders');
                          }}
                        >
                          <Text style={styles.btnNotifActionText}>View & Accept Order 👨‍🍳</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  notifBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    position: 'relative',
  },
  notifBadgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  notifBannerCard: {
    backgroundColor: '#0F172A',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  notifBannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifAppIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAppName: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F97316',
    letterSpacing: 0.5,
  },
  notifTimeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifBannerTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  notifBannerMsgText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  notifModalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  notifModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifModalClose: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  emptyNotifText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 20,
  },
  notifCardItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifCardTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifCardMessage: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 4,
  },
  btnNotifAction: {
    backgroundColor: '#EA580C',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  btnNotifActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
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
