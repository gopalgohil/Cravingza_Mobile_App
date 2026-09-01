// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getRestaurantsApi } from '../services/customerApi';
import { CATEGORIES } from '../constants/categories';
import { apiClient } from '../../../services/apiClient';
import { RestaurantCardSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { subscribeCustomerNotif } from '../../../services/orderSyncStore';
import { subscribeToOrderUpdates } from '../../../services/socketService';

const renderNavIcon = (name: string, active: boolean) => {
  const color = active ? COLORS.primary : '#94A3B8';
  const size = 22;

  switch (name) {
    case 'Home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <Path d="M9 22V12h6v10" fill={active ? '#FFF' : 'none'} />
        </Svg>
      );
    case 'Offers':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <Circle cx="7" cy="7" r="1.5" fill={active ? '#FFF' : color} />
        </Svg>
      );
    case 'Orders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <Path d="M3 6h18" />
          <Path d="M16 10a4 4 0 01-8 0" />
        </Svg>
      );
    case 'Profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? COLORS.primary : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    default:
      return null;
  }
};

const getRestaurantCardImage = (item: any) => {
  const isPizza =
    item.category?.toLowerCase().includes('pizza') ||
    item.name?.toLowerCase().includes('pizza') ||
    item.restaurant?.toLowerCase().includes('pizza') ||
    (Array.isArray(item.cuisine) && item.cuisine.some((c: string) => c.toLowerCase().includes('pizza')));

  if (isPizza) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
  }

  if (item.image && item.image.startsWith('http')) {
    return item.image;
  }

  if (item.coverImage && item.coverImage.startsWith('http')) {
    return item.coverImage;
  }

  return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
};

import { useAddress } from '../../../context/AddressContext';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { CustomerBottomNav } from '../components/CustomerBottomNav';

