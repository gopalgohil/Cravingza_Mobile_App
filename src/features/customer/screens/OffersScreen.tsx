// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getOffersApi } from '../services/customerApi';

export interface OfferItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercentage?: number;
  maxDiscount?: number;
  minOrderValue?: number;
  category: 'Discount' | 'Free Delivery' | 'Cashback' | 'Bank';
  validTill: string;
  image?: string;
  bgGradientColor?: string;
}

const DEFAULT_OFFERS: OfferItem[] = [
  {
    id: '1',
    code: 'CRAVE30',
    title: '30% OFF up to ₹150',
    description: 'Valid on all Pizza, Burger & Fast Food orders above ₹300.',
    discountPercentage: 30,
    maxDiscount: 150,
    minOrderValue: 300,
    category: 'Discount',
    validTill: 'Expires in 3 days',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    code: 'FREEDEL',
    title: 'FREE Delivery on Orders Above ₹199',
    description: 'Get 100% waivoff on delivery charges for all top-rated restaurants.',
    category: 'Free Delivery',
    validTill: 'Valid Today Only',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    code: 'WELCOME50',
    title: 'Flat 50% OFF First Order',
    description: 'Welcome special offer for new Cravingza foodies! Max discount ₹200.',
    discountPercentage: 50,
    maxDiscount: 200,
    category: 'Discount',
    validTill: 'Valid for new users',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    code: 'HDFCFEST',
    title: 'Flat ₹100 Cashback with HDFC Cards',
    description: 'Pay using HDFC Credit/Debit cards on orders above ₹499.',
    category: 'Bank',
    validTill: 'Valid till Sunday',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    code: 'PARTY100',
    title: 'Flat ₹100 Off on Combo Meals',
    description: 'Order any family size biryani or burger party pack.',
    category: 'Cashback',
    validTill: 'Expires in 5 days',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&auto=format&fit=crop&q=80',
  },
];

export const OffersScreen = ({ navigation }: any) => {
  const [offers, setOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
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

      const apiData = res?.offers || res?.data || res;
      if (Array.isArray(apiData) && apiData.length > 0) {
        setOffers(apiData);
      }
    } catch (error: any) {
      console.log('Fetch Offers API Error:', error.message);
      // Fallback kept active
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Coupon Copied! 🎉', `Code "${code}" has been copied to your clipboard. Use it at checkout!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 4000);
  };

  const filteredOffers =
    selectedFilter === 'All'
      ? offers
      : offers.filter((item) => item.category?.toLowerCase() === selectedFilter.toLowerCase());

  const renderOfferCard = ({ item }: { item: OfferItem }) => {
    const isCopied = copiedCode === item.code;

    return (
      <View style={styles.offerCard}>
        <View style={styles.cardTopRow}>
          <Image
            source={{
              uri:
                item.image ||
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
            }}
            style={styles.offerImage}
            resizeMode="cover"
          />

          <View style={styles.cardContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>🏷️ {item.category.toUpperCase()}</Text>
            </View>

            <Text style={styles.offerTitle}>{item.title}</Text>
            <Text style={styles.offerDescription}>{item.description}</Text>
            <Text style={styles.validityText}>⏰ {item.validTill}</Text>
          </View>
        </View>

        <View style={styles.cardDashedLine} />

        <View style={styles.cardBottomRow}>
          <View style={styles.couponCodeBox}>
            <Text style={styles.couponCodeText}>{item.code}</Text>
          </View>

          <TouchableOpacity
            style={[styles.copyBtn, isCopied && styles.copiedBtn]}
            onPress={() => handleCopyCode(item.code)}
          >
            <Text style={styles.copyBtnText}>{isCopied ? 'COPIED! ✅' : 'COPY CODE 📋'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topNavIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deals & Offers 🏷️</Text>
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
        {/* Top Hero Banner */}
        <View style={styles.heroPromoBanner}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🔥 CRAVINGZA DEALS</Text>
            </View>
            <Text style={styles.heroTitle}>Delicious Food, Unbeatable Discounts!</Text>
            <Text style={styles.heroSub}>Apply promo codes at checkout to save big on your meal.</Text>
          </View>
          <Text style={styles.heroEmoji}>🍔</Text>
        </View>

        {/* Filter Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          {['All', 'Discount', 'Free Delivery', 'Cashback', 'Bank'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedFilter === cat && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Offers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching delicious offers...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOffers}
            keyExtractor={(item) => item.id}
            renderItem={renderOfferCard}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏷️</Text>
                <Text style={styles.emptyTitle}>No Offers Found</Text>
                <Text style={styles.emptySubtitle}>Check back later for fresh promo codes and discounts.</Text>
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
    paddingBottom: SPACING.xl,
  },
  heroPromoBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: FONT_SIZE.xs,
  },
  heroEmoji: {
    fontSize: 42,
    marginLeft: 8,
  },
  filterBarContainer: {
    gap: 8,
    paddingBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
    color: '#64748B',
    fontWeight: '600',
  },
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  offerImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
  },
  offerDescription: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  validityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
    marginTop: 6,
  },
  cardDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: SPACING.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponCodeBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  couponCodeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copiedBtn: {
    backgroundColor: '#22C55E',
  },
  copyBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});
