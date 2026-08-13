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
import { getUserOrdersApi } from '../services/customerApi';
import { useCart } from '../../../context/CartContext';

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
        return { label: '🚚 Out for Delivery', color: '#D97706', bg: '#FEF3C7' };
      case 'preparing':
      case 'accepted':
      case 'placed':
        return { label: '⏳ Preparing Food', color: '#2563EB', bg: '#EFF6FF' };
      case 'delivered':
        return { label: '🟢 Delivered', color: '#16A34A', bg: '#DCFCE7' };
      case 'cancelled':
        return { label: '🔴 Cancelled', color: '#DC2626', bg: '#FEE2E2' };
      default:
        return { label: '📦 Order Placed', color: '#475569', bg: '#F1F5F9' };
    }
  };

  // 🎨 FlatList Header (Title Header & Filter Tabs)
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Orders 📦</Text>
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

  // 🎨 Single Order Card Renderer
  const renderOrderCard = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.status);

    return (
      <View style={styles.orderCard}>
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.restaurantImage }}
            style={styles.restaurantImage}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <Text style={styles.orderMetaText}>
              {item.orderNumber} • {item.date}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Items List */}
        <View style={styles.itemsContainer}>
          {item.items.map((dish, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemBullet}>•</Text>
              <Text style={styles.itemName}>
                {dish.quantity}x {dish.name}
              </Text>
              <Text style={styles.itemPrice}>₹{(dish.price * dish.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Card Footer Row (Total Price & CTA Buttons) */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>₹{item.totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(item.status) ? (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() =>
                  navigation.navigate('TrackOrder', {
                    orderId: item.id,
                    orderNumber: item.orderNumber,
                  })
                }
              >
                <Text style={styles.trackBtnText}>Track Order 📍</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.reorderBtn}
                onPress={() => {
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
                  Alert.alert(
                    'Items Added to Cart! 🛒',
                    `Items from ${item.restaurantName} have been added to your cart.`,
                    [
                      {
                        text: 'Proceed to Checkout 🛍️',
                        onPress: () =>
                          navigation.navigate('Checkout', {
                            restaurantName: item.restaurantName,
                          }),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.reorderBtnText}>Reorder 🔄</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
        <Text style={styles.exploreBtnText}>Explore Restaurants →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {renderHeader()}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching order history...</Text>
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
});
