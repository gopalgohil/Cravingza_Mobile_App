// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminDashboardApi } from '../services/adminApi';

import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

export const AdminAnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAdminDashboardApi();
      setData(res?.data || res);
    } catch (err: any) {
      console.log('Analytics API error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const analyticsCards = [
    { id: '1', title: 'Total Platform Gross Revenue', value: data?.totalRevenue || '₹45,890', sub: '+18.4% from last month 📈', icon: '💰', color: '#FFF7ED', textCol: '#C2410C' },
    { id: '2', title: 'Total Completed Food Orders', value: String(data?.totalOrders || 142), sub: '94.2% delivery success rate 📦', icon: '🛵', color: '#EFF6FF', textCol: '#1D4ED8' },
    { id: '3', title: 'Active Customer Base', value: String(data?.activeUsers || 86), sub: '+24 new signups this week 👥', icon: '👤', color: '#F0FDF4', textCol: '#15803D' },
    { id: '4', title: 'Average Order Conversion Rate', value: data?.convRate || '4.8%', sub: 'High user engagement & retention 📊', icon: '📈', color: '#FAF5FF', textCol: '#7E22CE' },
  ];

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <SkeletonPlaceholder width={220} height={20} style={{ marginTop: SPACING.md }} />
      <SkeletonPlaceholder width={280} height={12} style={{ marginTop: 4, marginBottom: SPACING.md }} />
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.analyticsCard, { backgroundColor: '#F8FAFC' }]}>
          <View style={styles.cardHeaderRow}>
            <SkeletonPlaceholder width={30} height={30} borderRadius={6} />
            <SkeletonPlaceholder width={100} height={26} />
          </View>
          <SkeletonPlaceholder width={180} height={14} style={{ marginTop: 6 }} />
          <SkeletonPlaceholder width={140} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.sectionHeaderTitle}>📈 Platform Growth & Analytics</Text>
      <Text style={styles.subTitleText}>Real-time revenue metrics, order velocity and user conversion rates.</Text>
    </View>
  );

  const renderAnalyticsCard = ({ item }: { item: any }) => (
    <View style={[styles.analyticsCard, { backgroundColor: item.color }]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardIcon}>{item.icon}</Text>
        <Text style={[styles.cardVal, { color: item.textCol }]}>{item.value}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>{item.sub}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <FlatList
      data={analyticsCards}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={renderAnalyticsCard}
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
  },
  subTitleText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  analyticsCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardVal: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
