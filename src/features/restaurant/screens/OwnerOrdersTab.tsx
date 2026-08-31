// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getOwnerOrdersApi, updateOrderStatusApi } from '../services/restaurantOwnerApi';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';
import { getSharedOrders, updateSharedOrderStatus, subscribeOrderSync } from '../../../services/orderSyncStore';
import { subscribeToOrderUpdates } from '../../../services/socketService';

type FilterType =
  | 'all'
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

interface FilterTabItem {
  id: FilterType;
  label: string;
}

const FILTER_TABS: FilterTabItem[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'new', label: 'New (Placed)' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready for Pickup' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const OwnerOrdersTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>(() => getSharedOrders());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await getOwnerOrdersApi();
      const list = res?.data || res?.orders || (Array.isArray(res) ? res : null);
      if (Array.isArray(list)) {
        setOrders(list);
      } else {
        setOrders(getSharedOrders());
      }
    } catch (err: any) {
      console.log('Fetch Owner Orders Note:', err.message);
      setOrders(getSharedOrders());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setOrders(getSharedOrders());
    setLoading(false);
    fetchOrders();

    const unsubscribeSocket = subscribeToOrderUpdates((orderData) => {
      console.log('⚡ [OwnerOrdersTab] Real-Time Socket.io Order Event:', orderData);
      fetchOrders();
    });

    const unsubscribe = subscribeOrderSync(() => {
      fetchOrders();
    });

    return () => {
      unsubscribeSocket();
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      console.log(`Updating order ${orderId} to status ${newStatus}...`);

      // Update shared memory & trigger live customer notifications
      updateSharedOrderStatus(orderId, newStatus);

      // Call API
      await updateOrderStatusApi(orderId, newStatus);

      setOrders((prev) =>
        prev.map((o) => ((o._id || o.id) === orderId ? { ...o, status: newStatus } : o))
      );

      Alert.alert(
        'Status Updated 🎉',
        `Order status moved to "${newStatus.toUpperCase()}"! Customer notified live.`
      );
    } catch (err: any) {
      console.log('Status Change Note:', err.message);
      updateSharedOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => ((o._id || o.id) === orderId ? { ...o, status: newStatus } : o))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute Live Counts for Badges matching Web Application
  const counts = {
    all: orders.length,
    new: orders.filter((o) =>
      ['placed', 'pending', 'new'].includes(String(o.status || '').toLowerCase())
    ).length,
    accepted: orders.filter((o) => String(o.status || '').toLowerCase() === 'accepted').length,
    preparing: orders.filter((o) => String(o.status || '').toLowerCase() === 'preparing').length,
    ready: orders.filter((o) =>
      ['ready', 'ready_for_pickup'].includes(String(o.status || '').toLowerCase())
    ).length,
    out_for_delivery: orders.filter((o) =>
      ['out_for_delivery', 'picked_up'].includes(String(o.status || '').toLowerCase())
    ).length,
    delivered: orders.filter((o) =>
      ['delivered', 'completed'].includes(String(o.status || '').toLowerCase())
    ).length,
    cancelled: orders.filter((o) =>
      ['cancelled', 'rejected'].includes(String(o.status || '').toLowerCase())
    ).length,
  };

  const filteredOrders = orders.filter((order) => {
    const st = String(order.status || '').toLowerCase();
    switch (activeFilter) {
      case 'new':
        return ['placed', 'pending', 'new'].includes(st);
      case 'accepted':
        return st === 'accepted';
      case 'preparing':
        return st === 'preparing';
      case 'ready':
        return ['ready', 'ready_for_pickup'].includes(st);
      case 'out_for_delivery':
        return ['out_for_delivery', 'picked_up'].includes(st);
      case 'delivered':
        return ['delivered', 'completed'].includes(st);
      case 'cancelled':
        return ['cancelled', 'rejected'].includes(st);
      case 'all':
      default:
        return true;
    }
  });

  // Sort orders descending so newest customer order is displayed at the VERY TOP
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const renderSkeleton = () => <OwnerOrdersSkeleton />;

  const formatOrderDateTime = (rawDate: any) => {
    if (!rawDate) {
      return new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }

    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        return typeof rawDate === 'string' ? rawDate : new Date().toLocaleString('en-IN');
      }
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return new Date().toLocaleString('en-IN');
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const orderIdStr = item._id || item.id || 'E759E4';
    const displayOrderNum = item.orderNumber || `#${String(orderIdStr).slice(-6).toUpperCase()}`;
    const rawStatus = String(item.status || 'placed').toLowerCase();

    const isNew = rawStatus === 'placed' || rawStatus === 'pending' || rawStatus === 'new';
    const isAccepted = rawStatus === 'accepted';
    const isPreparing = rawStatus === 'preparing';
    const isReady = rawStatus === 'ready' || rawStatus === 'ready_for_pickup';
    const isOutForDelivery = rawStatus === 'out_for_delivery' || rawStatus === 'picked_up';
    const isDelivered = rawStatus === 'delivered' || rawStatus === 'completed';
    const isCancelled = rawStatus === 'cancelled' || rawStatus === 'rejected';

    const customerName = item.customer?.name || item.user?.name || item.userName || item.customerName || 'Customer';
    const customerPhone = item.customer?.phone || item.user?.phone || item.userPhone || item.phone || '';

    // 🔹 Robust Address Parser matching Web App & Backend API format
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

    const paymentType = String(item.paymentMethod || item.paymentType || '').toUpperCase();
    const paymentStatus = String(item.paymentStatus || '').toUpperCase();
    const isCOD = !(
      paymentType.includes('ONLINE') ||
      paymentType.includes('RAZORPAY') ||
      paymentType.includes('UPI') ||
      paymentType.includes('CARD') ||
      paymentStatus === 'PAID' ||
      item.isPaid === true
    );

    const timestamp = formatOrderDateTime(item.createdAt || item.date || item.timestamp);

    const rawItemsInput = Array.isArray(item.items) ? item.items : [];
    const itemMapOwner: Record<string, any> = {};
    rawItemsInput.forEach((d: any) => {
      const name = d.name || 'Dish Item';
      const price = Number(d.price || 200);
      const qty = Number(d.quantity || 1);
      if (!itemMapOwner[name]) {
        itemMapOwner[name] = { ...d, name, price, quantity: qty };
      } else {
        itemMapOwner[name].quantity = Math.max(itemMapOwner[name].quantity, qty);
      }
    });
    const rawItems = Object.values(itemMapOwner);

    const itemSubtotal = rawItems.reduce((sum: number, d: any) => sum + Number(d.price || 0) * Number(d.quantity || 1), 0);
    const deliveryCharges = Number(item.deliveryFee ?? 30);
    const taxesGst = Number(item.taxes && Number(item.taxes) < (itemSubtotal * 0.2) ? item.taxes : (itemSubtotal * 0.05));
    const calculatedTotal = itemSubtotal + deliveryCharges + taxesGst;
    const totalAmount = calculatedTotal;

    return (
      <View style={styles.orderCardBox}>
        {/* 1. Header Row: Order Number + Status Badge + Payment Badge + Total Amount */}
        <View style={styles.orderTopHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.orderNumberText}>{displayOrderNum}</Text>

              {/* Status Badge */}
              <View style={[
                styles.statusPillBadge,
                isNew && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                isAccepted && { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
                isPreparing && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                isReady && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                isOutForDelivery && { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
                isDelivered && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                isCancelled && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
              ]}>
                <Text style={[
                  styles.statusPillBadgeText,
                  isNew && { color: '#2563EB' },
                  isAccepted && { color: '#0284C7' },
                  isPreparing && { color: '#D97706' },
                  isReady && { color: '#059669' },
                  isOutForDelivery && { color: '#4F46E5' },
                  isDelivered && { color: '#16A34A' },
                  isCancelled && { color: '#DC2626' },
                ]}>
                  {isNew
                    ? 'New (Placed)'
                    : isAccepted
                      ? 'Accepted'
                      : isPreparing
                        ? 'Preparing'
                        : isReady
                          ? 'Ready for Pickup'
                          : isDelivered
                            ? 'Delivered'
                            : isCancelled
                              ? 'Cancelled'
                              : 'Out for Delivery'}
                </Text>
              </View>

              {/* Payment Badge */}
              <View style={[styles.paymentPillBadge, !isCOD && { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <View style={[styles.paymentDotCircle, !isCOD && { backgroundColor: '#059669' }]} />
                <Text style={[styles.paymentPillBadgeText, !isCOD && { color: '#059669' }]}>
                  {isCOD ? 'CASH ON DELIVERY' : 'PAID ONLINE (RAZORPAY)'}
                </Text>
              </View>
            </View>

            {/* Date & Time Timestamp */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
              <Text style={{ fontSize: 11, color: '#64748B' }}>📅</Text>
              <Text style={styles.timestampText}>{timestamp}</Text>
            </View>
          </View>

          {/* Right Side: Total Amount */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalAmountLabel}>Total Amount</Text>
            <Text style={styles.totalAmountVal}>₹ {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* 2. Customer Details Box */}
        <View style={styles.customerBoxCard}>
          <View style={styles.customerBoxHeaderRow}>
            <Text style={styles.customerBoxName}>{customerName}</Text>
            <TouchableOpacity
              style={styles.btnCallCustomerRow}
              onPress={() => Linking.openURL(`tel:${customerPhone}`)}
            >
              <Text style={{ fontSize: 12, color: '#9A3412' }}>📞</Text>
              <Text style={styles.btnCallCustomerText}>Call Customer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: '#3B82F6', marginTop: 1 }}>📍</Text>
            <Text style={styles.customerAddressText}>{customerAddress}</Text>
          </View>
        </View>

        {/* 3. Items Summary */}
        <Text style={styles.itemsSummaryHeaderTitle}>Items Summary</Text>
        <View style={styles.itemsListContainer}>
          {rawItems.map((dish: any, idx: number) => (
            <View key={idx} style={styles.dishSummaryRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={styles.quantityBox}>
                  <Text style={styles.quantityBoxText}>x{dish.quantity || 1}</Text>
                </View>
                <Text style={styles.dishSummaryName}>{dish.name}</Text>
              </View>
              <Text style={styles.dishSummaryPrice}>₹{Number(dish.price || 0).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* 4. Bill Breakdown */}
        <View style={styles.billBreakdownBox}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billVal}>₹{itemSubtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Charges</Text>
            <Text style={styles.billVal}>₹{deliveryCharges.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & GST (5%)</Text>
            <Text style={styles.billVal}>₹{taxesGst.toFixed(2)}</Text>
          </View>
        </View>

        {/* 5. Change Status Row / Action Buttons matching exact Progression */}
        <View style={styles.changeStatusRow}>
          {(isNew || isAccepted || isPreparing) && (
            <Text style={styles.changeStatusLabel}>Change Status to:</Text>
          )}

          {/* New Order: Accept or Reject */}
          {isNew && (
            <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={styles.btnAcceptSolidGreen}
                onPress={() => handleStatusChange(orderIdStr, 'accepted')}
                disabled={updatingId === orderIdStr}
              >
                {updatingId === orderIdStr ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnAcceptSolidGreenText}>Accept Order</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnRejectOutlinedRed}
                onPress={() => handleStatusChange(orderIdStr, 'cancelled')}
              >
                <Text style={styles.btnRejectOutlinedRedText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Accepted: Start Preparing */}
          {isAccepted && (
            <TouchableOpacity
              style={styles.btnStartPreparing}
              onPress={() => handleStatusChange(orderIdStr, 'preparing')}
              disabled={updatingId === orderIdStr}
            >
              {updatingId === orderIdStr ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.btnStartPreparingText}>Start Preparing</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Preparing: Mark Ready for Pickup */}
          {isPreparing && (
            <TouchableOpacity
              style={styles.btnMarkReadyYellow}
              onPress={() => handleStatusChange(orderIdStr, 'ready_for_pickup')}
              disabled={updatingId === orderIdStr}
            >
              {updatingId === orderIdStr ? (
                <ActivityIndicator size="small" color="#9A3412" />
              ) : (
                <Text style={styles.btnMarkReadyYellowText}>Mark Ready for Pickup</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Ready: Waiting for Delivery Partner */}
          {isReady && (
            <View style={styles.waitingBadgePill}>
              <Text style={{ fontSize: 12 }}>🕒</Text>
              <Text style={styles.waitingBadgePillText} numberOfLines={1}>Waiting for Delivery Partner...</Text>
            </View>
          )}

          {/* Out for Delivery */}
          {isOutForDelivery && (
            <View style={styles.outForDeliveryPill}>
              <Text style={{ fontSize: 12 }}>🛵</Text>
              <Text style={styles.outForDeliveryPillText} numberOfLines={1}>Out for Delivery</Text>
            </View>
          )}

          {/* Delivered */}
          {isDelivered && (
            <View style={styles.deliveredPill}>
              <Text style={styles.deliveredPillText} numberOfLines={1}>Order Completed</Text>
            </View>
          )}

          {/* Cancelled */}
          {isCancelled && (
            <View style={styles.cancelledPill}>
              <Text style={styles.cancelledPillText} numberOfLines={1}>Order Cancelled</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 🔹 Persistent Web-Style Filter Header Bar (Preserves Horizontal Scroll Position) */}
      <View style={styles.headerContainer}>
        <Text style={styles.sectionHeaderTitle}>Incoming Orders</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            const tabCount = counts[tab.id] || 0;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
                    {tabCount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🔹 Live Orders FlatList */}
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#C2410C" />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No orders found under selected filter.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerContainer: {
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.md || 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
    marginLeft: 4,
  },
  filterScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingRight: SPACING.md,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#C2410C',
    borderColor: '#C2410C',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  orderCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusPillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusPillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  paymentPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  paymentDotCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  paymentPillBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  timestampText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  totalAmountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  totalAmountVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  customerBoxCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  customerBoxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerBoxName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  btnCallCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnCallCustomerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9A3412',
  },
  customerAddressText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  itemsSummaryHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  itemsListContainer: {
    marginBottom: 10,
  },
  dishSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  quantityBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  quantityBoxText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  dishSummaryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dishSummaryPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  billBreakdownBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  changeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  changeStatusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnAcceptSolidGreen: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnAcceptSolidGreenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  btnRejectOutlinedRed: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnRejectOutlinedRedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  btnStartPreparing: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnStartPreparingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  btnMarkReadyYellow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnMarkReadyYellowText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '800',
  },
  waitingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    maxWidth: '100%',
    flexShrink: 1,
  },
  waitingBadgePillText: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  outForDeliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  outForDeliveryPillText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  deliveredPillText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  cancelledPillText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.xs + 1,
    color: '#64748B',
  },
});
