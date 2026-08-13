// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getRestaurantByIdApi, createOrderApi } from '../services/customerApi';
import { useCart } from '../../../context/CartContext';

export interface MenuDish {
  id: string;
  name: string;
  category: string;
  price: number;
  rating?: number;
  description: string;
  isVeg: boolean;
  isBestseller?: boolean;
  image?: string;
}

export const RestaurantDetailScreen = ({ route, navigation }: any) => {
  const { addToCart: addGlobalCart, removeFromCart: removeGlobalCart, cartCount } = useCart();
  const restaurantId = route?.params?.restaurantId;
  const initialName = route?.params?.restaurantName || 'Jassi De Parathe';
  const initialCover =
    route?.params?.coverImage ||
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';

  // 🔹 Live API & UI States
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [menuDishes, setMenuDishes] = useState<MenuDish[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isVegOnly, setIsVegOnly] = useState(false);
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});

  // 🛒 Checkout & Cart Modal States
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [streetAddress, setStreetAddress] = useState('');
  const [cityAddress, setCityAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE' | 'UPI'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // 🏷️ Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleApplyCouponModal = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Validation Error', 'Please enter a promo code.');
      return;
    }

    try {
      console.log(`Applying Coupon via POST /api/coupons/apply (${code})...`);
      const res = await applyCouponApi({
        code,
        cartTotal: totalCartPrice,
      });
      const discount = res?.discountAmount || res?.data?.discountAmount || 150;
      setDiscountAmount(discount);
      setAppliedCoupon(code);
      Alert.alert('Coupon Applied! 🎉', res?.message || `Code ${code} applied! Saved ₹${discount}`);
    } catch (error: any) {
      if (code === 'CRAVE30') {
        const discount = Math.min(150, Math.round(totalCartPrice * 0.3));
        setDiscountAmount(discount);
        setAppliedCoupon('CRAVE30');
        Alert.alert('Coupon Applied! 🎉', `Code CRAVE30 saved you ₹${discount}!`);
      } else if (code === 'FREEDEL') {
        setDiscountAmount(25);
        setAppliedCoupon('FREEDEL');
        Alert.alert('Coupon Applied! 🎉', 'Free Delivery unlocked!');
      } else {
        Alert.alert('Invalid Coupon ❌', 'Invalid coupon code. Try CRAVE30 or FREEDEL.');
      }
    }
  };

  // 🔹 Fetch Restaurant Details & Menu Items from Backend API
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
    } else {
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const res = await getRestaurantByIdApi(restaurantId);
      console.log('Live Restaurant Detail Response:', res);

      const apiData = res.data || res;
      if (apiData) {
        setRestaurantData(apiData.restaurant || apiData);
        const apiMenu = apiData.menu || apiData.menuItems;

        if (Array.isArray(apiMenu) && apiMenu.length > 0) {
          const formattedMenu: MenuDish[] = apiMenu.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category || 'Main Course',
            price: item.price,
            rating: item.rating || 4.8,
            description: item.description || 'Delicious gourmet freshly prepared dish.',
            isVeg: item.isVeg ?? true,
            isBestseller: item.isBestseller ?? false,
            image:
              item.image ||
              'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60',
          }));
          setMenuDishes(formattedMenu);
        } else {
          setMenuDishes([]);
        }
      } else {
        setMenuDishes([]);
      }
    } catch (error: any) {
      console.log('Fetch Restaurant Details Error:', error.message);
      setMenuDishes([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cart Operations
  const handleAddToCart = (dishId: string) => {
    const dish = menuDishes.find((d) => d.id === dishId) || { id: dishId, name: 'Item', price: 149 };
    addGlobalCart(dish, restaurantId || '6a71cf90ab29fa88687723b4', currentName);
    setCartItems((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (dishId: string) => {
    removeGlobalCart(dishId);
    setCartItems((prev) => {
      const currentQty = prev[dishId] || 0;
      if (currentQty <= 1) {
        const updated = { ...prev };
        delete updated[dishId];
        return updated;
      }
      return {
        ...prev,
        [dishId]: currentQty - 1,
      };
    });
  };

  const totalCartCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const totalCartPrice = Object.entries(cartItems).reduce((sum, [dishId, qty]) => {
    const dish = menuDishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * qty : 0);
  }, 0);

  // 🚀 Navigate to Full Checkout & Payment Screen
  const handleProceedToCheckout = () => {
    const orderItemsPayload = Object.entries(cartItems).map(([dishId, qty]) => {
      const dish = menuDishes.find((d) => d.id === dishId);
      return {
        menuItem: dishId,
        name: dish?.name || 'Delicious Dish',
        price: dish?.price || 199,
        quantity: qty,
        image:
          dish?.image ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60',
      };
    });

    if (orderItemsPayload.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart before placing an order.');
      return;
    }

    setIsCartModalVisible(false);

    navigation.navigate('Checkout', {
      restaurantId: restaurantId || '6a71cf90ab29fa88687723b4',
      restaurantName: currentName,
      cartItems: orderItemsPayload,
    });
  };

  const handlePlaceOrder = handleProceedToCheckout;

  const filteredDishes = isVegOnly ? menuDishes.filter((dish) => dish.isVeg) : menuDishes;

  const currentName = restaurantData?.name || initialName;
  const currentCover = restaurantData?.bannerImage || restaurantData?.image || initialCover;
  const currentRating = restaurantData?.rating || 4.8;
  const currentDeliveryTime = restaurantData?.deliveryTime || '20-25 min';
  const currentCuisine = restaurantData?.cuisineTags
    ? restaurantData.cuisineTags.join(' • ')
    : 'Pizza • Italian • Gourmet';

  // 🎨 FlatList Header (Cover Image, Title Card, Promo Box, Veg Switch)
  const renderRestaurantHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Restaurant Cover Banner Image */}
      <Image source={{ uri: currentCover }} style={styles.coverImage} resizeMode="cover" />

      {/* Restaurant Info Header Card */}
      <View style={styles.restaurantInfoCard}>
        <Text style={styles.restaurantTitle}>{currentName}</Text>
        <Text style={styles.cuisineText}>{currentCuisine}</Text>

        <View style={styles.ratingLocationRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>⭐ {currentRating} (500+)</Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.deliveryTimeText}>⏱️ {currentDeliveryTime}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.deliveryTimeText}>📍 1.8 km</Text>
        </View>

        {/* Promo Offer Card */}
        <View style={styles.promoOfferBox}>
          <Text style={styles.promoOfferIcon}>🏷️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoOfferTitle}>30% OFF up to ₹150</Text>
            <Text style={styles.promoOfferSub}>Use code CRAVE30 | On orders above ₹300</Text>
          </View>
        </View>

        {/* Veg Only Toggle Switch Bar */}
        <View style={styles.vegFilterRow}>
          <View style={styles.vegLabelContainer}>
            <View style={styles.vegDotBorder}>
              <View style={styles.vegGreenDot} />
            </View>
            <Text style={styles.vegFilterLabel}>Veg Only</Text>
          </View>
          <Switch
            value={isVegOnly}
            onValueChange={setIsVegOnly}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={isVegOnly ? '#16A34A' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Menu Section Header */}
      <View style={styles.menuSectionHeader}>
        <Text style={styles.menuSectionTitle}>Recommended Dishes</Text>
        <Text style={styles.dishesCountText}>{filteredDishes.length} Items</Text>
      </View>
    </View>
  );

  // 🎨 FlatList Item Renderer (Each Dish Card)
  const renderDishCard = ({ item }: { item: MenuDish }) => {
    const quantity = cartItems[item.id] || 0;

    return (
      <View key={item.id} style={styles.dishCard}>
        <View style={styles.dishInfo}>
          <View style={styles.dishHeaderRow}>
            <View style={item.isVeg ? styles.vegBorder : styles.nonVegBorder}>
              <View style={item.isVeg ? styles.vegDot : styles.nonVegDot} />
            </View>

            {item.isBestseller && (
              <View style={styles.bestsellerTag}>
                <Text style={styles.bestsellerText}>⭐ Bestseller</Text>
              </View>
            )}
          </View>

          <Text style={styles.dishName}>{item.name}</Text>
          <Text style={styles.dishPrice}>₹{item.price.toFixed(2)}</Text>
          <Text style={styles.dishDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Dish Image & Add to Cart Counter Button */}
        <View style={styles.dishRightAction}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.dishImage} resizeMode="cover" />
          )}

          <View style={styles.cartActionWrapper}>
            {quantity === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => handleAddToCart(item.id)}
              >
                <Text style={styles.addBtnText}>ADD +</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityCounter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => handleRemoveFromCart(item.id)}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.counterValueText}>{quantity}</Text>

                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => handleAddToCart(item.id)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyMenu = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🍽️</Text>
      <Text style={styles.emptyTitle}>No Dishes Available</Text>
      <Text style={styles.emptySubtitle}>
        This restaurant has not added any active menu items yet.
      </Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Floating Top Header Navigation */}
        <View style={styles.topHeaderNav}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.topNavIconText}>←</Text>
          </TouchableOpacity>

          <View style={styles.rightNavIcons}>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={handlePlaceOrder}>
              <Text style={styles.topNavIconText}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.topCartBadge}>
                  <Text style={styles.topCartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 🏆 Industry FlatList for Food Menu Dishes */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching menu dishes...</Text>
          </View>
        ) : (
          <FlatList
            style={styles.flatListStyle}
            data={filteredDishes}
            keyExtractor={(item) => item.id}
            renderItem={renderDishCard}
            ListHeaderComponent={renderRestaurantHeader}
            ListEmptyComponent={renderEmptyMenu}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Bottom Cart Bar */}
        {totalCartCount > 0 && (
          <View style={styles.floatingCartBar}>
            <View>
              <Text style={styles.cartItemsCountText}>
                {totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'}
              </Text>
              <Text style={styles.cartTotalPriceText}>₹{totalCartPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.viewCartBtn}
              onPress={handleProceedToCheckout}
            >
              <Text style={styles.viewCartBtnText}>View Cart →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 🛒 Checkout & Cart Modal */}
        <Modal
          visible={isCartModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsCartModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              {/* Modal Header */}
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalHeaderTitle}>Order Checkout 🛍️</Text>
                  <Text style={styles.modalHeaderSub}>{currentName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsCartModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollBody}>
                {/* Cart Items List */}
                <Text style={styles.modalSectionTitle}>Items in Cart</Text>
                {Object.entries(cartItems).map(([dishId, qty]) => {
                  const dish = menuDishes.find((d) => d.id === dishId);
                  if (!dish) return null;
                  return (
                    <View key={dishId} style={styles.cartModalItemRow}>
                      <Image
                        source={{
                          uri:
                            dish.image ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=60',
                        }}
                        style={styles.cartModalItemImage}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartModalItemName}>{dish.name}</Text>
                        <Text style={styles.cartModalItemPrice}>₹{dish.price} each</Text>
                      </View>

                      <View style={styles.quantityCounter}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => handleRemoveFromCart(dishId)}
                        >
                          <Text style={styles.counterBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterValueText}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => handleAddToCart(dishId)}
                        >
                          <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cartModalItemSubtotal}>
                        ₹{(dish.price * qty).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}

                {/* Bill Breakdown Card */}
                <View style={styles.billBreakdownCard}>
                  <Text style={styles.modalSectionTitle}>🧾 Cart Summary</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{totalCartPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Est. Delivery & Taxes</Text>
                    <Text style={styles.billValue}>₹60.00</Text>
                  </View>
                  <View style={[styles.billRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Total Amount</Text>
                    <Text style={styles.grandTotalValue}>
                      ₹{(totalCartPrice + 60).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer Action Button */}
              <View style={styles.modalFooterBar}>
                <TouchableOpacity
                  style={styles.placeOrderBtn}
                  onPress={handleProceedToCheckout}
                >
                  <Text style={styles.placeOrderBtnText}>
                    Proceed to Checkout • ₹{(totalCartPrice + 60).toFixed(2)} ➡️
                  </Text>
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
  flatListStyle: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  headerWrapper: {
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  topFloatingHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingNavIcon: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  topCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topHeaderNav: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightNavIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  topNavIconText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  restaurantInfoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: -30,
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  restaurantTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  cuisineText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  ratingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  ratingBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  dotSeparator: {
    color: '#94A3B8',
    fontSize: 12,
  },
  deliveryTimeText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  promoOfferBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    gap: 10,
  },
  promoOfferIcon: {
    fontSize: 18,
  },
  promoOfferTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  promoOfferSub: {
    fontSize: 10,
    color: '#9A3412',
    marginTop: 1,
  },
  vegFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vegLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegDotBorder: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  vegFilterLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  menuSectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  dishesCountText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  dishCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dishHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  vegBorder: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  nonVegBorder: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  bestsellerTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  dishName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  dishPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  dishDescription: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  dishRightAction: {
    alignItems: 'center',
    position: 'relative',
  },
  dishImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cartActionWrapper: {
    marginTop: -14,
  },
  addBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  quantityCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  counterBtn: {
    paddingHorizontal: 4,
  },
  counterBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  counterValueText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cartItemsCountText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cartTotalPriceText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  viewCartBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewCartBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: SPACING.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    fontWeight: '600',
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  modalScrollBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  modalSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.xs,
  },
  cartModalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  cartModalItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cartModalItemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartModalItemPrice: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
  },
  cartModalItemSubtotal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  addressSectionBox: {
    marginTop: SPACING.md,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: FONT_SIZE.sm,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  paymentMethodBox: {
    marginTop: SPACING.md,
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  paymentOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF7ED',
  },
  paymentOptionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#64748B',
  },
  paymentOptionTextActive: {
    color: COLORS.primary,
  },
  billBreakdownCard: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 8,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalFooterBar: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: COLORS.white,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  placeOrderBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
