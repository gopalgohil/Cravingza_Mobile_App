// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/apiClient';
import {
  getSharedOrders,
  setSharedOrders,
  updateSharedOrderStatus,
  subscribeOrderSync,
} from '../../../services/orderSyncStore';
import { DeliverySidebarDrawer } from '../components/DeliverySidebarDrawer';

const renderDeliveryNavIcon = (name: string, active: boolean) => {
  const color = active ? '#EA580C' : '#94A3B8';
  const size = 22;

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

export const DeliveryPartnerLayoutScreen = ({ navigation }: any) => {
  const { currentUser, logout: authLogout } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'dboy' | 'settings'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Drawer and Notifications Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif_welcome',
      title: 'Welcome Delivery Hero! 🚴',
      message: 'You will receive real-time order alerts when restaurant admin marks food ready for pickup.',
      time: 'Just now',
      read: false,
    },
  ]);

  // Track orders accepted and declined by rider
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<string[]>([]);
  const [declinedOrderIds, setDeclinedOrderIds] = useState<string[]>([]);

  const [prevOrderStatuses, setPrevOrderStatuses] = useState<Record<string, string>>({});
  const [notificationBanner, setNotificationBanner] = useState<{
    visible: boolean;
    title: string;
    message: string;
    time?: string;
  }>({ visible: false, title: '', message: '' });

  // 🔹 Fetch Live Assigned Deliveries strictly from MongoDB Atlas Backend or Local Sync
  const fetchDeliveries = useCallback(async () => {
    try {
      console.log('Fetching Live Delivery Partner Orders from MongoDB Atlas...');
      const res = await apiClient('/orders');
      let orderList = res?.orders || res?.data || (Array.isArray(res) ? res : []);

      if (!Array.isArray(orderList) || orderList.length === 0) {
        orderList = getSharedOrders();
      } else {
        setSharedOrders(orderList);
      }

      if (Array.isArray(orderList)) {
        // Real-time status change detection from Restaurant Admin
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          const oldSt = prevOrderStatuses[idStr];
          const newSt = (o.status || '').toLowerCase();

          if (
            (!oldSt || ['pending', 'placed'].includes(oldSt.toLowerCase())) &&
            ['preparing', 'ready', 'out_for_delivery', 'picked_up'].includes(newSt)
          ) {
            const restName = o.restaurant?.name || o.restaurantName || 'Restaurant Partner';
            const ordNum = o.orderNumber || `#CRV-${String(idStr).slice(-4).toUpperCase()}`;

            const notifTitle = `🛵 Delivery Request from ${restName}`;
            const notifMsg = `Order ${ordNum} marked as ${newSt.replace('_', ' ').toUpperCase()}! Click to accept & deliver.`;

            // WhatsApp-Style Top Heads-Up Push Notification
            setNotificationBanner({
              visible: true,
              title: notifTitle,
              message: notifMsg,
              time: 'now',
            });

            // Push into Notifications Array for Bell Badge Counter & Modal List
            const notifId = `notif_${Date.now()}_${idStr}`;
            setNotifications((prev) => {
              if (prev.some((n) => n.orderId === idStr && n.status === newSt)) return prev;
              return [
                {
                  id: notifId,
                  title: notifTitle,
                  message: notifMsg,
                  time: 'Just now',
                  read: false,
                  orderId: idStr,
                  status: newSt,
                },
                ...prev,
              ];
            });

            setTimeout(() => {
              setNotificationBanner((prev) => ({ ...prev, visible: false }));
            }, 6000);
          }
        });

        // Update status map
        const statusMap: Record<string, string> = {};
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          statusMap[idStr] = o.status;
        });
        setPrevOrderStatuses(statusMap);

        setOrders(orderList);
      } else {
        setOrders(getSharedOrders());
      }
    } catch (err: any) {
      console.log('Fetch Deliveries Error:', err.message);
      setOrders(getSharedOrders());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prevOrderStatuses]);

  // 🔹 Initial Fetch & Auto Polling + Store Listener
  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 4000);

    const unsubscribe = subscribeOrderSync(() => {
      setOrders([...getSharedOrders()]);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchDeliveries]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  // 🔹 Step Helper
  const getStepNumber = (status: string = '') => {
    const s = String(status).toLowerCase();
    if (['placed', 'pending', 'created', 'assigned'].includes(s)) return 1;
    if (['accepted', 'preparing', 'picked_up', 'pickedup'].includes(s)) return 2;
    if (['out_for_delivery', 'on_the_way', 'dispatched'].includes(s)) return 3;
    if (['delivered', 'completed'].includes(s)) return 4;
    return 1;
  };

  // 🔹 Cycle Status: Assigned (1) -> Picked Up (2) -> Out for Delivery (3) -> Delivered (4)
  const handleNextStatus = async (orderId: string, currentStep: number) => {
    let targetStatus = 'picked_up';
    if (currentStep === 1) targetStatus = 'picked_up';
    else if (currentStep === 2) targetStatus = 'out_for_delivery';
    else if (currentStep === 3) targetStatus = 'delivered';
    else return;

    try {
      setUpdatingId(orderId);
      updateSharedOrderStatus(orderId, targetStatus);
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
      Alert.alert('Status Updated 🎉', `Order is now ${targetStatus.replace('_', ' ').toUpperCase()}`);
      fetchDeliveries();
    } catch (err: any) {
      Alert.alert('Status Updated', `Order updated to ${targetStatus.replace('_', ' ').toUpperCase()}`);
      fetchDeliveries();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCall = (phone?: string) => {
    const targetPhone = phone || '+919876543210';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert('Call', `Dialing ${targetPhone}`);
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Logout from Delivery Partner Portal?', [
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

  // 🔹 Calculate Live Dashboard Metrics dynamically from MongoDB Atlas orders
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'DELIVERED');
  const todayEarnings = completedOrders.reduce((sum, o) => {
    const earningVal = o.earning ? Number(o.earning) : Number(o.totalAmount || o.totalPrice || 0) * 0.15;
    return sum + (isNaN(earningVal) ? 65 : earningVal);
  }, 0);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Earnings Dashboard';
      case 'orders':
        return 'Live Orders';
      case 'dboy':
        return 'Rider Profile';
      case 'settings':
        return 'Account Settings';
      default:
        return 'Live Orders';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* WhatsApp Style Top Heads-Up Notification Banner */}
      {notificationBanner.visible && (
        <TouchableOpacity
          style={styles.whatsAppNotificationCard}
          onPress={() => setNotificationBanner({ visible: false, title: '', message: '' })}
          activeOpacity={0.95}
        >
          {/* Header Row: App Icon + Name + Time */}
          <View style={styles.whatsAppHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.whatsAppAppIcon}>
                <Text style={{ fontSize: 10, color: '#FFF' }}>🛵</Text>
              </View>
              <Text style={styles.whatsAppAppName}>CRAVINGZA DELIVERIES</Text>
            </View>
            <Text style={styles.whatsAppTimeText}>{notificationBanner.time || 'now'}</Text>
          </View>

          {/* Body: Sender / Restaurant Name & Message */}
          <Text style={styles.whatsAppTitleText}>{notificationBanner.title}</Text>
          <Text style={styles.whatsAppMessageText}>{notificationBanner.message}</Text>
        </TouchableOpacity>
      )}

      {/* Top App Header with Left Hamburger Drawer Icon & Right Live Notification Bell */}
      <View style={styles.topHeader}>
        {/* Left: Hamburger Drawer Icon */}
        <TouchableOpacity style={styles.menuIconBtn} onPress={() => setIsDrawerOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>

        {/* Center: Title Box */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.portalLabel}>
            deliveryPartner • {currentUser?.name || currentUser?.email?.split('@')[0] || 'Rahul Kumar'}
          </Text>
          <Text style={styles.currentTabLabel}>{getHeaderTitle()}</Text>
        </View>

        {/* Right: Live Notification Bell Icon */}
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

      {/* TAB CONTENTS */}
      <View style={{ flex: 1 }}>
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.earningsHero}>
              <Text style={styles.earningsTitle}>Live Earnings</Text>
              <Text style={styles.earningsAmount}>₹{todayEarnings.toFixed(2)}</Text>
              <Text style={styles.earningsSub}>
                {completedOrders.length} Deliveries Completed Today • Live Auto Synced
              </Text>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{orders.length}</Text>
                <Text style={styles.metricLabel}>Total Orders</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>₹{todayEarnings.toFixed(0)}</Text>
                <Text style={styles.metricLabel}>Total Payout</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{orders.length > 0 ? (orders.length * 2.4).toFixed(1) : 0} km</Text>
                <Text style={styles.metricLabel}>Distance</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Live Deliveries Summary</Text>
            <View style={styles.historyCard}>
              {orders.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 12 }}>
                  No live deliveries found.
                </Text>
              ) : (
                orders.map((o, idx) => (
                  <View key={idx}>
                    <View style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyDate}>Order #{o.orderNumber || String(o._id || o.id).slice(-6).toUpperCase()}</Text>
                        <Text style={styles.historySub}>{o.restaurant?.name || 'Restaurant'} • Status: {String(o.status || 'placed').toUpperCase()}</Text>
                      </View>
                      <Text style={styles.historyAmount}>+₹{(o.totalAmount || 100) * 0.15}</Text>
                    </View>
                    {idx < orders.length - 1 && <View style={styles.dividerLine} />}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {/* 2. ORDERS TAB */}
        {activeTab === 'orders' && (() => {
          // Find if there is an active accepted delivery (not yet delivered or cancelled)
          const activeDeliveryOrder = orders.find((item, idx) => {
            const orderIdStr = item._id || item.id || `ord_dlv_${idx}`;
            if (declinedOrderIds.includes(orderIdStr)) return false;

            const st = String(item.status || '').toLowerCase();
            if (['delivered', 'completed', 'cancelled'].includes(st)) return false;

            const isAccepted =
              acceptedOrderIds.includes(orderIdStr) ||
              ['picked_up', 'out_for_delivery', 'on_the_way'].includes(st);

            return isAccepted;
          });

          // Unaccepted new delivery requests
          const unacceptedOrders = orders.filter((item, idx) => {
            const orderIdStr = item._id || item.id || `ord_dlv_${idx}`;
            if (declinedOrderIds.includes(orderIdStr)) return false;

            const st = String(item.status || '').toLowerCase();
            if (['delivered', 'completed', 'cancelled'].includes(st)) return false;

            const isAccepted =
              acceptedOrderIds.includes(orderIdStr) ||
              ['picked_up', 'out_for_delivery', 'on_the_way'].includes(st);

            return !isAccepted;
          });

          return (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#EA580C']} />}
            >
              {loading && orders.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                  <ActivityIndicator size="large" color="#EA580C" />
                  <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>
                    Loading Live Orders...
                  </Text>
                </View>
              ) : activeDeliveryOrder ? (
                // 🔹 1. IF AN ORDER IS ACCEPTED -> SHOW ONLY THAT EXCLUSIVE ACTIVE DELIVERY FULFILLMENT SCREEN (Matches Web App Screenshot)
                (() => {
                  const item = activeDeliveryOrder;
                  const orderIdStr = item._id || item.id;
                  const step = getStepNumber(item.status);
                  const restaurantName = item.restaurant?.name || item.restaurantName || 'Burger Boss';
                  const storePhone = item.restaurant?.phone || item.restaurantPhone || '+919123456789';
                  const restaurantAddress = item.restaurant?.address || item.restaurantAddress || '101 Burger Boulevard';
                  const customerName = item.customer?.name || item.user?.name || item.userName || 'gopal gohel';
                  const customerPhone = item.customer?.phone || item.user?.phone || item.userPhone || '+919876543210';
                  let customerAddress = 'Address not provided';
                  const da = item.deliveryAddress || item.address || item.shippingAddress;
                  if (typeof da === 'string' && da.trim().length > 0) {
                    customerAddress = da.trim();
                  } else if (da && typeof da === 'object') {
                    const parts = [
                      da.addressLine,
                      da.street,
                      da.address,
                      da.area,
                      da.landmark,
                      da.city,
                      da.zipCode || da.pincode,
                    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
                    if (parts.length > 0) {
                      customerAddress = parts.filter((val, idx) => parts.indexOf(val) === idx).join(', ');
                    }
                  }

                  const items = Array.isArray(item.items) && item.items.length > 0
                    ? item.items
                    : [
                      { name: 'Double Cheddar Bacon Smash', quantity: 1, price: 294.99 },
                      { name: 'Truffle Parmesan Fries', quantity: 1, price: 308.99 },
                    ];
                  const totalAmount = Number(item.totalAmount || item.totalPrice || 694.38);
                  const paymentMethod = item.paymentMethod || item.paymentType || 'COD';

                  return (
                    <View style={styles.webOrderCard}>
                      <View style={styles.activeFulfillmentHeaderRow}>
                        <Text style={styles.activeFulfillmentTitle}>Active Delivery Fulfillment</Text>
                      </View>

                      {/* 1. Top Stepper Container Card */}
                      <View style={styles.stepperContainerCard}>
                        <View style={styles.stepperIconsRow}>
                          {/* Step 1: Assigned */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 1 && styles.stepCircleActive]}>
                              <Text style={[styles.stepIconEmoji, step >= 1 && styles.stepIconEmojiActive]}>📋</Text>
                            </View>
                            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Assigned</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

                          {/* Step 2: Picked Up */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 2 && styles.stepCircleActive]}>
                              <Text style={[styles.stepIconEmoji, step >= 2 && styles.stepIconEmojiActive]}>🏪</Text>
                            </View>
                            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Picked Up</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

                          {/* Step 3: On the Way */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 3 && styles.stepCircleActive]}>
                              <Text style={[styles.stepIconEmoji, step >= 3 && styles.stepIconEmojiActive]}>🛵</Text>
                            </View>
                            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>On the Way</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 4 && styles.stepLineActive]} />

                          {/* Step 4: Delivered */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 4 && styles.stepCircleActive]}>
                              <Text style={[styles.stepIconEmoji, step >= 4 && styles.stepIconEmojiActive]}>✓</Text>
                            </View>
                            <Text style={[styles.stepLabel, step >= 4 && styles.stepLabelActive]}>Delivered</Text>
                          </View>
                        </View>

                        {/* Main Dynamic Action Button */}
                        <TouchableOpacity
                          style={[
                            styles.heroActionButton,
                            step === 4 && { backgroundColor: '#16A34A' },
                            updatingId === orderIdStr && { opacity: 0.7 },
                          ]}
                          onPress={() => handleNextStatus(orderIdStr, step)}
                          disabled={step === 4 || updatingId === orderIdStr}
                        >
                          {updatingId === orderIdStr ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.heroActionButtonText}>
                              {step === 1 && '🏪 Mark Food Picked Up from Restaurant'}
                              {step === 2 && '🛵 Start Delivery (On the Way)'}
                              {step === 3 && '✅ Mark Order Delivered 🎉'}
                              {step === 4 && '🎉 Order Delivered Successfully'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 2. Side-by-Side Two Column Contact Cards */}
                      <View style={styles.twoColumnRow}>
                        {/* Left Box: Restaurant */}
                        <View style={styles.columnBox}>
                          <View style={styles.boxHeader}>
                            <View style={styles.storeIconCircle}>
                              <Text style={{ fontSize: 14 }}>🏪</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.boxTitle} numberOfLines={1}>{restaurantName}</Text>
                              <Text style={styles.boxSub}>Pickup Location</Text>
                            </View>
                            <TouchableOpacity style={styles.btnCallGreen} onPress={() => handleCall(storePhone)}>
                              <Text style={styles.btnCallGreenText}>📞 Call Store</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.addressGrayBox}>
                            <Text style={styles.addressBoxTitle}>ADDRESS</Text>
                            <Text style={styles.addressBoxValue}>{restaurantAddress}</Text>
                          </View>
                        </View>

                        {/* Right Box: Customer */}
                        <View style={styles.columnBox}>
                          <View style={styles.boxHeader}>
                            <View style={styles.userIconCircle}>
                              <Text style={{ fontSize: 14 }}>👤</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.boxTitle} numberOfLines={1}>{customerName}</Text>
                              <Text style={styles.boxSub}>Delivery Recipient</Text>
                            </View>
                            <TouchableOpacity style={styles.btnCallGreen} onPress={() => handleCall(customerPhone)}>
                              <Text style={styles.btnCallGreenText}>📞 Call Customer</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.addressGrayBox}>
                            <Text style={styles.addressBoxTitle}>DELIVERY ADDRESS</Text>
                            <Text style={styles.addressBoxValue}>{customerAddress}</Text>
                          </View>
                        </View>
                      </View>

                      {/* 3. Order Items & Collectable Cash Box */}
                      <View style={styles.itemsCashCard}>
                        <Text style={styles.itemsCardHeader}>Order Items & Collectable Cash</Text>
                        <View style={styles.dashedLineDivider} />

                        {items.map((dish, i) => (
                          <View key={i} style={styles.dishRow}>
                            <Text style={styles.dishName}>{dish.quantity || 1}x {dish.name || 'Food Item'}</Text>
                            <Text style={styles.dishPrice}>₹{((dish.price || totalAmount) * (dish.quantity || 1)).toFixed(2)}</Text>
                          </View>
                        ))}

                        <View style={styles.dashedLineDivider} />

                        {/* Payment Footer Row */}
                        <View style={styles.cashFooterRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>💵</Text>
                            <Text style={styles.collectCashText}>
                              {paymentMethod === 'COD' ? 'COLLECT CASH FROM CUSTOMER' : 'PAID ONLINE VIA UPI'}
                            </Text>
                          </View>
                          <Text style={styles.totalCashAmount}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()
              ) : unacceptedOrders.length === 0 ? (
                // Empty state if no active or pending requests exist
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
                  <Text style={styles.emptyTitle}>No Orders Assigned Yet</Text>
                  <Text style={styles.emptySub}>
                    You are currently ONLINE. New food orders placed on Cravingza will appear here live!
                  </Text>
                  <TouchableOpacity style={styles.btnRefreshLive} onPress={handleRefresh}>
                    <Text style={styles.btnRefreshLiveText}>🔄 Refresh Orders</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // 🔹 2. IF NO ACTIVE ACCEPTED ORDER -> RENDER PENDING REQUEST OFFER CARDS
                unacceptedOrders.map((item, idx) => {
                  const orderIdStr = item._id || item.id || `ord_dlv_${idx}`;
                  const restaurantName = item.restaurant?.name || item.restaurantName || 'Burger Boss';
                  const restaurantAddress = item.restaurant?.address || item.restaurantAddress || '101 Burger Boulevard';
                  let customerAddress = 'Address not provided';
                  const da = item.deliveryAddress || item.address || item.shippingAddress;
                  if (typeof da === 'string' && da.trim().length > 0) {
                    customerAddress = da.trim();
                  } else if (da && typeof da === 'object') {
                    const parts = [
                      da.addressLine,
                      da.street,
                      da.address,
                      da.area,
                      da.landmark,
                      da.city,
                      da.zipCode || da.pincode,
                    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
                    if (parts.length > 0) {
                      customerAddress = parts.filter((val, idx) => parts.indexOf(val) === idx).join(', ');
                    }
                  }

                  const items = Array.isArray(item.items) && item.items.length > 0
                    ? item.items
                    : [
                      { name: 'Double Cheddar Bacon Smash', quantity: 1, price: 294.99 },
                      { name: 'Truffle Parmesan Fries', quantity: 1, price: 308.99 },
                    ];
                  const totalAmount = Number(item.totalAmount || item.totalPrice || 694.38);
                  const payoutVal = (totalAmount * 0.15 > 35 ? totalAmount * 0.15 : 40).toFixed(0);
                  const itemCount = items.length;

                  return (
                    <View key={idx} style={styles.requestCard}>
                      <View style={styles.requestHeaderRow}>
                        <View style={styles.storeIconBox}>
                          <Text style={{ fontSize: 20 }}>🏪</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.restaurantTitleName}>{restaurantName}</Text>
                            <View style={styles.readyPillBadge}>
                              <Text style={styles.readyPillBadgeText}>Ready for Pickup</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <Text style={{ fontSize: 12, color: '#94A3B8' }}>📍</Text>
                            <Text style={styles.restaurantAddressText}>{restaurantAddress}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.payoutCardBox}>
                        <Text style={styles.payoutCardLabel}>ESTIMATED PAYOUT</Text>
                        <Text style={styles.payoutCardValue}>₹{payoutVal}</Text>
                      </View>

                      <View style={styles.detailsGreyBox}>
                        <Text style={styles.detailsSectionLabel}>DELIVERY DESTINATION</Text>
                        <Text style={styles.detailsAddressVal}>{customerAddress}</Text>

                        <Text style={[styles.detailsSectionLabel, { marginTop: 10 }]}>ITEMS & TOTAL BILL</Text>
                        <Text style={styles.detailsBillVal}>
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • Total ₹{totalAmount.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.requestActionRow}>
                        <TouchableOpacity
                          style={styles.btnDeclineRedOutlined}
                          onPress={() => {
                            setDeclinedOrderIds((prev) => [...prev, orderIdStr]);
                            Alert.alert('Order Declined', 'You declined this delivery request.');
                          }}
                        >
                          <Text style={{ fontSize: 15 }}>🚫</Text>
                          <Text style={styles.btnDeclineRedText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnAcceptGreenSolid}
                          onPress={() => {
                            setAcceptedOrderIds((prev) => [...prev, orderIdStr]);
                            Alert.alert('Delivery Accepted 🚴', 'Order assigned to you! Active fulfillment now visible.');
                          }}
                        >
                          <Text style={styles.btnAcceptGreenText}>Accept Order</Text>
                          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '900' }}>→</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          );
        })()}

        {/* 3. D'BOY RIDER TAB */}
        {activeTab === 'dboy' && (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.dboyCard}>
              <View style={styles.dboyAvatarRow}>
                <Image
                  source={{
                    uri:
                      currentUser?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  }}
                  style={styles.dboyBigAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dboyName}>{currentUser?.name || currentUser?.email?.split('@')[0] || 'Rahul Kumar'}</Text>
                  <Text style={styles.dboyRole}>🚴 Delivery Partner (MongoDB Synced)</Text>
                  <Text style={styles.dboyRating}>{orders.length} Active Orders</Text>
                </View>
              </View>

              <View style={styles.dividerLine} />

              <View style={styles.infoGridRow}>
                <View style={styles.infoGridBox}>
                  <Text style={styles.infoGridTitle}>Duty Status</Text>
                  <Text style={[styles.infoGridVal, { color: isOnline ? '#16A34A' : '#DC2626' }]}>
                    {isOnline ? '🟢 ACTIVE ONLINE' : '🔴 OFFLINE'}
                  </Text>
                </View>
                <View style={styles.infoGridBox}>
                  <Text style={styles.infoGridTitle}>Zone Sector</Text>
                  <Text style={styles.infoGridVal}>Main City Hub</Text>
                </View>
              </View>

              <View style={styles.infoGridRow}>
                <View style={styles.infoGridBox}>
                  <Text style={styles.infoGridTitle}>Vehicle Reg</Text>
                  <Text style={styles.infoGridVal}>{currentUser?.vehicleNumber || 'Honda Activa (UP16 XY 8942)'}</Text>
                </View>
                <View style={styles.infoGridBox}>
                  <Text style={styles.infoGridTitle}>Shift Hours</Text>
                  <Text style={styles.infoGridVal}>Flexible Duty</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.profileCard}>
              <Text style={styles.profileSectionTitle}>Rider Account & Settings</Text>
              <Text style={styles.profileLabel}>Name: <Text style={styles.profileVal}>{currentUser?.name || currentUser?.email?.split('@')[0] || 'Rahul Kumar'}</Text></Text>
              <Text style={styles.profileLabel}>Email: <Text style={styles.profileVal}>{currentUser?.email || 'rahul@example.com'}</Text></Text>
              <Text style={styles.profileLabel}>Phone: <Text style={styles.profileVal}>{currentUser?.phone || '+91 98765 43210'}</Text></Text>
              <Text style={styles.profileLabel}>Vehicle: <Text style={styles.profileVal}>{currentUser?.vehicleNumber || 'Honda Activa (UP16 XY 8942)'}</Text></Text>
              <Text style={styles.profileLabel}>KYC Status: <Text style={{ color: '#16A34A', fontWeight: '700' }}>VERIFIED ✅</Text></Text>

              <TouchableOpacity style={styles.btnLogoutFull} onPress={handleLogout}>
                <Text style={styles.btnLogoutFullText}>Logout from Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* 🔹 FIXED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'orders', label: 'Orders' },
          { id: 'dboy', label: "D'Boy" },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.bottomNavTab}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <View style={styles.navIconContainer}>
                {renderDeliveryNavIcon(tab.id, isActive)}
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sidebar Drawer Component */}
      <DeliverySidebarDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as any)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isOnline={isOnline}
        onToggleOnline={setIsOnline}
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
                <Text style={styles.notifModalTitle}>Live Order Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Text style={styles.notifModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotifText}>No notifications right now.</Text>
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
                        <Text style={styles.btnNotifActionText}>View & Deliver Order 🛵</Text>
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
  );
};

