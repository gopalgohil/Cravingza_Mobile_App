// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const SkeletonPlaceholder: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.95,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// 🍕 1. Restaurant Hero Card Skeleton for HomeScreen
export const RestaurantCardSkeleton = () => (
  <View style={styles.cardSkeletonWrapper}>
    <SkeletonPlaceholder height={170} borderRadius={16} />
    <View style={{ padding: 12, gap: 8 }}>
      <View style={styles.rowBetween}>
        <SkeletonPlaceholder width="60%" height={18} borderRadius={6} />
        <SkeletonPlaceholder width="20%" height={18} borderRadius={6} />
      </View>
      <SkeletonPlaceholder width="40%" height={14} borderRadius={4} />
      <View style={styles.rowGap}>
        <SkeletonPlaceholder width="25%" height={14} borderRadius={4} />
        <SkeletonPlaceholder width="25%" height={14} borderRadius={4} />
      </View>
    </View>
  </View>
);

// 🍔 2. Restaurant Detail & Menu Item Skeleton
export const RestaurantDetailSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
    <SkeletonPlaceholder height={200} borderRadius={0} />
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonPlaceholder width="75%" height={24} borderRadius={8} />
      <SkeletonPlaceholder width="50%" height={16} borderRadius={6} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <SkeletonPlaceholder width={80} height={36} borderRadius={18} />
        <SkeletonPlaceholder width={80} height={36} borderRadius={18} />
        <SkeletonPlaceholder width={80} height={36} borderRadius={18} />
      </View>

      {/* Dish Items Skeletons */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.dishSkeletonCard}>
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonPlaceholder width="80%" height={16} borderRadius={6} />
            <SkeletonPlaceholder width="40%" height={14} borderRadius={4} />
            <SkeletonPlaceholder width="60%" height={12} borderRadius={4} />
          </View>
          <SkeletonPlaceholder width={90} height={90} borderRadius={12} />
        </View>
      ))}
    </View>
  </View>
);

// 📦 3. Order Card & Stepper Skeleton for Delivery / Orders Screen
export const OrderCardSkeleton = () => (
  <View style={styles.orderCardSkeletonWrapper}>
    <View style={styles.rowBetween}>
      <SkeletonPlaceholder width="50%" height={18} borderRadius={6} />
      <SkeletonPlaceholder width="30%" height={22} borderRadius={12} />
    </View>
    <View style={{ marginVertical: 12 }}>
      <SkeletonPlaceholder height={40} borderRadius={8} />
    </View>
    <View style={styles.rowBetween}>
      <SkeletonPlaceholder width="40%" height={14} borderRadius={4} />
      <SkeletonPlaceholder width="25%" height={16} borderRadius={4} />
    </View>
  </View>
);

// 👤 4. Profile & Settings Skeleton
export const ProfileSkeleton = () => (
  <View style={{ padding: 16, gap: 16 }}>
    <View style={{ alignItems: 'center', gap: 10, marginVertical: 20 }}>
      <SkeletonPlaceholder width={80} height={80} borderRadius={40} />
      <SkeletonPlaceholder width="50%" height={20} borderRadius={6} />
      <SkeletonPlaceholder width="35%" height={14} borderRadius={4} />
    </View>
    <View style={styles.formCardSkeleton}>
      <SkeletonPlaceholder height={45} borderRadius={10} style={{ marginBottom: 12 }} />
      <SkeletonPlaceholder height={45} borderRadius={10} style={{ marginBottom: 12 }} />
      <SkeletonPlaceholder height={45} borderRadius={10} />
    </View>
  </View>
);

// 🏷️ 5. Coupon & Offer Card Skeleton for OffersScreen
export const OfferCardSkeleton = () => (
  <View style={styles.offerCardSkeletonWrapper}>
    <SkeletonPlaceholder height={120} borderRadius={14} />
    <View style={{ padding: 12, gap: 8 }}>
      <View style={styles.rowBetween}>
        <SkeletonPlaceholder width="50%" height={20} borderRadius={6} />
        <SkeletonPlaceholder width="30%" height={26} borderRadius={8} />
      </View>
      <SkeletonPlaceholder width="80%" height={14} borderRadius={4} />
      <SkeletonPlaceholder width="40%" height={12} borderRadius={4} />
    </View>
  </View>
);

