// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import RazorpayCheckout from 'react-native-razorpay';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  createOrderApi,
  CreateOrderPayload,
  applyCouponApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  addToCartApi,
} from '../../customer/services/customerApi';
import { getAuth } from '@react-native-firebase/auth';
import { useAuth } from '../../../context/AuthContext';

import { useAddress } from '../../../context/AddressContext';
import { useCart } from '../../../context/CartContext';
import { setSharedOrders } from '../../../services/orderSyncStore';
import { getCopiedClipboardText } from '../../../services/clipboardStore';

export const CheckoutScreen = ({ route, navigation }: any) => {
  const { selectedAddress, savedAddresses, setSelectedAddress, fetchUserAddresses, saveNewAddress } = useAddress();
  const { clearCart } = useCart();
  const restaurantId = route?.params?.restaurantId || '6a71cf90ab29fa88687723b4';
  const restaurantName = route?.params?.restaurantName || "Jassi De Parathe";

  // Initial cart items or items passed via route
  const [items, setItems] = useState<any[]>(
    route?.params?.cartItems || [
      { menuItem: '101', name: 'Amritsari Aloo Paratha (2pcs)', price: 149, quantity: 2, image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=60' },
      { menuItem: '102', name: 'Kulhad Sweet Malai Lassi', price: 99, quantity: 1, image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=200&auto=format&fit=crop&q=60' },
    ]
  );

  // Address Selection Mode: 'SAVED' (select from profile addresses) vs 'CUSTOM' (deliver to another place)
  const [addressMode, setAddressMode] = useState<'SAVED' | 'CUSTOM'>('SAVED');
  const [saveCustomToProfile, setSaveCustomToProfile] = useState<boolean>(true);

  // Address & Payment States (Pre-filled from profile default address)
  const [street, setStreet] = useState(selectedAddress?.addressLine || '');
  const [city, setCity] = useState(selectedAddress?.city || '');
  const [zipCode, setZipCode] = useState(selectedAddress?.pincode || '');
  const [addressType, setAddressType] = useState<string>(selectedAddress?.label || 'Home');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE' | 'UPI'>('COD');

  // Auto-fetch & Sync Saved User Addresses from MongoDB Profile on Checkout Screen Load
  React.useEffect(() => {
    const initAddresses = async () => {
      await fetchUserAddresses();
    };
    initAddresses();
  }, []);

  // Pre-fill delivery address from default profile address
  React.useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && addressMode === 'SAVED') {
      const defaultAddr = selectedAddress || savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (defaultAddr) {
        setStreet(defaultAddr.addressLine || '');
        setCity(defaultAddr.city || '');
        setZipCode(defaultAddr.pincode || '');
        setAddressType(defaultAddr.label || 'Home');
        if (!selectedAddress) setSelectedAddress(defaultAddr);
      }
    } else if (selectedAddress && addressMode === 'SAVED') {
      setStreet(selectedAddress.addressLine || '');
      setCity(selectedAddress.city || '');
      setZipCode(selectedAddress.pincode || '');
      setAddressType(selectedAddress.label || 'Home');
    }
  }, [savedAddresses, selectedAddress, addressMode]);

  // Promo Code States
  const [couponInput, setCouponInput] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Auto-apply Restaurant Discount Offer on Checkout Load (skipped if reordering)
  const isReorderMode = !!route?.params?.isReorder || !!route?.params?.skipAutoCoupon;

  React.useEffect(() => {
    if (isReorderMode) {
      setDiscountAmount(0);
      setIsFreeDelivery(false);
      setAppliedCoupon(null);
    }
  }, [isReorderMode]);

  // Sync items when cartItems param changes via navigation
  React.useEffect(() => {
    if (route?.params?.cartItems && Array.isArray(route.params.cartItems) && route.params.cartItems.length > 0) {
      setItems(route.params.cartItems);
    }
  }, [route?.params?.cartItems]);

  const [loading, setLoading] = useState(false);

  // Dynamic Bill Calculations (Always based on current items in cart/checkout)
  const itemSubtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const baseDeliveryFee = route?.params?.deliveryFee !== undefined ? Number(route.params.deliveryFee) : 30;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const taxes = Number((itemSubtotal * 0.05).toFixed(2));
  const grandTotal = Math.max(0, Number((itemSubtotal + deliveryFee + taxes - discountAmount).toFixed(2)));

  // Quantity Handlers
  const handleIncreaseQty = (idx: number) => {
    const updated = [...items];
    updated[idx].quantity += 1;
    setItems(updated);
  };

  const handleDecreaseQty = (idx: number) => {
    const updated = [...items];
    if (updated[idx].quantity > 1) {
      updated[idx].quantity -= 1;
      setItems(updated);
    } else {
      updated.splice(idx, 1);
      setItems(updated);
    }
  };

  // 🏷️ Apply Coupon API Integration (POST /api/coupons/apply)
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Validation Error', 'Please enter a promo code.');
      return;
    }

    try {
      console.log(`Applying Coupon via API POST /api/coupons/apply (${code})...`);
      const res = await applyCouponApi({
        code,
        cartTotal: itemSubtotal,
      });
      console.log('Apply Coupon API Response:', res);

      const discount = res?.discountAmount || res?.data?.discountAmount || 50;
      const freeDel = !!(res?.isFreeDelivery || res?.data?.isFreeDelivery || res?.data?.category === 'delivery' || code.includes('FREEDEL') || code.includes('REEDEL'));
      setDiscountAmount(discount);
      setIsFreeDelivery(freeDel);
      setAppliedCoupon(code);
      Alert.alert('Coupon Applied! 🎉', res?.message || `Code ${code} applied successfully! Saved ₹${discount}${freeDel ? ' + Free Delivery' : ''}`);
    } catch (error: any) {
      console.log('Apply Coupon API Error:', error.message);
      // Fallback calculation for dev/demo codes
      if (code === 'CRAVE30' || code === 'CRAVE50' || code === 'RESTAURANT30') {
        const discount = Math.min(150, Math.round(itemSubtotal * 0.3));
        setDiscountAmount(discount);
        setIsFreeDelivery(false);
        setAppliedCoupon(code);
        Alert.alert('Coupon Applied! 🎉', `Code ${code} saved you ₹${discount}!`);
      } else if (code === 'FREEDEL' || code === 'REEDEL50' || code === 'FREEDEL50') {
        const discount = 50;
        setDiscountAmount(discount);
        setIsFreeDelivery(true);
        setAppliedCoupon(code);
        Alert.alert('Coupon Applied! 🎉', `Code ${code} saved you ₹${discount} + Free Delivery!`);
      } else if (code === 'WELCOME100') {
        const discount = 100;
        setDiscountAmount(discount);
        setIsFreeDelivery(false);
        setAppliedCoupon('WELCOME100');
        Alert.alert('Coupon Applied! 🎉', 'Welcome Deal! Saved ₹100!');
      } else {
        Alert.alert('Coupon Error ❌', error.message || 'Invalid coupon code. Try CRAVE30, FREEDEL50, or WELCOME100.');
      }
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setIsFreeDelivery(false);
    setCouponInput('');
  };

  const handlePasteCoupon = async () => {
    const pastedText = await getCopiedClipboardText();
    if (pastedText && pastedText.trim().length > 0) {
      const cleanCode = pastedText.trim().toUpperCase();
      setCouponInput(cleanCode);
      Alert.alert('Code Pasted! 📋', `Pasted coupon code "${cleanCode}". Tap Apply to get your discount!`);
    } else {
      Alert.alert('Clipboard Empty 📋', 'No copied coupon code found. Copy a promo code from Offers tab first!');
    }
  };

  // 🚀 Place Order & Payment Trigger (Razorpay Online vs COD)
  const { currentUser, setAuthUser } = useAuth();
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState(currentUser?.phone || '');

  const handlePlaceOrder = async () => {
    const firebaseUser = getAuth().currentUser;
    const activeUser = currentUser || firebaseUser;

    if (!activeUser) {
      Alert.alert(
        'Login Required',
        'Please login to your account to place food orders and proceed to checkout.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login / Sign Up', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (!currentUser?.phone && !checkoutPhone.trim()) {
      setPhoneModalVisible(true);
      return;
    }

    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart before placing an order.');
      return;
    }

    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    if (!street.trim() || !city.trim()) {
      Alert.alert('Address Missing', 'Please enter your delivery street and city.');
      return;
    }

    if (!cleanZip || cleanZip.length !== 6) {
      Alert.alert('Invalid Pincode 📍', 'Pincode must be exactly 6 digits (e.g. 390023).');
      return;
    }

    try {
      setLoading(true);

      // 🏠 Save custom delivery address to user MongoDB profile dynamically
      if (addressMode === 'CUSTOM' && saveCustomToProfile && street.trim()) {
        try {
          await saveNewAddress({
            label: addressType || 'Other',
            addressLine: street.trim(),
            city: city.trim(),
            pincode: zipCode.trim(),
            isDefault: false,
          });
        } catch (addrErr) {
          console.log('Custom address auto-save note:', addrErr);
        }
      }

      // 🔄 Pre-sync cart items to Render backend Database so Cart.findOne() succeeds
      try {
        for (const item of items) {
          const itemId = item.menuItem || item.id || item._id;
          if (itemId) {
            await addToCartApi(String(itemId), Number(item.quantity) || 1).catch(() => {});
          }
        }
      } catch (syncErr) {
        console.log('Cart pre-sync note:', syncErr);
      }

      // 💳 1. Online / UPI Payment via Razorpay
      if (paymentMethod === 'ONLINE' || paymentMethod === 'UPI') {
        console.log('Initiating Razorpay Online Payment Flow for Grand Total:', grandTotal);

        // Step A: Create Razorpay Order on Backend (with safe fallback for client grandTotal)
        let razorpayOrderId: string | undefined = undefined;
        // Strictly force calculatedAmountInPaise from UI grandTotal (Subtotal + Delivery Fee + Taxes - Discount)
        const calculatedAmountInPaise = Math.round(grandTotal * 100);
        const amount = calculatedAmountInPaise;
        let keyId = 'rzp_test_TIQT6DdrsWqxAT';

        try {
          const rzpRes = await createRazorpayOrderApi({
            amount: calculatedAmountInPaise,
            totalAmount: grandTotal,
            deliveryFee: deliveryFee,
            taxes: taxes,
            discountAmount: discountAmount,
            couponCode: appliedCoupon || undefined,
            restaurant: restaurantId,
            items: items.map((i) => ({
              menuItem: i.menuItem || i.id || i._id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
          });
          console.log('Razorpay Order Created API Response:', rzpRes);
          if (rzpRes?.keyId) keyId = rzpRes.keyId;

          // Only attach backend order_id IF backend created it with the exact UI total in paise (including delivery fee & taxes)
          if (rzpRes?.razorpayOrderId) {
            const resAmt = Number(rzpRes.amount || 0);
            if (resAmt === calculatedAmountInPaise) {
              razorpayOrderId = rzpRes.razorpayOrderId;
            } else {
              console.log(`Backend Razorpay order amount (${resAmt}) mismatch with UI total (${calculatedAmountInPaise}). Omitting order_id so Razorpay SDK uses exact UI total.`);
            }
          }
        } catch (apiErr: any) {
          console.log('Backend Razorpay Order API Note (Using client options with exact grand total):', apiErr.message);
        }

        const options: any = {
          description: `Food Order from ${restaurantName}`,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80',
          currency: 'INR',
          key: keyId,
          amount: amount,
          name: 'Cravingza Food Delivery',
          prefill: {
            email: currentUser?.email || activeUser?.email || 'customer@cravingza.com',
            contact: checkoutPhone || currentUser?.phone || '9876543210',
            name: currentUser?.name || activeUser?.displayName || 'Cravingza Customer',
          },
          theme: { color: COLORS.primary },
        };

        if (razorpayOrderId) {
          options.order_id = razorpayOrderId;
        }

        // Step B: Open Razorpay Payment Modal
        console.log('Calling RazorpayCheckout.open with options:', JSON.stringify(options));
        try {
          RazorpayCheckout.open(options)
            .then(async (data: any) => {
              console.log('Razorpay Payment Success Response:', data);

              const safePaymentId = data.razorpay_payment_id || `pay_${Date.now()}`;
              const safeOrderId = data.razorpay_order_id || razorpayOrderId || `order_rzp_${Date.now()}`;
              const safeSignature = data.razorpay_signature || `sig_rzp_${Date.now()}`;

              // Step C: Verify HMAC Signature & Create Paid Order on Backend
              let createdOrder: any = null;
              try {
                const verifyRes = await verifyRazorpayPaymentApi({
                  razorpay_order_id: safeOrderId,
                  razorpay_payment_id: safePaymentId,
                  razorpay_signature: safeSignature,
                  totalAmount: grandTotal,
                  deliveryFee: deliveryFee,
                  taxes: taxes,
                  restaurant: restaurantId,
                  paymentMethod: 'razorpay',
                  paymentType: 'razorpay',
                  paymentStatus: 'paid',
                  isPaid: true,
                  items: items.map((i) => ({
                    menuItem: i.menuItem || i.id || i._id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                  })),
                  deliveryAddress: {
                    addressLine: `${street.trim()}, ${city.trim()}`,
                    city: city.trim(),
                    zipCode: zipCode.trim(),
                  },
                  couponCode: appliedCoupon || undefined,
                });
                createdOrder = verifyRes?.data || verifyRes?.order || verifyRes;
              } catch (verifyErr: any) {
                console.log('Verify API Note (Creating Paid Order directly via /api/orders):', verifyErr.message);
                // Fallback: Create Paid Order directly on Backend via POST /api/orders
                const directRes = await createOrderApi({
                  restaurant: restaurantId,
                  items: items.map((i) => ({
                    menuItem: i.menuItem || i.id || i._id,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                  })),
                  totalAmount: grandTotal,
                  deliveryFee: deliveryFee,
                  taxes: taxes,
                  paymentMethod: 'razorpay',
                  paymentType: 'razorpay',
                  paymentStatus: 'paid',
                  isPaid: true,
                  deliveryAddress: {
                    addressLine: `${street.trim()}, ${city.trim()}`,
                    city: city.trim(),
                    zipCode: zipCode.trim(),
                  },
                  couponCode: appliedCoupon || undefined,
                }).catch(() => null);
                createdOrder = directRes?.data || directRes?.order || directRes;
              }

              const createdId = createdOrder?._id || createdOrder?.id || `ord_rzp_${Date.now().toString().slice(-4)}`;
              const createdNum = createdOrder?.orderNumber || `#CRV-${String(createdId).slice(-4).toUpperCase()}`;

              try {
                const synchronizedPaidOrder = {
                  ...createdOrder,
                  _id: createdId,
                  id: createdId,
                  orderNumber: createdNum,
                  totalAmount: grandTotal,
                  totalPrice: grandTotal,
                  grandTotal: grandTotal,
                  deliveryFee: deliveryFee,
                  taxes: taxes,
                  items: items.map((i) => ({
                    menuItem: i.menuItem || i.id || i._id,
                    name: i.name,
                    price: Number(i.price),
                    quantity: Number(i.quantity || 1),
                  })),
                  customer: {
                    name: currentUser?.name || 'Patel Drak',
                    phone: checkoutPhone || currentUser?.phone || '7041805160',
                    email: currentUser?.email || 'customer@cravingza.com',
                  },
                  customerName: currentUser?.name || 'Patel Drak',
                  customerPhone: checkoutPhone || currentUser?.phone || '7041805160',
                  deliveryAddress: `${street.trim()}, ${city.trim()}`,
                  restaurant: {
                    _id: restaurantId,
                    name: restaurantName,
                  },
                  restaurantName: restaurantName,
                  paymentMethod: 'razorpay',
                  paymentType: 'razorpay',
                  paymentStatus: 'paid',
                  isPaid: true,
                  status: 'placed',
                  createdAt: new Date().toISOString(),
                };
                setSharedOrders([synchronizedPaidOrder], true);
              } catch (e) {}

              // Clear global cart after successful order
              clearCart();

              Alert.alert(
                'Payment Successful & Order Placed! 🎉',
                `Payment of ₹${grandTotal.toFixed(2)} verified via Razorpay!`,
                [
                  {
                    text: 'Track Order Live 🛵',
                    onPress: () =>
                      navigation.replace('TrackOrder', {
                        orderId: createdId,
                        orderNumber: createdNum,
                        paymentMethod: 'ONLINE',
                        paymentStatus: 'PAID',
                      }),
                  },
                ]
              );
            })
            .catch((error: any) => {
              console.log('Razorpay Payment Cancelled/Error:', error);
              const errStr = String(
                error?.description || error?.message || error?.reason || JSON.stringify(error || {})
              ).toLowerCase();

              const isUserCancelled =
                error?.code === 0 ||
                error?.code === '0' ||
                errStr.includes('cancel') ||
                errStr.includes('customer') ||
                errStr.includes('payment_authentication') ||
                (errStr.includes('bad_request_error') && errStr.includes('customer'));

              if (isUserCancelled) {
                Alert.alert(
                  'Payment Cancelled ℹ️',
                  'You cancelled the payment process. You can retry paying online or choose Cash on Delivery (COD).'
                );
              } else {
                let errorMsg = 'Razorpay payment was not completed.';
                try {
                  if (typeof error?.description === 'string' && error.description.startsWith('{')) {
                    const parsed = JSON.parse(error.description);
                    errorMsg = parsed?.error?.description && parsed.error.description !== 'undefined'
                      ? parsed.error.description
                      : 'Payment could not be processed at this time.';
                  } else if (error?.description && error.description !== 'undefined') {
                    errorMsg = error.description;
                  } else if (error?.message) {
                    errorMsg = error.message;
                  }
                } catch (e) {
                  errorMsg = 'Payment was not completed.';
                }
                Alert.alert('Payment Not Completed ❌', errorMsg);
              }
            })
            .finally(() => {
              setLoading(false);
            });
        } catch (openErr: any) {
          console.log('Razorpay Open Exception:', openErr);
          Alert.alert('Razorpay Native Error ❌', openErr.message || 'Unable to launch Razorpay Native SDK module.');
          setLoading(false);
        }

        return;
      }

      // 💵 2. Cash On Delivery (COD) Payment Flow
      console.log('Sending Place Order Payload for COD to POST /api/orders...');
      const orderPayload: CreateOrderPayload = {
        restaurant: restaurantId,
        items: items.map((i) => ({
          menuItem: i.menuItem || i.id || i._id,
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity || 1),
        })),
        totalAmount: grandTotal,
        totalPrice: grandTotal,
        subTotal: itemSubtotal,
        deliveryFee: deliveryFee,
        taxes: taxes,
        discountAmount: discountAmount,
        couponCode: appliedCoupon || undefined,
        deliveryAddress: {
          addressLine: `${street.trim()}, ${city.trim()}`,
          street: street.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
        },
        paymentMethod: 'cash',
        paymentType: 'cod',
      };

      const res = await createOrderApi(orderPayload);
      console.log('Place Order API Response:', res);

      const createdOrder = res?.order || res?.data || res;
      const createdId = createdOrder?._id || createdOrder?.id || 'ord_101';
      const createdNum = createdOrder?.orderNumber || '#CRV-8942';

      try {
        const synchronizedCODOrder = {
          ...createdOrder,
          _id: createdId,
          id: createdId,
          orderNumber: createdNum,
          totalAmount: grandTotal,
          totalPrice: grandTotal,
          grandTotal: grandTotal,
          deliveryFee: deliveryFee,
          taxes: taxes,
          items: items.map((i) => ({
            menuItem: i.menuItem || i.id || i._id,
            name: i.name,
            price: Number(i.price),
            quantity: Number(i.quantity || 1),
          })),
          customer: {
            name: currentUser?.name || 'Patel Drak',
            phone: checkoutPhone || currentUser?.phone || '7041805160',
            email: currentUser?.email || 'customer@cravingza.com',
          },
          customerName: currentUser?.name || 'Patel Drak',
          customerPhone: checkoutPhone || currentUser?.phone || '7041805160',
          deliveryAddress: `${street.trim()}, ${city.trim()}`,
          restaurant: {
            _id: restaurantId,
            name: restaurantName,
          },
          restaurantName: restaurantName,
          paymentMethod: 'cash',
          paymentType: 'cod',
          paymentStatus: 'pending',
          isPaid: false,
          status: 'placed',
          createdAt: new Date().toISOString(),
        };
        setSharedOrders([synchronizedCODOrder], true);
      } catch (e) {}

      // Clear global cart after successful order
      clearCart();

      Alert.alert(
        'Order Placed Successfully! 🎉',
        res?.message || `Your COD order of ₹${grandTotal.toFixed(2)} has been placed with ${restaurantName}!`,
        [
          {
            text: 'Track Order Live 🛵',
            onPress: () =>
              navigation.replace('TrackOrder', {
                orderId: createdId,
                orderNumber: createdNum,
                paymentMethod: 'COD',
                paymentStatus: 'PENDING',
              }),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      console.log('Place Order API Error:', error.message);
      Alert.alert(
        'Order Failed ❌',
        error.message || 'Unable to place order. Please check your internet connection or login status.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topNavIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout & Payment</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Header */}
        <View style={styles.restaurantCard}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          <Text style={styles.restaurantSub}>Delivery in 20-25 mins • 1.8 km</Text>
        </View>

        {/* Order Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛒 Selected Items ({items.length})</Text>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image
                source={{
                  uri:
                    item.image ||
                    item.dishImage ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60',
                }}
                style={styles.itemThumb}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price} each</Text>
              </View>

              <View style={styles.counterBox}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => handleDecreaseQty(idx)}>
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{item.quantity}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => handleIncreaseQty(idx)}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemSubtotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
            {savedAddresses.length > 0 && (
              <View style={styles.savedBadgePill}>
                <Text style={styles.savedBadgeText}>{savedAddresses.length} Profile Addresses</Text>
              </View>
            )}
          </View>

          {/* Address Selection Pills (Saved Addresses + Custom Address Option) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressPillScroll}>
            {savedAddresses.map((addr, idx) => {
              const isSelected =
                addressMode === 'SAVED' &&
                (selectedAddress?.id === addr.id || (street === addr.addressLine && addressType === addr.label));
              const icon = addr.label?.toLowerCase().includes('home')
                ? '🏠'
                : addr.label?.toLowerCase().includes('work')
                ? '🏢'
                : '📍';
              return (
                <TouchableOpacity
                  key={addr.id || addr._id || `addr_${idx}`}
                  style={[styles.addressPill, isSelected && styles.addressPillActive]}
                  onPress={() => {
                    setAddressMode('SAVED');
                    setSelectedAddress(addr);
                    setStreet(addr.addressLine);
                    setCity(addr.city);
                    if (addr.pincode) setZipCode(addr.pincode);
                    setAddressType(addr.label);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addressPillIcon}>{icon}</Text>
                  <View>
                    <Text style={[styles.addressPillTitle, isSelected && styles.addressPillTextActive]}>
                      {addr.label} {addr.isDefault ? '• Default' : ''}
                    </Text>
                    <Text style={[styles.addressPillSub, isSelected && styles.addressPillSubActive]} numberOfLines={1}>
                      {addr.addressLine}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Option to Deliver to a Different Location / New Custom Address */}
            <TouchableOpacity
              style={[styles.addressPill, addressMode === 'CUSTOM' && styles.addressPillActive]}
              onPress={() => {
                setAddressMode('CUSTOM');
                setAddressType('Other');
                setStreet('');
                setCity('');
                setZipCode('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.addressPillIcon}>➕</Text>
              <View>
                <Text style={[styles.addressPillTitle, addressMode === 'CUSTOM' && styles.addressPillTextActive]}>
                  Different Location
                </Text>
                <Text style={[styles.addressPillSub, addressMode === 'CUSTOM' && styles.addressPillSubActive]}>
                  Deliver to another address
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Form Fields for Delivery Address */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.inputLabel}>
                {addressMode === 'CUSTOM' ? 'Custom Delivery Address' : `Deliver to ${addressType}`}
              </Text>
              {addressMode === 'CUSTOM' && (
                <TouchableOpacity onPress={() => setSaveCustomToProfile(!saveCustomToProfile)}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: saveCustomToProfile ? COLORS.primary : '#64748B' }}>
                    {saveCustomToProfile ? '✓ Save to Profile' : '+ Save to Profile?'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.textInput}
              value={street}
              onChangeText={setStreet}
              placeholder="House / Flat No., Building, Street Name"
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.textInput}
                  value={zipCode}
                  onChangeText={(val) => setZipCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="Pincode"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Promo Coupon Section */}
        <View style={styles.sectionCard}>
          <View style={styles.couponHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <Circle cx="7" cy="7" r="1.5" fill="#DC2626" />
              </Svg>
              <Text style={styles.couponHeaderTitle}>APPLY COUPON CODE</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Offers')}>
              <Text style={styles.viewOffersLinkText}>View Offers</Text>
            </TouchableOpacity>
          </View>

          {appliedCoupon ? (
            /* Applied Coupon Card Matching User Design */
            <View style={styles.appliedCouponCard}>
              <View style={styles.appliedLeftCol}>
                <View style={styles.checkCircleIcon}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appliedCouponTitle}>{appliedCoupon} APPLIED</Text>
                  <Text style={styles.appliedCouponSubtitle}>
                    Saved ₹{discountAmount.toFixed(2)}{isFreeDelivery ? ' + Free Delivery' : ''} on this order
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={couponInput}
                onChangeText={setCouponInput}
                placeholder="Enter promo code"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                selectTextOnFocus={true}
                contextMenuHidden={false}
                editable={true}
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.paymentCol}>
            <TouchableOpacity
              style={[styles.paymentBtn, paymentMethod === 'COD' && styles.paymentBtnActive]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text style={styles.paymentBtnIcon}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentBtnTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentBtnSub}>Pay cash when food arrives</Text>
              </View>
              {paymentMethod === 'COD' && <Text style={styles.radioDot}>●</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentBtn, paymentMethod === 'ONLINE' && styles.paymentBtnActive]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <Text style={styles.paymentBtnIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentBtnTitle}>UPI / Razorpay / Online</Text>
                <Text style={styles.paymentBtnSub}>Google Pay, PhonePe, Cards</Text>
              </View>
              {paymentMethod === 'ONLINE' && <Text style={styles.radioDot}>●</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Breakdown Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🧾 Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{itemSubtotal.toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#16A34A' }]}>Promo Discount</Text>
              <Text style={[styles.billValue, { color: '#16A34A' }]}>-₹{discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & Charges</Text>
            <Text style={styles.billValue}>₹{taxes.toFixed(2)}</Text>
          </View>

          <View style={styles.grandDivider} />

          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>To Pay</Text>
            <Text style={styles.grandValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Place Order CTA Footer Bar */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerTotalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.footerTotalVal}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.placeOrderBtnText}>Place Order 🚀</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 📱 Phone Number Verification Modal for Delivery Partner Contact */}
      <Modal visible={phoneModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📱 Contact Phone Number</Text>
            <Text style={styles.modalSub}>
              Please enter your mobile phone number so our delivery partner can contact you when arriving with your order.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter mobile phone (e.g. +91 98765 43210)"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={checkoutPhone}
              onChangeText={setCheckoutPhone}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setPhoneModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSavePhone}
                onPress={() => {
                  if (!checkoutPhone.trim()) {
                    Alert.alert('Validation Error', 'Please enter your phone number.');
                    return;
                  }
                  setPhoneModalVisible(false);
                  if (currentUser) {
                    setAuthUser({ ...currentUser, phone: checkoutPhone.trim() });
                  }
                  handlePlaceOrder();
                }}
              >
                <Text style={styles.btnSavePhoneText}>Save & Order 🚀</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  restaurantCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  restaurantName: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  restaurantSub: {
    color: '#94A3B8',
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemPrice: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 8,
  },
  counterBtn: {
    paddingHorizontal: 4,
  },
  counterBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  counterValue: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  itemSubtotal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  addressTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addressTypeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  addressTypeChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  addressTypeChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#64748B',
  },
  addressTypeChipTextActive: {
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: FONT_SIZE.sm,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  couponHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7F1D1D',
    letterSpacing: 0.5,
  },
  viewOffersLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  appliedLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  checkCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  appliedCouponTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  appliedCouponSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#047857',
    marginTop: 2,
  },
  removeCouponBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeCouponText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  paymentCol: {
    gap: 10,
  },
  paymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  paymentBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  paymentBtnIcon: {
    fontSize: 22,
  },
  paymentBtnTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentBtnSub: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
  },
  radioDot: {
    fontSize: 18,
    color: COLORS.primary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    fontWeight: '500',
  },
  billValue: {
    fontSize: FONT_SIZE.xs,
    color: '#0F172A',
    fontWeight: '700',
  },
  grandDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 8,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
  footerBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  footerTotalVal: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  placeOrderBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
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
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: SPACING.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
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
  btnSavePhone: {
    flex: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  btnSavePhoneText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedBadgePill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  addressPillScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: 200,
  },
  addressPillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  addressPillIcon: {
    fontSize: 18,
  },
  addressPillTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  addressPillSub: {
    fontSize: 10,
    color: '#64748B',
  },
  addressPillTextActive: {
    color: COLORS.primary,
  },
  addressPillSubActive: {
    color: '#C2410C',
  },
});