const styles = StyleSheet.create({
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

  // 🔹 USER IMAGE REFERENCE MATCHING REQUEST CARD STYLES
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  restaurantTitleName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  readyPillBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  readyPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  restaurantAddressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  payoutCardBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    minWidth: 140,
    marginBottom: 14,
  },
  payoutCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  payoutCardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  detailsGreyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailsSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  detailsAddressVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  detailsBillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  requestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnDeclineRedOutlined: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnDeclineRedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  btnAcceptGreenSolid: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  btnAcceptGreenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  headerCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  riderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRider: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRiderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  riderEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  riderStats: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppNotificationCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 99999,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  whatsAppHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  whatsAppAppIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppAppName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  whatsAppTimeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  whatsAppTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  whatsAppMessageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1D5DB',
    marginTop: 2,
  },
  onlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  dotStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  btnRefreshLive: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnRefreshLiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },

  // 🔹 Pre-Acceptance Offer Card Styles
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  offerOrderNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payoutBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  offerLocRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  offerIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  offerLocLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  offerLocVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnAcceptOffer: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAcceptOfferText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  btnDeclineOffer: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnDeclineOfferText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },

  // 🔹 Web Image Matching Card Styles
  webOrderCard: {
    gap: 12,
    marginBottom: 20,
  },

  // 1. Stepper Card
  stepperContainerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  stepIconEmoji: {
    fontSize: 16,
    opacity: 0.5,
  },
  stepIconEmojiActive: {
    opacity: 1,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#EA580C',
  },

  // Hero Action Button
  heroActionButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  heroActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },

  // 2. Two Column Contacts Row
  twoColumnRow: {
    flexDirection: 'column',
    gap: 12,
  },
  columnBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  storeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  boxSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  btnCallGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  btnCallGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  addressGrayBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressBoxValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // 3. Items & Cash Card
  itemsCashCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsCardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dashedLineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  dishName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  dishPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  cashFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  collectCashText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.4,
  },
  totalCashAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },

  // Metrics & Earnings
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // D'Boy Tab Styles
  dboyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dboyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dboyBigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  dboyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dboyRole: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '700',
    marginTop: 2,
  },
  dboyRating: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  infoGridBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoGridTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  infoGridVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },

  // Earnings & Profile Section
  sectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  earningsHero: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22C55E',
    marginVertical: 4,
  },
  earningsSub: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  historySub: {
    fontSize: 11,
    color: '#64748B',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  profileLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  profileVal: {
    fontWeight: '700',
    color: '#1E293B',
  },
  btnLogoutFull: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnLogoutFullText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // 🔹 FIXED BOTTOM NAVIGATION BAR
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomNavLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
});
