// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { apiClient } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { CustomerBottomNav } from '../components/CustomerBottomNav';
import { NotificationCard } from '../components/NotificationCard';
import { HeaderBar, EmptyStateCard } from '../../../components/ui';
import { NotificationCardSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { subscribeToOrderUpdates } from '../../../services/socketService';

export interface NotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  read: boolean;
  type?: 'order_update' | 'promo' | 'system' | 'application' | string;
  orderId?: string;
  link?: string;
}

// Global persistent timestamp for cleared notifications session
let globalNotificationsClearedAt: number = 0;

export const NotificationsScreen = ({ navigation }: any) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 🔹 Fully Dynamic Fetcher from MongoDB Backend & Live Socket Orders
  const fetchNotifications = useCallback(async () => {
    try {
      let combined: NotificationItem[] = [];

      // 1. Fetch Live Backend MongoDB Notifications -> GET /api/notifications
      try {
        const res = await apiClient('/notifications');
        const notifData = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.notifications)
          ? res.notifications
          : Array.isArray(res)
          ? res
          : [];

        if (Array.isArray(notifData) && notifData.length > 0) {
          const mappedFromBackend = notifData.map((n: any) => ({
            id: String(n._id || n.id || `db_notif_${Math.random()}`),
            _id: n._id,
            title: n.title || 'Notification Alert',
            message: n.message || n.body || '',
            time: n.createdAt
              ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently',
            createdAt: n.createdAt,
            read: n.isRead ?? n.read ?? false,
            type: n.type || 'order_update',
            link: n.link,
            orderId: n.orderId || n.order,
          }));
          combined.push(...mappedFromBackend);
        }
      } catch (err: any) {
        console.log('MongoDB Notifications API Note:', err.message);
      }

      // 2. Fetch Live User Orders from MongoDB -> GET /api/orders to construct live order status alerts
      try {
        const ordersRes = await apiClient('/orders');
        const orderList = ordersRes?.orders || ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []);

        if (Array.isArray(orderList) && orderList.length > 0) {
          orderList.forEach((o: any) => {
            const idStr = String(o._id || o.id);
            const st = (o.status || '').toLowerCase();
            const restName = o.restaurant?.name || o.restaurantName || 'Restaurant Partner';
            const ordNum = o.orderNumber || `#CRV-${idStr.slice(-4).toUpperCase()}`;

            let notifTitle = '';
            let notifMsg = '';
            let notifType = 'order_update';

            if (['preparing', 'accepted'].includes(st)) {
              notifTitle = 'Order Accepted & Preparing! 👨‍🍳';
              notifMsg = `${restName} accepted your order ${ordNum} and started preparing your food!`;
            } else if (['out_for_delivery', 'picked_up'].includes(st)) {
              notifTitle = 'Out for Delivery! 🛵';
              notifMsg = `Your order ${ordNum} from ${restName} is out for delivery! Delivery rider is on the way.`;
            } else if (['delivered', 'completed'].includes(st)) {
              notifTitle = 'Order Delivered! 🎉';
              notifMsg = `Your order ${ordNum} from ${restName} has been delivered successfully. Enjoy your meal!`;
            } else if (['cancelled', 'rejected'].includes(st)) {
              notifTitle = 'Order Declined ❌';
              notifMsg = `Your order ${ordNum} from ${restName} was cancelled.`;
            }

            if (notifTitle) {
              combined.push({
                id: `live_order_${idStr}_${st}`,
                title: notifTitle,
                message: notifMsg,
                time: o.updatedAt
                  ? new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recently',
                createdAt: o.updatedAt || o.createdAt,
                read: ['delivered', 'completed'].includes(st),
                type: notifType,
                orderId: idStr,
              });
            }
          });
        }
      } catch (err: any) {
        console.log('Orders Sync Note:', err.message);
      }

      // 🔹 Filter out notifications if user executed "Clear All"
      if (globalNotificationsClearedAt > 0) {
        combined = combined.filter((item) => {
          if (!item.createdAt) return false;
          const itemTime = new Date(item.createdAt).getTime();
          return itemTime > globalNotificationsClearedAt;
        });
      }

      // Render items or clear state cleanly
      if (combined.length > 0) {
        // Sort by timestamp if available
        combined.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        // Deduplicate
        const uniqueMap = new Map();
        combined.forEach((item) => uniqueMap.set(item.id, item));
        setNotifications(Array.from(uniqueMap.values()));
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      console.log('Fetch Notifications Error:', err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 🔹 Real-Time WebSockets (Socket.io) Listener for Live Order Updates
  useEffect(() => {
    fetchNotifications();

    const unsubscribeSocket = subscribeToOrderUpdates((socketData) => {
      console.log('⚡ Live Order Socket Event in NotificationsScreen:', socketData);
      fetchNotifications();
    });

    return () => {
      unsubscribeSocket();
    };
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // 🔹 Dynamic Mark All as Read (Sends PATCH to Backend MongoDB)
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await apiClient('/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
    } catch (err: any) {
      console.log('Mark All Read Sync Note:', err.message);
    }
  };

  // 🔹 Dynamic Clear All Notifications (Purges Backend DB & Persists Cleared State)
  const handleClearAll = async () => {
    globalNotificationsClearedAt = Date.now();
    setNotifications([]);
    try {
      await apiClient('/notifications', {
        method: 'DELETE',
      });
    } catch (err: any) {
      console.log('Clear Notifications Sync Note:', err?.message || err);
    }
  };

  // 🔹 Single Notification Press -> Mark Read in DB & Navigate to relevant screen
  const handleNotificationPress = async (item: NotificationItem) => {
    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    // Send single mark as read to backend if _id exists
    if (item._id) {
      try {
        await apiClient('/notifications/read', {
          method: 'PATCH',
          body: JSON.stringify({ notificationId: item._id }),
        });
      } catch (err: any) {}
    }

    // Navigation logic: Redirect directly to Track Order live screen
    if (item.orderId) {
      navigation.navigate('TrackOrder', { orderId: item.orderId });
    } else if (item.type === 'promo') {
      navigation.navigate('Offers');
    } else {
      navigation.navigate('TrackOrder');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return !item.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar Component */}
      <HeaderBar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        showBack
        onBackPress={() => navigation.goBack()}
        rightComponent={
          notifications.length > 0 ? (
            <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark Read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs Bar */}
      <View style={styles.filterBarContainer}>
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List Container */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, paddingTop: 16 }}>
            <NotificationCardSkeleton key="notif_skel_1" />
            <NotificationCardSkeleton key="notif_skel_2" />
            <NotificationCardSkeleton key="notif_skel_3" />
            <NotificationCardSkeleton key="notif_skel_4" />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListEmptyComponent={
              <EmptyStateCard
                icon="🔔"
                title="No Notifications Found"
                message={
                  filter === 'unread'
                    ? "You don't have any unread notifications right now."
                    : 'Your live order status updates, promotional deals, and system alerts will appear here.'
                }
                buttonTitle="Refresh Alerts"
                onButtonPress={handleRefresh}
              />
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
          />
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
            renderItem={({ item }) => (
              <NotificationCard item={item} onPress={handleNotificationPress} />
            )}
          />
        )}
      </View>

      {/* Customer Bottom Navigation Bar */}
      <CustomerBottomNav activeTab="Home" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFEDD5',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  listContainer: {
    padding: SPACING.md,
    paddingBottom: 85,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  unreadNotifCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContentBox: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  unreadTitleText: {
    color: '#0F172A',
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  btnRefresh: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  btnRefreshText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
