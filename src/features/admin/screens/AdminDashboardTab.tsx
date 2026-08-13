// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminDashboardApi } from '../services/adminApi';

import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

import {
  RevenueIcon,
  OrdersBagIcon,
  UserManagementIcon,
  AnalyticsIcon,
  ApprovalsIcon,
  TrophyIcon,
} from '../components/AdminSidebarIcons';

interface AdminDashboardTabProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await getAdminDashboardApi();
      setDashboardData(res?.data || res);
    } catch (err: any) {
      setDashboardData({
        totalRevenue: '₹45,890',
        totalOrders: 142,
        activeUsers: 86,
        convRate: '4.8%',
        topRestaurants: [
          { rank: 1, name: 'Punjabi Dhaba & Grill', orders: 48, revenue: '₹18,400', rating: 4.8 },
          { rank: 2, name: 'Pizza & Burger Express', orders: 36, revenue: '₹14,200', rating: 4.6 },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const renderMetricIcon = (id: string) => {
    switch (id) {
      case '1':
        return <RevenueIcon color="#C2410C" size={24} />;
      case '2':
        return <OrdersBagIcon color="#1D4ED8" size={24} />;
      case '3':
        return <UserManagementIcon color="#15803D" size={24} />;
      case '4':
        return <AnalyticsIcon color="#7E22CE" size={24} />;
      default:
        return null;
    }
  };

  const metricsData = [
    { id: '1', title: 'Total Revenue', value: dashboardData?.totalRevenue || '₹45,890', color: '#FFF7ED', border: '#FFEDD5' },
    { id: '2', title: 'Total Orders', value: dashboardData?.totalOrders || 142, color: '#EFF6FF', border: '#DBEAFE' },
    { id: '3', title: 'Active Users', value: dashboardData?.activeUsers || 86, color: '#F0FDF4', border: '#DCFCE7' },
    { id: '4', title: 'Conversion Rate', value: dashboardData?.convRate || '4.8%', color: '#FAF5FF', border: '#F3E8FF' },
  ];

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <SkeletonPlaceholder width={180} height={20} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs + 4 }} />
      <View style={styles.metricsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.metricCard, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <SkeletonPlaceholder width={24} height={24} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={80} height={24} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={60} height={12} borderRadius={4} />
          </View>
        ))}
      </View>

      <SkeletonPlaceholder width={160} height={20} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs + 4 }} />
      <View style={styles.quickActionsRow}>
        <View style={styles.quickActionCard}>
          <SkeletonPlaceholder width={32} height={32} borderRadius={16} />
          <SkeletonPlaceholder width={100} height={14} style={{ marginTop: 6 }} />
          <SkeletonPlaceholder width={80} height={10} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.quickActionCard}>
          <SkeletonPlaceholder width={32} height={32} borderRadius={16} />
          <SkeletonPlaceholder width={100} height={14} style={{ marginTop: 6 }} />
          <SkeletonPlaceholder width={80} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>

      <SkeletonPlaceholder width={200} height={20} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs + 4 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.topRestRow}>
          <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonPlaceholder width={140} height={14} />
            <SkeletonPlaceholder width={90} height={10} />
          </View>
          <SkeletonPlaceholder width={50} height={16} />
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.sectionHeaderTitle}>Dashboard Analytics</Text>
      
      {/* 2x2 Grid of Metrics */}
      <View style={styles.metricsGrid}>
        {metricsData.map((m) => (
          <View key={m.id} style={[styles.metricCard, { backgroundColor: m.color, borderColor: m.border }]}>
            <View style={{ marginBottom: 6 }}>
              {renderMetricIcon(m.id)}
            </View>
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricLabel}>{m.title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionHeaderTitle}>Quick Admin Actions</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => onNavigateTab('approvals')}>
          <View style={{ marginBottom: 4 }}>
            <ApprovalsIcon color={COLORS.primary} size={26} />
          </View>
          <Text style={styles.quickActionTitle}>Pending Approvals</Text>
          <Text style={styles.quickActionSub}>Review KYC & licenses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} onPress={() => onNavigateTab('users')}>
          <View style={{ marginBottom: 4 }}>
            <UserManagementIcon color="#2563EB" size={26} />
          </View>
          <Text style={styles.quickActionTitle}>User Management</Text>
          <Text style={styles.quickActionSub}>Block/Unblock users</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, marginBottom: SPACING.xs + 2 }}>
        <TrophyIcon color="#D97706" size={20} />
        <Text style={styles.sectionHeaderTitleNoMargin}>Top Performing Restaurants</Text>
      </View>
    </View>
  );

  const renderTopRestaurantItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.topRestRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{item.rank || index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.topRestName}>{item.name}</Text>
        <Text style={styles.topRestSub}>{item.orders} Orders • ⭐ {item.rating || 4.5}</Text>
      </View>
      <Text style={styles.topRestRevenue}>{item.revenue}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <FlatList
      data={dashboardData?.topRestaurants || []}
      keyExtractor={(item, idx) => String(item.rank || idx)}
      ListHeaderComponent={renderHeader}
      renderItem={renderTopRestaurantItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: FONT_SIZE.xs,
    marginTop: 10,
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  sectionHeaderTitleNoMargin: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.xs,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.xs,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
  },
  quickActionTitle: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickActionSub: {
    fontSize: 10,
    color: '#64748B',
  },
  topRestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topRestName: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  topRestSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  topRestRevenue: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#16A34A',
  },
});