export const HomeScreen = ({ navigation }: any) => {
  const { currentUser } = useAuth();
  const { selectedAddress, fetchUserAddresses } = useAddress();
  const { cartCount, getCartList, restaurantId, restaurantName } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('Home');

  // 🔹 Auto-redirect Restaurant Owners to Restaurant Admin Dashboard
  useEffect(() => {
    if (currentUser) {
      const role = String(currentUser.role || '').toLowerCase();
      const email = String(currentUser.email || '').toLowerCase();
      if (
        role === 'restaurant_owner' ||
        role === 'restaurant' ||
        role === 'owner' ||
        role === 'merchant' ||
        email.includes('owner') ||
        email.includes('restaurant')
      ) {
        console.log('Auto-redirecting Restaurant Owner to RestaurantOwnerLayout...');
        navigation.replace('RestaurantOwnerLayout');
        return;
      }
      fetchUserAddresses();
    }
  }, [currentUser]);

  // 🔹 Search & Debounce States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 🔹 Live API States & Pull-to-Refresh
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 🔹 Real-Time Customer Notification States
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif_welcome',
      title: 'Welcome to Cravingza! 🍕',
      message: 'Explore top restaurants near you & get instant live order tracking!',
      time: 'Just now',
      read: false,
    },
  ]);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const prevOrderStatusesRef = useRef<Record<string, string>>({});

  // 🔹 Check Real-Time Order Updates from Restaurant Admin
  const checkOrderNotifications = React.useCallback(async () => {
    try {
      const res = await apiClient('/orders');
      const orderList = res?.orders || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(orderList) && orderList.length > 0) {
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          const oldSt = prevOrderStatusesRef.current[idStr];
          const newSt = (o.status || '').toLowerCase();

          if (oldSt && oldSt.toLowerCase() !== newSt) {
            const restName = o.restaurant?.name || o.restaurantName || 'Restaurant Partner';
            const ordNum = o.orderNumber || `#CRV-${String(idStr).slice(-4).toUpperCase()}`;

            let notifTitle = 'Order Update 📦';
            let notifMsg = `Order ${ordNum} status changed to ${newSt.toUpperCase()}`;

            if (['preparing', 'accepted'].includes(newSt)) {
              notifTitle = 'Order Accepted & Preparing! 👨‍🍳';
              notifMsg = `${restName} accepted your order ${ordNum} and started preparing your food!`;
            } else if (['out_for_delivery', 'picked_up'].includes(newSt)) {
              notifTitle = 'Out for Delivery! 🛵';
              notifMsg = `Your order ${ordNum} from ${restName} is out for delivery! Rider is on the way.`;
            } else if (['delivered', 'completed'].includes(newSt)) {
              notifTitle = 'Order Delivered! 🎉';
              notifMsg = `Your order ${ordNum} from ${restName} has been delivered successfully. Enjoy your meal!`;
            } else if (['cancelled', 'rejected'].includes(newSt)) {
              notifTitle = 'Order Declined ❌';
              notifMsg = `We're sorry, your order ${ordNum} was declined by ${restName}.`;
            }

            const newNotif = {
              id: `notif_${Date.now()}_${idStr}`,
              title: notifTitle,
              message: notifMsg,
              time: 'Just now',
              read: false,
              orderId: idStr,
            };

            setNotifications((prev) => [newNotif, ...prev]);
          }
        });

        // Store current statuses
        const statusMap: Record<string, string> = {};
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          statusMap[idStr] = o.status;
        });
        prevOrderStatusesRef.current = statusMap;
      }
    } catch (err: any) {
      console.log('Customer Notification Check Note:', err.message);
    }
  }, []);

  // 🔹 Real-Time WebSockets (Socket.io) Instant Push Alerts + Initial Load
  useEffect(() => {
    checkOrderNotifications();

    const unsubscribeSocket = subscribeToOrderUpdates((orderData) => {
      console.log('⚡ [HomeScreen] Received Real-Time Socket.io Order Event:', orderData);
      checkOrderNotifications();
    });

    const unsubscribeSync = subscribeCustomerNotif((notifObj) => {
      setNotifications((prev) => [notifObj, ...prev]);
    });

    return () => {
      unsubscribeSocket();
      unsubscribeSync();
    };
  }, [checkOrderNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 🔹 400ms Debounce Effect for Industry-Standard Search API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 🔹 Fetch Live Data & Auto-Poll every 4 seconds for Live Open/Close Sync
  useEffect(() => {
    loadLiveRestaurants(debouncedQuery);

    const intervalId = setInterval(() => {
      loadLiveRestaurants(debouncedQuery);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [debouncedQuery]);

  const loadLiveRestaurants = async (search?: string) => {
    try {
      if (!search && restaurants.length === 0) {
        setLoading(true);
      }
      const res = await getRestaurantsApi(search);
      console.log('Live Restaurants Response from MongoDB Atlas:', res);

      const list =
        (Array.isArray(res?.restaurants) && res.restaurants) ||
        (Array.isArray(res?.data?.restaurants) && res.data.restaurants) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res) && res) ||
        [];

      setRestaurants(list);
    } catch (error: any) {
      console.log('Fetch Live Restaurants Error:', error.message);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLiveRestaurants(debouncedQuery);
    setRefreshing(false);
  };

  const filteredItems =
    selectedCategory === 'All'
      ? restaurants
      : restaurants.filter((item) => {
        const selected = selectedCategory.toLowerCase();
        const query = selected.endsWith('s') && selected.length > 3 ? selected.slice(0, -1) : selected;

        // Special fallback mapping for 'Indian' category
        if (selected === 'indian') {
          const isIndianFood =
            item.category?.toLowerCase().includes('biryani') ||
            item.category?.toLowerCase().includes('indian') ||
            item.name?.toLowerCase().includes('biryani') ||
            item.name?.toLowerCase().includes('indian') ||
            item.restaurant?.toLowerCase().includes('biryani') ||
            item.restaurant?.toLowerCase().includes('indian') ||
            item.cuisineTags?.some((tag: string) => tag.toLowerCase().includes('indian') || tag.toLowerCase().includes('biryani'));
          if (isIndianFood) return true;
        }
        return (
          item.category?.toLowerCase().includes(query) ||
          item.name?.toLowerCase().includes(query) ||
          item.restaurant?.toLowerCase().includes(query) ||
          (Array.isArray(item.cuisineTags) && item.cuisineTags.some((tag: string) => tag.toLowerCase().includes(query)))
        );
      });

  const renderHeader = React.useCallback(
    () => (
      <View>
        {/* Promo Hero Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <View style={styles.promoBadgeContainer}>
              <Text style={styles.promoBadgeText}>🔥 TONIGHT'S SPECIAL</Text>
            </View>
            <Text style={styles.promoTitle}>30% OFF ALL PIZZAS!</Text>
            <Text style={styles.promoSubtitle}>Use code CRAVE30 at checkout</Text>

            <TouchableOpacity style={styles.claimBtn} onPress={() => setSelectedCategory('Pizza')}>
              <Text style={styles.claimBtnText}>Order Now →</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
            }}
            style={styles.promoImage}
            resizeMode="cover"
          />
        </View>

        {/* Categories Horizontal Carousel (Imported from CATEGORIES constant) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                selectedCategory === cat.name && styles.categoryCardActive,
              ]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.name && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Partner With Cravingza Banner Card */}
        <View style={styles.partnerBannerCard}>
          <View>
            <Text style={styles.partnerBannerBadge}>GROW & EARN WITH US</Text>
            <Text style={styles.partnerBannerTitle}>Partner With Cravingza</Text>
            <Text style={styles.partnerBannerSub}>
              Register your restaurant or sign up as a delivery partner
            </Text>
          </View>
          <View style={styles.partnerBannerActions}>
            <TouchableOpacity
              style={styles.partnerBannerBtn}
              onPress={() => navigation.navigate('PartnerOnboarding', { initialMode: 'restaurant' })}
            >
              <Text style={styles.partnerBannerBtnText}>Add Restaurant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.partnerBannerBtn, { backgroundColor: '#EA580C', borderColor: '#EA580C' }]}
              onPress={() => navigation.navigate('PartnerOnboarding', { initialMode: 'delivery' })}
            >
              <Text style={[styles.partnerBannerBtnText, { color: COLORS.white }]}>Ride & Earn</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Restaurants Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Restaurants Near You</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [selectedCategory, navigation]
  );

  const renderRestaurantItem = ({ item }: { item: any }) => {
    const isClosed = item.isOpen === false;

    return (
      <TouchableOpacity
        style={[styles.heroCard, isClosed && { opacity: 0.88 }]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('RestaurantDetail', {
            restaurant: item,
            id: item._id || item.id,
          })
        }
      >
        <View style={styles.heroImageContainer}>
          <Image
            source={{
              uri:
                item.image ||
                item.coverImageUrl ||
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {isClosed ? (
            <View style={styles.closedOverlayContainer}>
              <View style={styles.closedLockPill}>
                <Text style={styles.closedLockPillText}>🔒 CURRENTLY CLOSED</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Floating Offer Badge Top Left */}
              <View style={styles.heroBadgeOffer}>
                <Text style={styles.heroBadgeOfferText}>
                  {item.offerDiscountPercentage ? `${item.offerDiscountPercentage}% OFF` : (item.badge || item.offer || '30% OFF')}
                </Text>
              </View>

              {/* Floating Green Rating Badge Top Right */}
              <View style={styles.heroBadgeRating}>
                <Text style={styles.heroBadgeRatingText}>★ {item.rating || 4.8} (500+)</Text>
              </View>
            </>
          )}
        </View>

        {/* Card Info Body */}
        <View style={styles.heroBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={styles.heroTitle} numberOfLines={1}>{item.name || item.restaurant}</Text>
            {isClosed && (
              <View style={styles.pausedStatusBadge}>
                <Text style={styles.pausedStatusBadgeText}>Paused</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroCuisine} numberOfLines={1}>
            {Array.isArray(item.cuisineTags) ? item.cuisineTags.join(' • ') : (item.cuisine || 'Pizza • Italian • Gourmet')}
          </Text>

          <View style={styles.heroFooterRow}>
            <Text style={[styles.heroTime, isClosed && { color: '#E11D48', fontWeight: '700' }]}>
              {isClosed ? '🏪 Not accepting orders right now' : `⏱️ ${item.deliveryTime || '20-25 min'}`}
            </Text>
            <View style={styles.heroViewMenuBtn}>
              <Text style={styles.heroViewMenuBtnText}>View Menu →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🍽️</Text>
      <Text style={styles.emptyTitle}>No Restaurants Found</Text>
      <Text style={styles.emptySubtitle}>
        Pull down to refresh or check back later for new restaurant additions.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Location Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentUser && selectedAddress && selectedAddress.addressLine ? (
            <>
              <Text style={styles.deliverLabel}>Deliver to</Text>
              <TouchableOpacity style={styles.locationSelector} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  📍 {selectedAddress.label || 'Home'} ({selectedAddress.addressLine})
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.locationSelector} onPress={() => currentUser ? navigation.navigate('Profile') : navigation.navigate('Login')}>
              <Text style={styles.brandTitleText}>Cravingza</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell: Only when logged in */}
          {currentUser && (
            <TouchableOpacity
              style={styles.iconBadgeBtn}
              onPress={() => {
                navigation.navigate('Notifications');
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 01-3.46 0" />
              </Svg>
              {unreadCount > 0 ? (
                <View style={styles.notificationNumberBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              ) : (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
          )}

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.iconBadgeBtn}
            onPress={() => {
              if (cartCount === 0) {
                Alert.alert('Cart Empty 🛒', 'Your cart is empty. Add delicious items from any restaurant!');
              } else {
                navigation.navigate('Checkout', {
                  restaurantId,
                  restaurantName,
                  cartItems: getCartList(),
                });
              }
            }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="9" cy="21" r="1" />
              <Circle cx="20" cy="21" r="1" />
              <Path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </Svg>
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Login Pill Button (Guest Mode Only) */}
          {!currentUser && (
            <TouchableOpacity
              style={styles.headerLoginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerLoginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Fixed Search Bar (Swiggy/Zomato Industry Standard) */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search for food, restaurants, cravings..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.filterBtnIcon}>❌</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FlatList with Live API */}
      {loading && !refreshing ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <React.Fragment key="header_skel">{renderHeader()}</React.Fragment>
          <RestaurantCardSkeleton key="skel_1" />
          <RestaurantCardSkeleton key="skel_2" />
          <RestaurantCardSkeleton key="skel_3" />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderRestaurantCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      {/* Bottom Navigation Tab Bar */}
      <CustomerBottomNav activeTab="Home" navigation={navigation} />

      {/* Real-time Customer Notifications Modal */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalContainer}>
            <View style={styles.notifModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
                <Text style={styles.notifModalTitle}>Notifications & Order Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.notifModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {notifications.length === 0 ? (
                <Text style={styles.noNotifText}>No notifications right now.</Text>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.notifItemCard}
                    onPress={() => {
                      setShowNotificationModal(false);
                      if (n.orderId) {
                        navigation.navigate('TrackOrder', { orderId: n.orderId });
                      } else {
                        navigation.navigate('TrackOrder');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notifItemHeader}>
                      <Text style={styles.notifItemTitle}>{n.title}</Text>
                      <Text style={styles.notifItemTime}>{n.time}</Text>
                    </View>
                    <Text style={styles.notifItemMsg}>{n.message}</Text>
                    <TouchableOpacity
                      style={styles.notifTrackBtn}
                      onPress={() => {
                        setShowNotificationModal(false);
                        if (n.orderId) {
                          navigation.navigate('TrackOrder', { orderId: n.orderId });
                        } else {
                          navigation.navigate('TrackOrder');
                        }
                      }}
                    >
                      <Text style={styles.notifTrackBtnText}>Track Order Live →</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  brandTitleText: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  deliverLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    flexShrink: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownIcon: {
    fontSize: 10,
    color: COLORS.primary,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLoginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLoginBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
  iconBadgeBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationNumberBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  notifModalContainer: {
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
  noNotifText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 20,
  },
  notifItemCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifItemTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifItemMsg: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  notifTrackBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notifTrackBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#0F172A',
  },
  filterBtn: {
    padding: 6,
  },
  filterBtnIcon: {
    fontSize: 16,
  },
  promoBanner: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  promoBadgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  promoBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  promoTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  promoSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    marginBottom: 12,
  },
  claimBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  claimBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
  promoImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  categoryCard: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    width: 80,
  },
  categoryCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  heroCardContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  heroImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeOffer: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroBadgeOfferText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  heroBadgeRating: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroBadgeRatingText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  heroBody: {
    padding: SPACING.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroCuisine: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  heroTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  heroViewMenuBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroViewMenuBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
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
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  partnerBannerCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  partnerBannerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  partnerBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#431407',
    marginTop: 2,
  },
  partnerBannerSub: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  partnerBannerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  partnerBannerBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  partnerBannerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  closedOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  closedLockPill: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  closedLockPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pausedStatusBadge: {
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pausedStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
  },
});
