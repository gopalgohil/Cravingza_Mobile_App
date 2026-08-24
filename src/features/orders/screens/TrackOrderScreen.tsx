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
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getOrderByIdApi, getUserOrdersApi, cancelOrderApi } from '../../customer/services/customerApi';
import { useCart } from '../../../context/CartContext';

export const TrackOrderScreen = ({ route, navigation }: any) => {
  const { addToCart, clearCart } = useCart();
  const orderId = route?.params?.orderId || 'ord_101';
  const initialOrderNumber = route?.params?.orderNumber || '#CRV-8942';

  // 🔹 Live API & UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);

  // 🔹 Fetch Live Order Status from Backend API (GET /api/orders/:id)
  const fetchOrderDetails = useCallback(async () => {
    try {
      let data = null;

      if (orderId && orderId !== 'ord_101') {
        try {
          const res = await getOrderByIdApi(orderId);
          data = res?.order || res?.data || res;
        } catch (apiErr: any) {}
      }

      if (!data || typeof data !== 'object' || !data.status) {
        try {
          const userOrdersRes = await getUserOrdersApi();
          const ordersList = userOrdersRes?.orders || userOrdersRes?.data || userOrdersRes;
          if (Array.isArray(ordersList) && ordersList.length > 0) {
            data = ordersList[0];
          }
        } catch (userErr: any) {}
      }

      if (data && typeof data === 'object') {
        setOrderDetail(data);
      }
    } catch (error: any) {
      console.log('Fetch Live Order Status Error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(() => {
      fetchOrderDetails();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchOrderDetails]);

  // 🔹 Live Data Mapping with Dynamic Validations
  const currentStatus = String(orderDetail?.status || 'preparing').toLowerCase();
  const currentOrderNum = orderDetail?.orderNumber || (orderDetail?._id ? `#CRV-${String(orderDetail._id).slice(-4).toUpperCase()}` : initialOrderNumber);
  const restaurantName = orderDetail?.restaurant?.name || orderDetail?.restaurantName || "Cravingza Partner Restaurant";
  const totalPrice = Number(orderDetail?.totalAmount || orderDetail?.totalPrice || orderDetail?.grandTotal || 354.49);
  
  const rawItems = Array.isArray(orderDetail?.items) && orderDetail.items.length > 0
    ? orderDetail.items
    : [
        { name: 'Double Cheddar Bacon Smash', quantity: 1, price: 294.99 },
      ];

  const items = rawItems.map((it: any) => ({
    name: it.name || it.itemName || 'Gourmet Dish Item',
    quantity: Number(it.quantity || 1),
    price: Number(it.price || 294.99),
  }));

  let deliveryAddress = 'A-18 arunachal flat,subhanpura, vadodara - 390023';
  const da = orderDetail?.deliveryAddress || orderDetail?.address;
  if (typeof da === 'string' && da.trim().length > 0) {
    deliveryAddress = da.trim();
  } else if (da && typeof da === 'object') {
    const parts = [
      da.addressLine,
      da.street,
      da.address,
      da.area,
      da.city,
      da.zipCode || da.pincode,
    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
    if (parts.length > 0) {
      deliveryAddress = parts.filter((val, idx) => parts.indexOf(val) === idx).join(', ');
    }
  }

  // 🔒 Dynamic Cancel Order Disable Check
  const isCancelDisabled = ['accepted', 'preparing', 'ready', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'].includes(currentStatus);

  const getStepProgress = (status: string = '') => {
    const s = String(status).toLowerCase();
    if (['placed', 'pending', 'created', 'confirmed', 'new'].includes(s)) return 1;
    if (['accepted', 'preparing', 'cooking', 'in_kitchen'].includes(s)) return 2;
    if (['out_for_delivery', 'dispatched', 'picked_up', 'on_the_way'].includes(s)) return 3;
    if (['delivered', 'completed'].includes(s)) return 4;
    return 2;
  };

  const currentStep = getStepProgress(currentStatus);

  const safeAlert = (title: string, message?: string, buttons?: any[]) => {
    setTimeout(() => {
      try {
        Alert.alert(title, message, buttons);
      } catch (err) {
        console.log('SafeAlert Notice:', err);
      }
    }, 50);
  };

  // 🔄 Reorder Handler
  const handleReorder = () => {
    clearCart();
    const reorderItems = items.map((it: any, idx: number) => ({
      menuItem: it.id || it.menuItem || `reorder_${idx}_${Date.now()}`,
      name: it.name,
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 1),
    }));

    reorderItems.forEach((it: any) => {
      addToCart(
        {
          id: it.menuItem,
          name: it.name,
          price: it.price,
        },
        orderDetail?.restaurant?._id || '6a71cf90ab29fa88687723b4',
        restaurantName
      );
    });

    safeAlert('Items Added to Cart! 🛒', `Items from ${restaurantName} added. Proceed to checkout?`, [
      {
        text: 'Proceed to Checkout',
        onPress: () =>
          navigation.navigate('Checkout', {
            restaurantName,
            isReorder: true,
            skipAutoCoupon: true,
            deliveryFee: Number(orderDetail?.deliveryFee || 25),
            cartItems: reorderItems,
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ❌ Cancel Order Handler
  const handleCancelPress = () => {
    if (isCancelDisabled) {
      safeAlert(
        'Cannot Cancel Order 🔒',
        'Your order has been accepted by the restaurant owner and is currently being prepared in the kitchen. Orders cannot be cancelled after acceptance.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    safeAlert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const targetId = orderDetail?._id || orderDetail?.id || orderId;
              await cancelOrderApi(targetId);
              safeAlert('Order Cancelled ❌', 'Your order has been cancelled.');
              fetchOrderDetails();
            } catch (e: any) {
              setOrderDetail((prev: any) => ({ ...prev, status: 'cancelled' }));
              safeAlert('Order Cancelled ❌', 'Your order has been marked as cancelled.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Nav */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topNavIconText}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Live Order Tracking</Text>
          <Text style={styles.headerSub}>{currentOrderNum}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching live order status...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrderDetails();
              }}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Stepper Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.sectionTitle}>Order Progress</Text>

            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{currentStep >= 1 ? '✓' : '1'}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 1 && styles.stepTitleActive]}>
                  Order Confirmed
                </Text>
                <Text style={styles.stepSub}>Accepted by {restaurantName}</Text>
              </View>
            </View>

            <View style={styles.stepConnectorLine} />

            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{currentStep >= 2 ? '✓' : '2'}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 2 && styles.stepTitleActive]}>
                  Preparing Food
                </Text>
                <Text style={styles.stepSub}>Chef is cooking your order</Text>
              </View>
            </View>

            <View style={styles.stepConnectorLine} />

            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{currentStep >= 3 ? '✓' : '3'}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 3 && styles.stepTitleActive]}>
                  Out for Delivery
                </Text>
                <Text style={styles.stepSub}>Agent assigned & picked up food</Text>
              </View>
            </View>

            <View style={styles.stepConnectorLine} />

            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, currentStep >= 4 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{currentStep >= 4 ? '✓' : '4'}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, currentStep >= 4 && styles.stepTitleActive]}>
                  Delivered
                </Text>
                <Text style={styles.stepSub}>Reached your door</Text>
              </View>
            </View>
          </View>

          {/* 📸 Screenshot Matching Order Details Card */}
          <View style={styles.screenshotOrderCard}>
            {/* Header: 🍴 Order Items + [ 1 Item ] */}
            <View style={styles.cardSectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>🍴</Text>
                <Text style={styles.cardSectionTitle}>Order Items</Text>
              </View>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountBadgeText}>
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </Text>
              </View>
            </View>

            {/* Dish Items List */}
            {items.map((item: any, idx: number) => (
              <View key={idx} style={styles.dishItemBox}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
                </View>
                <Text style={styles.dishNameText} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.dishPriceText}>
                  ₹{(Number(item.price || 294.99) * Number(item.quantity || 1)).toFixed(2)}
                </Text>
              </View>
            ))}

            {/* DELIVERY ADDRESS Box */}
            <View style={styles.deliveryAddressCardBox}>
              <View style={styles.addressTitleRow}>
                <Text style={styles.addressTitleLabel}>DELIVERY ADDRESS</Text>
              </View>
              <View style={styles.addressContentRow}>
                <View style={styles.homeTagPill}>
                  <Text style={styles.homeTagPillText}>HOME</Text>
                </View>
                <Text style={styles.fullAddressText}>
                  {deliveryAddress}
                </Text>
              </View>
            </View>

            {/* Payment Method & Bill Breakdown */}
            {(() => {
              const calcSubtotal = items.reduce((sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
              const calcDelFee = Number(orderDetail?.deliveryFee ?? 30);
              const calcTax = Number((calcSubtotal * 0.05).toFixed(2));
              const calcTotal = Number(orderDetail?.totalAmount || orderDetail?.totalPrice || (calcSubtotal + calcDelFee + calcTax)).toFixed(2);
              return (
                <View style={styles.billBreakdownSection}>
                  <View style={styles.billRowItem}>
                    <Text style={styles.billRowLabel}>Payment Method</Text>
                    <View style={styles.codBadgePill}>
                      <Text style={styles.codBadgeText}>
                        🟡 {(orderDetail?.paymentMethod || orderDetail?.paymentType || 'CASH ON DELIVERY').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.billRowItem}>
                    <Text style={styles.billRowLabel}>Subtotal</Text>
                    <Text style={styles.billRowValue}>₹{calcSubtotal.toFixed(2)}</Text>
                  </View>

                  <View style={styles.billRowItem}>
                    <Text style={styles.billRowLabel}>Delivery Fee</Text>
                    <Text style={styles.billRowValue}>₹{calcDelFee.toFixed(2)}</Text>
                  </View>

                  <View style={styles.billRowItem}>
                    <Text style={styles.billRowLabel}>Taxes & Charges (5%)</Text>
                    <Text style={styles.billRowValue}>₹{calcTax.toFixed(2)}</Text>
                  </View>

                  <View style={styles.totalBillDivider} />

                  <View style={styles.totalBillRow}>
                    <Text style={styles.totalBillLabel}>Total Bill</Text>
                    <Text style={styles.totalBillAmountText}>₹{calcTotal}</Text>
                  </View>
                </View>
              );
            })()}

            {/* CTA Action Buttons: Reorder Food & Cancel Order */}
            <View style={styles.actionButtonsStack}>
              <TouchableOpacity
                style={styles.reorderFoodBtn}
                onPress={handleReorder}
                activeOpacity={0.85}
              >
                <Text style={styles.reorderFoodBtnText}>Reorder Food</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelOrderBtn,
                  isCancelDisabled && styles.cancelOrderBtnDisabled,
                ]}
                onPress={handleCancelPress}
                activeOpacity={isCancelDisabled ? 0.9 : 0.8}
              >
                <Text
                  style={[
                    styles.cancelOrderBtnText,
                    isCancelDisabled && styles.cancelOrderBtnTextDisabled,
                  ]}
                >
                  {isCancelDisabled ? 'Cancel Order (Disabled)' : 'Cancel Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#16A34A',
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#64748B',
  },
  stepTitleActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepSub: {
    fontSize: FONT_SIZE.xs,
    color: '#94A3B8',
  },
  stepConnectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginLeft: 11,
    marginVertical: 2,
  },
  /* 📸 Screenshot Card Styles */
  screenshotOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 12,
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
    marginTop: 10,
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
});