// 🏪 6. Restaurant Admin Dashboard Skeleton
export const OwnerDashboardSkeleton = () => (
  <View style={{ padding: 16, gap: 16, backgroundColor: '#F8FAFC', flex: 1 }}>
    {/* Banner / Store Status Header */}
    <SkeletonPlaceholder height={85} borderRadius={16} />

    {/* 4 KPI Grid Cards (2x2) */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            width: '48%',
            backgroundColor: '#FFFFFF',
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonPlaceholder width={36} height={36} borderRadius={10} />
            <SkeletonPlaceholder width="30%" height={16} borderRadius={6} />
          </View>
          <SkeletonPlaceholder width="70%" height={22} borderRadius={6} />
          <SkeletonPlaceholder width="50%" height={12} borderRadius={4} />
        </View>
      ))}
    </View>

    {/* Quick Action Navigation Bar */}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <SkeletonPlaceholder width="31%" height={44} borderRadius={12} />
      <SkeletonPlaceholder width="31%" height={44} borderRadius={12} />
      <SkeletonPlaceholder width="31%" height={44} borderRadius={12} />
    </View>

    {/* Recent Orders Header & Items */}
    <View style={{ gap: 12, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonPlaceholder width="45%" height={20} borderRadius={6} />
        <SkeletonPlaceholder width="25%" height={16} borderRadius={6} />
      </View>

      {[1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonPlaceholder width="40%" height={16} borderRadius={6} />
            <SkeletonPlaceholder width="25%" height={22} borderRadius={12} />
          </View>
          <SkeletonPlaceholder width="65%" height={14} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
            <SkeletonPlaceholder width="30%" height={14} borderRadius={4} />
            <SkeletonPlaceholder width="35%" height={32} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

// 📦 7. Restaurant Admin Orders Tab Skeleton
export const OwnerOrdersSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 12 }}>
    {/* Filter Pills Horizontal Bar */}
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
      <SkeletonPlaceholder width={90} height={36} borderRadius={18} />
      <SkeletonPlaceholder width={110} height={36} borderRadius={18} />
      <SkeletonPlaceholder width={100} height={36} borderRadius={18} />
    </View>

    {/* Order Cards */}
    <View style={{ paddingHorizontal: 16, gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonPlaceholder width="45%" height={18} borderRadius={6} />
            <SkeletonPlaceholder width="30%" height={24} borderRadius={12} />
          </View>
          <SkeletonPlaceholder width="60%" height={14} borderRadius={4} />
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />
          <View style={{ gap: 6 }}>
            <SkeletonPlaceholder width="80%" height={14} borderRadius={4} />
            <SkeletonPlaceholder width="50%" height={14} borderRadius={4} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <SkeletonPlaceholder width="48%" height={38} borderRadius={10} />
            <SkeletonPlaceholder width="48%" height={38} borderRadius={10} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

// 🍔 8. Restaurant Admin Menu Tab Skeleton
export const OwnerMenuSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 16, gap: 14 }}>
    {/* Search & Add Dish Bar */}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <SkeletonPlaceholder height={44} borderRadius={12} />
      </View>
      <SkeletonPlaceholder width={110} height={44} borderRadius={12} />
    </View>

    {/* Category Pills */}
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
      <SkeletonPlaceholder width={70} height={32} borderRadius={16} />
      <SkeletonPlaceholder width={80} height={32} borderRadius={16} />
      <SkeletonPlaceholder width={90} height={32} borderRadius={16} />
    </View>

    {/* Menu Items Cards */}
    {[1, 2, 3].map((i) => (
      <View
        key={i}
        style={{
          backgroundColor: '#FFFFFF',
          padding: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <SkeletonPlaceholder width={75} height={75} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonPlaceholder width="75%" height={16} borderRadius={6} />
          <SkeletonPlaceholder width="35%" height={14} borderRadius={4} />
          <SkeletonPlaceholder width="50%" height={12} borderRadius={4} />
        </View>
        <View style={{ gap: 8, alignItems: 'flex-end' }}>
          <SkeletonPlaceholder width={40} height={22} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

// ⚙️ 9. Restaurant Admin Settings Tab Skeleton
export const OwnerSettingsSkeleton = () => (
  <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 16, gap: 16 }}>
    {/* Store Header Card */}
    <View
      style={{
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <SkeletonPlaceholder width={56} height={56} borderRadius={28} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonPlaceholder width="65%" height={18} borderRadius={6} />
        <SkeletonPlaceholder width="40%" height={14} borderRadius={4} />
      </View>
      <SkeletonPlaceholder width={44} height={24} borderRadius={12} />
    </View>

    {/* Form Fields Card */}
    <View
      style={{
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 14,
      }}
    >
      <SkeletonPlaceholder width="40%" height={16} borderRadius={6} />

      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ gap: 6 }}>
          <SkeletonPlaceholder width="30%" height={12} borderRadius={4} />
          <SkeletonPlaceholder height={44} borderRadius={10} />
        </View>
      ))}

      <SkeletonPlaceholder height={48} borderRadius={12} style={{ marginTop: 10 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  cardSkeletonWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishSkeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  orderCardSkeletonWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formCardSkeleton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerCardSkeletonWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 8,
  },
});

