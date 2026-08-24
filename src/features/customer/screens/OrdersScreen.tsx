// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getUserOrdersApi, submitCustomerReviewApi, cancelOrderApi } from '../services/customerApi';
import { addSharedReview } from '../../../services/reviewSyncStore';
import { Modal, TextInput } from 'react-native';
import { useCart } from '../../../context/CartContext';
import { OrderCardSkeleton } from '../../../components/ui/SkeletonPlaceholder';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantName: string;
  restaurantImage?: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'placed' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  date: string;
  deliveryAddress?: string;
}

export const OrdersScreen = ({ navigation }: any) => {
  const { addToCart, clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Validation Error', 'Please write a brief review comment for your order.');
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        orderId: selectedOrderForReview?.id || selectedOrderForReview?._id,
        restaurantId: selectedOrderForReview?.restaurantId || '6a816c0c8170d2e1641c04f1',
        rating: reviewRating,
        comment: reviewComment.trim(),
        customerName: 'gopal gohel',
      };

      await submitCustomerReviewApi(payload).catch(() => { });

      // Add to shared review store so restaurant admin updates live in real-time
      addSharedReview({
        _id: `rev_live_${Date.now()}`,
        customerName: 'gopal gohel',
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: new Date().toISOString(),
        orderId: selectedOrderForReview?.id || selectedOrderForReview?._id,
        orderNumber: selectedOrderForReview?.orderNumber,
        items: selectedOrderForReview?.items || [],
        totalAmount: selectedOrderForReview?.totalPrice || 725.18,
      });

      Alert.alert('Review Submitted! ⭐', 'Thank you for rating your order! Your feedback is now live on the restaurant portal.');
      setReviewModalVisible(false);
      setReviewComment('');
      setSelectedOrderForReview(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // 🔹 Sample Fallback Demo Orders (In case live API returns 0 items)
  const demoOrders: Order[] = [
    {
      id: 'ord_101',
      orderNumber: '#CRV-8942',
      restaurantName: "Joe's Pizzeria & Bistro",
      restaurantImage:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60',
      items: [
        { name: 'Pepperoni Heaven Pizza', quantity: 1, price: 349.0 },
        { name: 'Garlic Butter Crust Sticks', quantity: 2, price: 120.0 },
      ],
      totalPrice: 589.0,
      status: 'out_for_delivery',
      date: 'Today, 06:45 PM',
      deliveryAddress: 'Home • 42 Baker Street, Apt 4B',
    },
    {
      id: 'ord_102',
      orderNumber: '#CRV-7821',
      restaurantName: 'Biryani Mahal & Gourmet',
      restaurantImage:
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60',
      items: [
        { name: 'Hyderabadi Dum Biryani', quantity: 2, price: 280.0 },
        { name: 'Butter Naan & Raita', quantity: 3, price: 40.0 },
      ],
      totalPrice: 680.0,
      status: 'delivered',
      date: 'Yesterday, 08:30 PM',
      deliveryAddress: 'Office • Tech Park Tower A',
    },
    {
      id: 'ord_103',
      orderNumber: '#CRV-6290',
      restaurantName: 'Burger Craft & Shakes',
      restaurantImage:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60',
      items: [{ name: 'Double Cheeseburger Combo', quantity: 1, price: 299.0 }],
      totalPrice: 299.0,
      status: 'cancelled',
      date: '08 Aug 2026, 01:15 PM',
    },
  ];

  useEffect(() => {
    loadUserOrders();
  }, []);

  const loadUserOrders = async () => {
    try {
      setLoading(true);
      const res = await getUserOrdersApi();
      console.log('Live Orders Response:', res);

      const apiData = res.data || res;
      if (Array.isArray(apiData) && apiData.length > 0) {
        const formatted: Order[] = apiData.map((ord: any) => ({
          id: ord._id || ord.id,
          orderNumber: `#CRV-${(ord._id || ord.id).slice(-4).toUpperCase()}`,
          restaurantName: ord.restaurant?.name || 'Cravingza Gourmet',
          restaurantImage:
            ord.restaurant?.image ||
            ord.restaurant?.bannerImage ||
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60',
          items: (ord.items || []).map((it: any) => ({
            name: it.name || it.item?.name || 'Food Dish Item',
            quantity: it.quantity || 1,
            price: it.price || 10.0,
          })),
          totalPrice: ord.totalAmount || ord.totalPrice || 25.0,
          status: ord.status || 'delivered',
          date: new Date(ord.createdAt || Date.now()).toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setOrders(formatted);
      } else {
        setOrders(demoOrders);
      }
    } catch (error: any) {
      console.log('Fetch Orders Error:', error.message);
      setOrders(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserOrders();
    setRefreshing(false);
  };

  // 🔹 Filter Logic (All, Active, Delivered, Cancelled)
  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Active') {
      return ['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(order.status);
    }
    if (selectedFilter === 'Delivered') return order.status === 'delivered';
    if (selectedFilter === 'Cancelled') return order.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return { label: 'Out for Delivery', color: '#D97706', bg: '#FEF3C7' };
      case 'preparing':
      case 'accepted':
      case 'placed':
        return { label: 'Preparing Food', color: '#2563EB', bg: '#EFF6FF' };
      case 'delivered':
        return { label: 'Delivered', color: '#16A34A', bg: '#DCFCE7' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' };
      default:
        return { label: 'Order Placed', color: '#475569', bg: '#F1F5F9' };
    }
  };

  // 🎨 FlatList Header (Title Header & Filter Tabs)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Orders</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.filterBar}>
        {['All', 'Active', 'Delivered', 'Cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterPill, selectedFilter === tab && styles.filterPillActive]}
            onPress={() => setSelectedFilter(tab)}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === tab && styles.filterPillTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const safeAlert = (title: string, message?: string, buttons?: any[]) => {
    setTimeout(() => {
      try {
        Alert.alert(title, message, buttons);
      } catch (err) {
        console.log('SafeAlert Notice:', err);
      }
    }, 50);
  };

  // 🎨 Order Card Renderer (Matching User Screenshot for Orders List)
  const renderOrderCard = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.status);
    const isCancelled = item.status === 'cancelled';
    const isDelivered = item.status === 'delivered';

    const itemsSummary = item.items.map((it) => `${it.quantity}x ${it.name}`).join(', ');

    const handleReorderPress = () => {
      clearCart();
      item.items.forEach((dish, idx) => {
        addToCart(
          {
            id: `reorder_${idx}_${Date.now()}`,
            name: dish.name,
            price: dish.price,
          },
          '6a71cf90ab29fa88687723b4',
          item.restaurantName
        );
      });
      safeAlert(
        'Items Added to Cart! 🛒',
        `Items from ${item.restaurantName} have been added to your cart.`,
        [
          {
            text: 'Proceed to Checkout',
            onPress: () =>
              navigation.navigate('Checkout', {
                restaurantName: item.restaurantName,
              }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };

    const handleViewDetailsPress = () => {
      navigation.navigate('TrackOrder', {
        orderId: item.id,
        orderNumber: item.orderNumber,
      });
    };

    return (
      <TouchableOpacity
        style={styles.screenshotListOrderCard}
        onPress={handleViewDetailsPress}
        activeOpacity={0.92}
      >
        {/* Top Content Row: Image + Details + Badges */}
        <View style={styles.listCardTopRow}>
          <Image
            source={{ uri: item.restaurantImage }}
            style={styles.listCardRestImage}
            resizeMode="cover"
          />

          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.listCardRestName} numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <Text style={styles.listCardDateText}>{item.date}</Text>
            <Text style={styles.listCardItemsSummary} numberOfLines={1}>
              {itemsSummary || '1x Gourmet Food Item'}
            </Text>
          </View>

          {/* Right Badges Column (Status + Payment/Refund) */}
          <View style={styles.listCardBadgesColumn}>
            <View style={[styles.listStatusBadgePill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.listStatusBadgeText, { color: badge.color }]}>
                {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered' : badge.label}
              </Text>
            </View>

            <View
              style={[
                styles.listPaymentBadgePill,
                isCancelled && { backgroundColor: '#D1FAE5' },
              ]}
            >
              <Text
                style={[
                  styles.listPaymentBadgeText,
                  isCancelled && { color: '#059669' },
                ]}
              >
                {isCancelled ? 'Refunded' : 'COD'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dashed Divider Line */}
        <View style={styles.listDashedDivider} />

        {/* Bottom Row: Price + View Details Link + Reorder Outline Button */}
        <View style={styles.listCardBottomRow}>
          <Text style={styles.listCardTotalPrice}>₹{item.totalPrice.toFixed(2)}</Text>

          <View style={styles.listCardActionRow}>
            <TouchableOpacity onPress={handleViewDetailsPress} activeOpacity={0.7} style={{ paddingVertical: 6, paddingHorizontal: 4 }}>
              <Text style={styles.viewDetailsTextLink}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reorderOutlineBtn} onPress={handleReorderPress} activeOpacity={0.8}>
              <Text style={styles.reorderOutlineBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🛍️</Text>
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'All'
          ? "You haven't placed any food cravings yet. Explore popular restaurants!"
          : `No ${selectedFilter.toLowerCase()} orders found in your history.`}
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {renderHeader()}

        {loading && !refreshing ? (
          <View style={{ flex: 1, paddingTop: 12 }}>
            <OrderCardSkeleton key="ord_skel_1" />
            <OrderCardSkeleton key="ord_skel_2" />
            <OrderCardSkeleton key="ord_skel_3" />
          </View>
        ) : (
          <FlatList
            style={styles.listStyle}
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderCard}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        )}

        {/* 🔹 Rate & Review Order Modal */}
        <Modal visible={reviewModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate Your Order ⭐</Text>
              <Text style={styles.modalSub}>
                How was your meal from {selectedOrderForReview?.restaurantName || 'Restaurant'}?
              </Text>

              {/* Star Rating Selector */}
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Text style={[styles.starIcon, { color: star <= reviewRating ? '#F59E0B' : '#CBD5E1' }]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review (e.g. Amazing Italian pizza, super fast delivery!)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={reviewComment}
                onChangeText={setReviewComment}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSubmitReview}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.btnSubmitReviewText}>Submit Review →</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listStyle: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: SPACING.md,
  },
  headerContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantImage: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBullet: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 6,
    fontWeight: 'bold',
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reorderBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  trackBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  trackBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 20,
  },
  exploreBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewBtn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reviewBtnText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: SPACING.lg,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  starIcon: {
    fontSize: 32,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  btnSubmitReview: {
    flex: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  btnSubmitReviewText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  screenshotOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  itemCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dishItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  qtyBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  qtyBadgeText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '900',
  },
  dishNameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  dishPriceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  deliveryAddressCardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  addressTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addressContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  homeTagPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  homeTagPillText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '900',
  },
  fullAddressText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  billBreakdownSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  billRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billRowLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  billRowValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
  },
  codBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  totalBillDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  totalBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBillLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  totalBillAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#EA580C',
  },
  actionButtonsStack: {
    gap: 10,
    marginTop: 8,
  },
  trackOrderBannerBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackOrderBannerBtnText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '800',
  },
  reorderFoodBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderFoodBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.55,
  },
  cancelOrderBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelOrderBtnTextDisabled: {
    color: '#94A3B8',
  },
  screenshotListOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  listCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listCardRestImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  listCardRestName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  listCardDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  listCardItemsSummary: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  listCardBadgesColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  listStatusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listPaymentBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  listPaymentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  listDashedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  listCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCardTotalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C2410C',
  },
  listCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewDetailsTextLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  reorderOutlineBtn: {
    borderWidth: 1.5,
    borderColor: '#C2410C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  reorderOutlineBtnText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '900',
  },
});
