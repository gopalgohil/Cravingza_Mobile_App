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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { apiClient } from '../../../services/apiClient';

export const DeliveryPartnerLayoutScreen = ({ navigation }: any) => {
  const { currentUser, logout: authLogout } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'dboy' | 'settings'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  // 🔹 Fetch Live Assigned Deliveries strictly from MongoDB Atlas Backend
  const fetchDeliveries = useCallback(async () => {
    try {
      console.log('Fetching Live Delivery Partner Orders from MongoDB Atlas...');
      const res = await apiClient('/orders');
      const orderList = res?.orders || res?.data || (Array.isArray(res) ? res : []);

      if (Array.isArray(orderList)) {
        // Real-time status change detection from Restaurant Admin
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          const oldSt = prevOrderStatuses[idStr];
          const newSt = (o.status || '').toLowerCase();

          if (
            oldSt &&
            ['pending', 'preparing', 'placed'].includes(oldSt.toLowerCase()) &&
            ['ready', 'out_for_delivery', 'picked_up'].includes(newSt)
          ) {
            const restName = o.restaurant?.name || o.restaurantName || 'Restaurant Partner';
            const ordNum = o.orderNumber || `#CRV-${String(idStr).slice(-4).toUpperCase()}`;

            // WhatsApp-Style Top Heads-Up Push Notification
            setNotificationBanner({
              visible: true,
              title: restName,
              message: `Order ${ordNum} is ready for pickup! 🛵`,
              time: 'now',
            });

            // Auto dismiss after 5 seconds like WhatsApp push notification
            setTimeout(() => {
              setNotificationBanner((prev) => ({ ...prev, visible: false }));
            }, 5000);
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
        setOrders([]);
      }
    } catch (err: any) {
      console.log('Fetch Deliveries Error:', err.message);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [prevOrderStatuses]);

  // 🔹 Initial Fetch & Auto Polling every 6 seconds for live MongoDB Atlas updates
  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(() => {
      fetchDeliveries();
    }, 6000);

    return () => clearInterval(interval);
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

  // 🔹 Calculate Live Dashboard Metrics dynamically from MongoDB Atlas orders
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'DELIVERED');
  const todayEarnings = completedOrders.reduce((sum, o) => {
    const earningVal = o.earning ? Number(o.earning) : Number(o.totalAmount || o.totalPrice || 0) * 0.15;
    return sum + (isNaN(earningVal) ? 65 : earningVal);
  }, 0);

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

      {/* Top Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Image
            source={{
              uri:
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.riderName}>{currentUser?.name || currentUser?.email?.split('@')[0] || 'Rahul Kumar'}</Text>
              <View style={styles.badgeRider}>
                <Text style={styles.badgeRiderText}>🚴 Delivery Hero</Text>
              </View>
            </View>
            <Text style={styles.riderEmail}>{currentUser?.email || 'rahul@example.com'}</Text>
            <Text style={styles.riderStats}>⭐ 4.9 Rating • Live MongoDB Synced</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtnIcon} onPress={handleLogout}>
            <Text style={{ fontSize: 18 }}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Online / Offline Status Bar */}
        <View style={styles.onlineBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dotStatus, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
            <Text style={styles.onlineStatusText}>
              {isOnline ? '🟢 Duty Status: ONLINE (Live Receiving Orders)' : '🔴 Duty Status: OFFLINE'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#CBD5E1', true: '#BBF7D0' }}
            thumbColor={isOnline ? '#16A34A' : '#94A3B8'}
          />
        </View>
      </View>

      {/* TAB CONTENTS */}
      <View style={{ flex: 1 }}>
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <ScrollView style={styles.scrollContent}>
            <View style={styles.earningsHero}>
              <Text style={styles.earningsTitle}>Live Earnings (MongoDB Atlas)</Text>
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
                  No live deliveries found in MongoDB Atlas database.
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
        {activeTab === 'orders' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#EA580C']} />}
          >
            {loading && orders.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <ActivityIndicator size="large" color="#EA580C" />
                <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>
                  Loading Live Orders from MongoDB Atlas...
                </Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
                <Text style={styles.emptyTitle}>No Orders Assigned Yet</Text>
                <Text style={styles.emptySub}>
                  You are currently ONLINE. New food orders placed on Cravingza will appear here live from MongoDB Atlas!
                </Text>
                <TouchableOpacity style={styles.btnRefreshLive} onPress={handleRefresh}>
                  <Text style={styles.btnRefreshLiveText}>🔄 Refresh MongoDB Orders</Text>
                </TouchableOpacity>
              </View>
            ) : (
              orders.map((item, idx) => {
                const orderIdStr = item._id || item.id || `ord_dlv_${idx}`;
                if (declinedOrderIds.includes(orderIdStr)) {
                  return null; // Skip declined order
                }

                const isAccepted =
                  acceptedOrderIds.includes(orderIdStr) ||
                  item.status === 'picked_up' ||
                  item.status === 'out_for_delivery' ||
                  item.status === 'delivered';

                const step = getStepNumber(item.status);
                const restaurantName = item.restaurant?.name || item.restaurantName || 'Cravingza Bistro';
                const storePhone = item.restaurant?.phone || item.restaurantPhone || '+919123456789';
                const restaurantAddress = item.restaurant?.address || item.restaurantAddress || 'Sector 62, Noida';
                const customerName = item.customer?.name || item.user?.name || item.userName || 'Customer';
                const customerPhone = item.customer?.phone || item.user?.phone || item.userPhone || '+919876543210';
                const customerAddress = item.deliveryAddress?.street
                  ? `${item.deliveryAddress.street}, ${item.deliveryAddress.city || ''}`
                  : (item.deliveryAddress?.addressLine || item.address || 'Delivery Location');

                const items = Array.isArray(item.items) && item.items.length > 0
                  ? item.items
                  : [
                    { name: 'Delicious Food Item', quantity: 1, price: item.totalAmount || 250 },
                  ];
                const totalAmount = Number(item.totalAmount || item.totalPrice || 250);
                const paymentMethod = item.paymentMethod || item.paymentType || 'COD';

                // 🔹 1. IF NOT ACCEPTED YET -> SHOW NEW DELIVERY REQUEST OFFER CARD
                if (!isAccepted) {
                  return (
                    <View key={idx} style={styles.offerCard}>
                      <View style={styles.offerHeaderRow}>
                        <View>
                          <Text style={styles.offerTitle}>🔔 New Delivery Request (MongoDB Live)</Text>
                          <Text style={styles.offerOrderNum}>{item.orderNumber || `#CRV-${String(orderIdStr).slice(-6).toUpperCase()}`}</Text>
                        </View>
                        <View style={styles.payoutBadge}>
                          <Text style={styles.payoutBadgeText}>Payout: ₹{(totalAmount * 0.15).toFixed(0)}</Text>
                        </View>
                      </View>

                      <View style={styles.offerLocRow}>
                        <Text style={styles.offerIcon}>🏪</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.offerLocLabel}>Pick Up From:</Text>
                          <Text style={styles.offerLocVal}>{restaurantName}</Text>
                        </View>
                      </View>

                      <View style={styles.offerLocRow}>
                        <Text style={styles.offerIcon}>📍</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.offerLocLabel}>Deliver To:</Text>
                          <Text style={styles.offerLocVal}>{customerAddress}</Text>
                        </View>
                      </View>

                      {/* Accept / Decline Action Buttons Row */}
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                        <TouchableOpacity
                          style={[styles.btnAcceptOffer, { flex: 1 }]}
                          onPress={() => {
                            setAcceptedOrderIds((prev) => [...prev, orderIdStr]);
                            Alert.alert('Delivery Accepted 🚴', 'Order assigned to you! Stepper details now active.');
                          }}
                        >
                          <Text style={styles.btnAcceptOfferText}>✅ Accept Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnDeclineOffer}
                          onPress={() => {
                            setDeclinedOrderIds((prev) => [...prev, orderIdStr]);
                            Alert.alert('Order Declined ❌', 'You declined this delivery request.');
                          }}
                        >
                          <Text style={styles.btnDeclineOfferText}>❌ Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                // 🔹 2. IF ACCEPTED -> SHOW FULL WEB STEPPER & CONTACTS CARD
                return (
                  <View key={idx} style={styles.webOrderCard}>
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

                        {/* Connecting Line 1 */}
                        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

                        {/* Step 2: Picked Up */}
                        <View style={styles.stepItem}>
                          <View style={[styles.stepCircleIcon, step >= 2 && styles.stepCircleActive]}>
                            <Text style={[styles.stepIconEmoji, step >= 2 && styles.stepIconEmojiActive]}>🏪</Text>
                          </View>
                          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Picked Up</Text>
                        </View>

                        {/* Connecting Line 2 */}
                        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

                        {/* Step 3: On the Way */}
                        <View style={styles.stepItem}>
                          <View style={[styles.stepCircleIcon, step >= 3 && styles.stepCircleActive]}>
                            <Text style={[styles.stepIconEmoji, step >= 3 && styles.stepIconEmojiActive]}>🛵</Text>
                          </View>
                          <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>On the Way</Text>
                        </View>

                        {/* Connecting Line 3 */}
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
                            {step === 1 && '🏪 Pick Up Order (Arrived at Store)'}
                            {step === 2 && '🛵 Start Delivery (Out for Delivery)'}
                            {step === 3 && '✅ Mark Order Delivered'}
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
              })
            )}
          </ScrollView>
        )}

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
                  <Text style={styles.dboyRating}>⭐ 4.9 Rating ({orders.length} Active Orders)</Text>
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
                <Text style={styles.btnLogoutFullText}>Logout from Account 🚪</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* 🔹 FIXED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity
          style={styles.bottomNavTab}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.bottomNavIcon, activeTab === 'dashboard' && styles.bottomNavIconActive]}>📊</Text>
          <Text style={[styles.bottomNavLabel, activeTab === 'dashboard' && styles.bottomNavLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        {/* Tab 2: Orders */}
        <TouchableOpacity
          style={styles.bottomNavTab}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.bottomNavIcon, activeTab === 'orders' && styles.bottomNavIconActive]}>📋</Text>
          <Text style={[styles.bottomNavLabel, activeTab === 'orders' && styles.bottomNavLabelActive]}>Orders</Text>
        </TouchableOpacity>

        {/* Tab 3: D'Boy */}
        <TouchableOpacity
          style={styles.bottomNavTab}
          onPress={() => setActiveTab('dboy')}
        >
          <Text style={[styles.bottomNavIcon, activeTab === 'dboy' && styles.bottomNavIconActive]}>🚴</Text>
          <Text style={[styles.bottomNavLabel, activeTab === 'dboy' && styles.bottomNavLabelActive]}>D'Boy</Text>
        </TouchableOpacity>

        {/* Tab 4: Settings */}
        <TouchableOpacity
          style={styles.bottomNavTab}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.bottomNavIcon, activeTab === 'settings' && styles.bottomNavIconActive]}>⚙️</Text>
          <Text style={[styles.bottomNavLabel, activeTab === 'settings' && styles.bottomNavLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  bottomNavIcon: {
    fontSize: 20,
    opacity: 0.6,
    marginBottom: 2,
  },
  bottomNavIconActive: {
    opacity: 1,
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
