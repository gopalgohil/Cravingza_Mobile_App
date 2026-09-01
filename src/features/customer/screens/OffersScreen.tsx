// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getOffersApi } from '../services/customerApi';
import { OfferCardSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { useAuth } from '../../../context/AuthContext';
import { CustomerBottomNav } from '../components/CustomerBottomNav';
import { copyToClipboard } from '../../../services/clipboardStore';

// SVG Icon components matching Lucide icons in Web App
const SparklesIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <Path d="M5 3v4" />
    <Path d="M19 17v4" />
    <Path d="M3 5h4" />
    <Path d="M17 19h4" />
  </Svg>
);

const PercentIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="5" x2="5" y2="19" />
    <Circle cx="6.5" cy="6.5" r="2.5" />
    <Circle cx="17.5" cy="17.5" r="2.5" />
  </Svg>
);

const CreditCardIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect width="20" height="14" x="2" y="5" rx="2" />
    <Line x1="2" x2="22" y1="10" y2="10" />
  </Svg>
);

const TruckIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <Path d="M15 18H9" />
    <Path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <Circle cx="7" cy="18" r="2" />
    <Circle cx="17" cy="18" r="2" />
  </Svg>
);

const ClockIcon = ({ color = '#94A3B8' }: { color?: string }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const CopyIcon = ({ color = '#C2410C' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <Path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Svg>
);

const CheckIcon = ({ color = '#059669' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const ArrowRightIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

const GiftIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 12 20 22 4 22 4 12" />
    <Rect width="20" height="5" x="2" y="7" />
    <Line x1="12" y1="22" x2="12" y2="7" />
    <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </Svg>
);

export interface OfferCategory {
  id: string;
  label: string;
  renderIcon: (color: string) => React.ReactNode;
}

export interface OfferItem {
  _id?: string;
  id?: string;
  code: string;
  title: string;
  description: string;
  discountType?: 'percentage' | 'fixed' | string;
  discountValue?: number;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  minOrderValue?: number;
  category?: string;
  badgeText?: string;
  bgGradient?: string;
  validTill?: string | Date;
  image?: string;
  isUsed?: boolean;
  usedByUsers?: string[];
  restaurant?: {
    _id?: string;
    id?: string;
    name?: string;
    image?: string;
    location?: string;
  };
}

const CATEGORIES: OfferCategory[] = [
  { id: 'all', label: 'All Offers', renderIcon: (color) => <SparklesIcon color={color} /> },
  { id: 'flat', label: 'Flat Discounts', renderIcon: (color) => <PercentIcon color={color} /> },
  { id: 'payment', label: 'UPI & Bank Deals', renderIcon: (color) => <CreditCardIcon color={color} /> },
  { id: 'delivery', label: 'Free Delivery', renderIcon: (color) => <TruckIcon color={color} /> },
];

const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: '1',
    code: 'CRAVE50',
    title: '50% OFF up to ₹120',
    description: 'Get 50% discount on your favorite meals. Applicable on orders above ₹199.',
    discountType: 'percentage',
    discountValue: 50,
    minOrderAmount: 199,
    maxDiscountAmount: 120,
    badgeText: '50% OFF',
    category: 'flat',
    bgGradient: 'from-orange-500 to-amber-500',
    validTill: 'Expires soon',
  },
  {
    id: '2',
    code: 'WELCOME100',
    title: 'FLAT ₹100 OFF',
    description: 'Special welcome deal for foodies! Flat ₹100 discount on orders above ₹299.',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 299,
    maxDiscountAmount: 100,
    badgeText: 'FLAT ₹100',
    category: 'flat',
    bgGradient: 'from-rose-500 to-red-600',
    validTill: 'Expires soon',
  },
  {
    id: '3',
    code: 'FREEDEL50',
    title: 'Free Delivery + ₹50 OFF',
    description: 'Enjoy zero delivery fee and flat ₹50 OFF on all orders above ₹149.',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 149,
    maxDiscountAmount: 50,
    badgeText: 'FREE DELIVERY',
    category: 'delivery',
    bgGradient: 'from-emerald-500 to-teal-600',
    validTill: 'Expires soon',
  },
  {
    id: '4',
    code: 'RAZORPAY20',
    title: '20% Instant Cashback',
    description: 'Get 20% instant discount up to ₹100 when you pay online via Razorpay.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 249,
    maxDiscountAmount: 100,
    badgeText: 'ONLINE SPECIAL',
    category: 'payment',
    bgGradient: 'from-indigo-600 to-blue-500',
    validTill: 'Expires soon',
  },
];

const getCouponTheme = (item: OfferItem) => {
  const cat = (item.category || '').toLowerCase();
  const code = (item.code || '').toUpperCase();
  const badge = (item.badgeText || '').toUpperCase();
  const bg = (item.bgGradient || '').toLowerCase();

  if (code.includes('WELCOME') || badge.includes('FLAT ₹100') || bg.includes('red') || bg.includes('rose')) {
    return {
      accentColor: '#EF4444', // Red / Rose
      badgeBg: '#EF4444',
      badgeText: '#FFFFFF',
    };
  }
  if (code.includes('FREEDEL') || badge.includes('FREE DELIVERY') || cat === 'delivery' || bg.includes('emerald') || bg.includes('teal')) {
    return {
      accentColor: '#10B981', // Emerald / Green
      badgeBg: '#10B981',
      badgeText: '#FFFFFF',
    };
  }
  if (code.includes('RAZOR') || code.includes('BANK') || badge.includes('ONLINE') || cat === 'payment' || bg.includes('indigo') || bg.includes('blue')) {
    return {
      accentColor: '#3B82F6', // Indigo / Blue
      badgeBg: '#3B82F6',
      badgeText: '#FFFFFF',
    };
  }
  if (code.includes('CHEF') || badge.includes('CHEF') || bg.includes('amber')) {
    return {
      accentColor: '#C2410C', // Burnt Orange
      badgeBg: '#C2410C',
      badgeText: '#FFFFFF',
    };
  }
  return {
    accentColor: '#C2410C',
    badgeBg: '#C2410C',
    badgeText: '#FFFFFF',
  };
};

export const OffersScreen = ({ navigation }: any) => {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      console.log('Fetching Live Offers API (GET /api/offers)...');
      const res = await getOffersApi();
      console.log('Offers API Response:', res);

      const apiData = res?.data || res?.offers || res?.coupons || (Array.isArray(res) ? res : null);
      let formattedLiveOffers: OfferItem[] = [];

      if (Array.isArray(apiData) && apiData.length > 0) {
        formattedLiveOffers = apiData.map((item: any, idx: number) => ({
          _id: item._id || item.id || `offer_${idx}`,
          id: item.id || item._id || `offer_${idx}`,
          code: item.code || item.couponCode || `OFFER${idx + 1}`,
          title: item.title || item.name || `${item.discountPercentage || item.discountValue || 30}% OFF Special Deal`,
          description: item.description || item.details || `Get instant savings with promo code ${item.code || item.couponCode}.`,
          discountType: item.discountType || (item.discountPercentage ? 'percentage' : 'fixed'),
          discountValue: item.discountValue || item.discountPercentage || item.discount || 30,
          discountPercentage: item.discountPercentage || item.discountValue || 30,
          minOrderAmount: item.minOrderValue || item.minOrderAmount || item.minOrder || 0,
          minOrderValue: item.minOrderValue || item.minOrderAmount || item.minOrder || 0,
          maxDiscountAmount: item.maxDiscountAmount || item.maxDiscount || item.maxDiscountValue || 100,
          maxDiscount: item.maxDiscountAmount || item.maxDiscount || 100,
          badgeText: item.badgeText || (item.discountPercentage ? `${item.discountPercentage}% OFF` : item.discountValue ? `FLAT ₹${item.discountValue} OFF` : 'SPECIAL OFFER'),
          category: item.category || 'flat',
          bgGradient: item.bgGradient || 'from-orange-500 to-amber-500',
          validTill: item.validTill || item.validUntil || item.expiryDate || 'Expires soon',
          restaurant: item.restaurant,
          isUsed: item.isUsed || false,
        }));
      }

      // Map dynamic live offers from API with fallbacks
      const combinedMap = new Map<string, OfferItem>();

      DEFAULT_OFFERS.forEach((defOff) => {
        if (defOff.code) {
          combinedMap.set(defOff.code.trim().toUpperCase(), defOff);
        }
      });

      formattedLiveOffers.forEach((off) => {
        if (off.code) {
          combinedMap.set(off.code.trim().toUpperCase(), {
            ...combinedMap.get(off.code.trim().toUpperCase()),
            ...off,
          });
        }
      });

      const mergedOffers = Array.from(combinedMap.values());
      console.log(`Successfully loaded ${mergedOffers.length} offers into OffersScreen!`);
      setOffers(mergedOffers);
    } catch (error: any) {
      console.log('Fetch Offers API Error:', error?.message || error);
      setOffers(DEFAULT_OFFERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    copyToClipboard(code);
    setCopiedCode(code);
    Alert.alert(
      'Coupon Code Copied! 🎉',
      `Promo code "${code}" has been copied to your clipboard. Apply it at checkout for instant savings!`
    );
    setTimeout(() => {
      setCopiedCode(null);
    }, 4000);
  };

  const handleApplyDeal = (item: OfferItem) => {
    handleCopyCode(item.code);
    if (item.restaurant?._id || item.restaurant?.id) {
      const restId = item.restaurant._id || item.restaurant.id;
      navigation.navigate('RestaurantDetail', { restaurantId: restId });
    } else {
      navigation.navigate('Home');
    }
  };

  // Dynamic filtering matching Web Application logic
  const filteredOffers = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return offers;
    }

    return offers.filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      const code = (item.code || '').toLowerCase().trim();
      const title = (item.title || '').toLowerCase().trim();
      const badge = (item.badgeText || '').toLowerCase().trim();

      if (selectedCategory === 'flat') {
        return (
          cat === 'flat' ||
          cat === 'discount' ||
          item.discountType === 'percentage' ||
          item.discountType === 'fixed' ||
          title.includes('flat') ||
          title.includes('off')
        );
      }

      if (selectedCategory === 'payment') {
        return (
          cat === 'payment' ||
          cat === 'bank' ||
          cat === 'cashback' ||
          cat === 'upi' ||
          badge.includes('online') ||
          badge.includes('bank') ||
          title.includes('cashback') ||
          code.includes('razor') ||
          code.includes('upi')
        );
      }

      if (selectedCategory === 'delivery') {
        return (
          cat === 'delivery' ||
          cat === 'free delivery' ||
          badge.includes('delivery') ||
          title.includes('delivery') ||
          code.includes('del')
        );
      }

      return cat === selectedCategory.toLowerCase();
    });
  }, [offers, selectedCategory]);

  const renderOfferCard = ({ item }: { item: OfferItem }) => {
    const isCopied = copiedCode === item.code;
    const currentUserId = currentUser?.id || currentUser?._id;
    const isUsed =
      item.isUsed ||
      (currentUserId && item.usedByUsers && item.usedByUsers.includes(currentUserId));

    const theme = getCouponTheme(item);

    const badgeLabel =
      item.badgeText ||
      (item.category === 'delivery'
        ? 'FREE DELIVERY'
        : item.category === 'payment'
        ? 'ONLINE SPECIAL'
        : item.discountValue
        ? item.discountType === 'percentage'
          ? `${item.discountValue}% OFF`
          : `FLAT ₹${item.discountValue} OFF`
        : 'SPECIAL OFFER');

    return (
      <View style={[styles.offerCard, isUsed && styles.usedOfferCard]}>
        {/* Top Accent Strip matching Web App gradient bar */}
        <View style={[styles.cardTopAccent, { backgroundColor: isUsed ? '#94A3B8' : theme.accentColor }]} />

        <View style={styles.cardBody}>
          {/* Header Row: Badge Pill & Expiry */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgesWrapper}>
              <View style={[styles.badgePill, { backgroundColor: isUsed ? '#94A3B8' : theme.badgeBg }]}>
                <Text style={styles.badgeText}>
                  {isUsed ? '✓ ALREADY USED' : badgeLabel}
                </Text>
              </View>

              {item.restaurant?.name && (
                <View style={styles.restaurantTag}>
                  <Text style={styles.restaurantTagText} numberOfLines={1}>
                    📍 {item.restaurant.name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.expiryRow}>
              <ClockIcon color="#94A3B8" />
              <Text style={[styles.validityText, isUsed && { color: '#94A3B8' }]}>
                {isUsed ? 'Redeemed' : 'Expires soon'}
              </Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={[styles.offerTitle, isUsed && { color: '#64748B' }]}>{item.title}</Text>
          <Text style={styles.offerDescription}>{item.description}</Text>
        </View>

        {/* Divider Line */}
        <View style={styles.cardDivider} />

        {/* Bottom Actions Row */}
        <View style={styles.cardBottomRow}>
          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCodeLabel}>PROMO CODE</Text>
            <TouchableOpacity
              style={[
                styles.couponCodeBox,
                isCopied && styles.copiedCodeBox,
                isUsed && { backgroundColor: '#E2E8F0', borderColor: '#94A3B8' },
              ]}
              onPress={() => !isUsed && handleCopyCode(item.code)}
              activeOpacity={isUsed ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.couponCodeText,
                  isUsed && { color: '#64748B', textDecorationLine: 'line-through' },
                ]}
              >
                {item.code}
              </Text>
              {!isUsed && (
                <View style={styles.copyIconWrapper}>
                  {isCopied ? <CheckIcon color="#059669" /> : <CopyIcon color="#C2410C" />}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {isUsed ? (
            <View style={styles.usedBtn}>
              <Text style={styles.usedBtnText}>USED ✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => handleApplyDeal(item)}
              activeOpacity={0.8}
            >
              <View style={styles.applyBtnContent}>
                <Text style={styles.applyBtnText}>
                  {item.restaurant?.name ? `Order` : `Apply Deal`}
                </Text>
                <ArrowRightIcon color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topNavIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deals & Offers</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOffers();
            }}
            colors={['#C2410C']}
          />
        }
      >
        {/* Super Saver Festival Hero Banner matching Web App */}
        <View style={styles.heroPromoBanner}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadge}>
              <GiftIcon color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>SUPER SAVER FESTIVAL</Text>
            </View>
            <Text style={styles.heroTitle}>Delicious Food, Unbeatable Discounts!</Text>
            <Text style={styles.heroSub}>
              Save big on every craving. Use promo codes at checkout for instant price cuts & free delivery.
            </Text>
          </View>
        </View>

        {/* Category Filter Pills matching Web App Screenshot */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const iconColor = isActive ? '#FFFFFF' : '#C2410C';
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterTab,
                  isActive ? styles.filterTabActive : styles.filterTabInactive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                {cat.renderIcon(iconColor)}
                <Text
                  style={[
                    styles.filterTabText,
                    isActive ? styles.filterTabTextActive : styles.filterTabTextInactive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Offers Content List */}
        {loading ? (
          <View style={{ flex: 1, paddingTop: 10 }}>
            <OfferCardSkeleton key="off_skel_1" />
            <OfferCardSkeleton key="off_skel_2" />
            <OfferCardSkeleton key="off_skel_3" />
          </View>
        ) : (
          <FlatList
            data={filteredOffers}
            keyExtractor={(item, index) => item._id || item.id || item.code || String(index)}
            renderItem={renderOfferCard}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏷️</Text>
                <Text style={styles.emptyTitle}>No coupons in this category</Text>
                <Text style={styles.emptySubtitle}>
                  Check back soon or explore our restaurants for auto-applied food deals!
                </Text>
              </View>
            }
          />
        )}
      </ScrollView>

      <CustomerBottomNav activeTab="Offers" navigation={navigation} />
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
    paddingBottom: 85,
  },
  heroPromoBanner: {
    backgroundColor: '#C2410C',
    borderRadius: 24,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 28,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    lineHeight: 18,
  },
  filterBarContainer: {
    gap: 10,
    paddingBottom: SPACING.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: '#C2410C',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  filterTabInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextInactive: {
    color: '#1E3A8A', // Web App dark navy text style
  },
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  usedOfferCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  cardTopAccent: {
    height: 5,
    width: '100%',
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  restaurantTag: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 140,
  },
  restaurantTagText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '800',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 24,
  },
  offerDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  cardBottomRow: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  couponCodeContainer: {
    gap: 4,
  },
  couponCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  couponCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  copiedCodeBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  couponCodeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.8,
  },
  copyIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  applyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  usedBtn: {
    backgroundColor: '#94A3B8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  usedBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl * 1.5,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
  },
});
