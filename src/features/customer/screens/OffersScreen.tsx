// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getOffersApi } from '../services/customerApi';
import { OfferCardSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { useAuth } from '../../../context/AuthContext';

export interface OfferCategory {
  id: string;
  label: string;
  icon: string;
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
  { id: 'all', label: 'All Offers', icon: '✨' },
  { id: 'flat', label: 'Flat Discounts', icon: '%' },
  { id: 'payment', label: 'UPI & Bank Deals', icon: '💳' },
  { id: 'delivery', label: 'Free Delivery', icon: '🚚' },
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
    validTill: 'Expires soon',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
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
    validTill: 'Valid for new users',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
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
    validTill: 'Valid Today Only',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    code: 'RAZORPAY20',
    title: '20% Instant Cashback',
    description: 'Get 20% instant discount up to ₹100 when you pay online via Razorpay or UPI.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 249,
    maxDiscountAmount: 100,
    badgeText: 'ONLINE SPECIAL',
    category: 'payment',
    validTill: 'Valid till Sunday',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80',
  },
];

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

      const apiData = res?.data || res?.offers || (Array.isArray(res) ? res : null);
      if (Array.isArray(apiData) && apiData.length > 0) {
        setOffers(apiData);
      }
    } catch (error: any) {
      console.log('Fetch Offers API Error:', error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
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

  // Dynamic filtering matching backend categories
  const filteredOffers = useMemo(() => {
    if (selectedCategory === 'all') return offers;

    return offers.filter((item) => {
      const cat = (item.category || '').toLowerCase().trim();
      const code = (item.code || '').toLowerCase().trim();
      const title = (item.title || '').toLowerCase().trim();
      const badge = (item.badgeText || '').toLowerCase().trim();

      if (selectedCategory === 'flat') {
        return (
          cat === 'flat' ||
          cat === 'discount' ||
          cat === 'flat discounts' ||
          cat === 'festive' ||
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
          code.includes('hdfc') ||
          code.includes('upi')
        );
      }

      if (selectedCategory === 'delivery') {
        return (
          cat === 'delivery' ||
          cat === 'free delivery' ||
          cat === 'freedelivery' ||
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

    const badgeLabel =
      item.badgeText ||
      (item.category === 'delivery'
        ? 'FREE DELIVERY'
        : item.category === 'payment'
        ? 'BANK / UPI DEAL'
        : item.discountValue
        ? item.discountType === 'percentage'
          ? `${item.discountValue}% OFF`
          : `FLAT ₹${item.discountValue} OFF`
        : 'SPECIAL OFFER');

    const minAmount = item.minOrderAmount || item.minOrderValue;
    const validityText = typeof item.validTill === 'string'
      ? item.validTill
      : item.validTill
      ? `Valid till ${new Date(item.validTill).toLocaleDateString()}`
      : 'Expires soon';

    return (
      <View style={[styles.offerCard, isUsed && styles.usedOfferCard]}>
        {/* Top Accent Strip */}
        <View style={styles.cardTopAccent} />

        <View style={styles.cardBody}>
          {/* Header Row: Badge & Expiry */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgesWrapper}>
              <View style={[styles.badgePill, isUsed && { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.badgeText, isUsed && { color: '#64748B' }]}>
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

            <Text style={[styles.validityText, isUsed && { color: '#94A3B8' }]}>
              {isUsed ? 'Redeemed' : `⏰ ${validityText}`}
            </Text>
          </View>

          {/* Offer Title & Description */}
          <Text style={[styles.offerTitle, isUsed && { color: '#64748B' }]}>{item.title}</Text>
          <Text style={styles.offerDescription}>{item.description}</Text>

          {/* Metadata Row: Min Order & Max Discount */}
          {!!minAmount && (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>• Min. order: ₹{minAmount}</Text>
              {!!(item.maxDiscountAmount || item.maxDiscount) && (
                <Text style={styles.metaText}>
                  • Max discount: ₹{item.maxDiscountAmount || item.maxDiscount}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.cardDashedLine} />

        {/* Bottom Actions Row */}
        <View style={styles.cardBottomRow}>
          <View style={styles.couponCodeContainer}>
            <Text style={styles.couponCodeLabel}>PROMO CODE (TAP TO COPY)</Text>
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
                <Text style={styles.copyIconText}>{isCopied ? '✅' : '📋'}</Text>
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
              <Text style={styles.applyBtnText}>APPLY DEAL →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation Header */}
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
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Top Hero Super Saver Banner */}
        <View style={styles.heroPromoBanner}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🔥 CRAVINGZA DEALS</Text>
            </View>
            <Text style={styles.heroTitle}>Delicious Food, Unbeatable Discounts!</Text>
            <Text style={styles.heroSub}>
              Save big on every craving. Use promo codes at checkout for instant price cuts & free delivery.
            </Text>
          </View>
          <Text style={styles.heroEmoji}>🍔</Text>
        </View>

        {/* Category Filter Tabs matching Web App */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabIcon, isActive && styles.filterTabIconActive]}>
                  {cat.icon}
                </Text>
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
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
    paddingBottom: SPACING.xl * 2,
  },
  heroPromoBanner: {
    backgroundColor: '#C2410C',
    borderRadius: 24,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    marginBottom: 4,
    lineHeight: 24,
  },
  heroSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  heroEmoji: {
    fontSize: 44,
    marginLeft: 8,
  },
  filterBarContainer: {
    gap: 8,
    paddingBottom: SPACING.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  filterTabIcon: {
    fontSize: 14,
    color: COLORS.primary,
  },
  filterTabIconActive: {
    color: COLORS.white,
  },
  filterTabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#334155',
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  usedOfferCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  cardTopAccent: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  restaurantTag: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  restaurantTagText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '800',
  },
  validityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  offerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: FONT_SIZE.xs,
    color: '#475569',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  cardBottomRow: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  couponCodeContainer: {
    gap: 2,
  },
  couponCodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  couponCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 6,
  },
  copiedCodeBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  couponCodeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  copyIconText: {
    fontSize: 12,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
  },
  usedBtn: {
    backgroundColor: '#94A3B8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  usedBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl * 1.5,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
