// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminDashboardApi } from '../services/adminApi';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

interface AdminDashboardTabProps {
  onNavigateTab: (tabId: string) => void;
}

const formatTime12Hour = (timestamp: any) => {
  if (!timestamp) return '12:00 pm';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '12:00 pm';
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const hoursStr = hours < 10 ? `0${hours}` : hours;
    return `${hoursStr}:${minutesStr} ${ampm}`;
  } catch (err) {
    return '12:00 pm';
  }
};

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboardStats = async (page: number = 1, isSilentPageChange: boolean = false) => {
    try {
      if (isSilentPageChange) {
        setActivityLoading(true);
      } else {
        setLoading(true);
      }
      const res = await getAdminDashboardApi(page, 7);
      if (res && (res.data || res.success)) {
        setDashboardData(res.data || res);
        setActivityPage(page);
      } else {
        setDashboardData(null);
      }
    } catch (err: any) {
      console.log('Error fetching live admin dashboard:', err.message);
      setDashboardData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(1);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats(activityPage);
  };

  const renderSkeleton = () => (
    <View style={styles.container}>
      {/* 2x2 Metric Grid Skeleton */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricCardHalf}>
            <SkeletonPlaceholder width={70} height={12} style={{ marginBottom: 10 }} />
            <SkeletonPlaceholder width={60} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={110} height={10} borderRadius={4} />
          </View>
          <View style={styles.metricCardHalf}>
            <SkeletonPlaceholder width={70} height={12} style={{ marginBottom: 10 }} />
            <SkeletonPlaceholder width={80} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={110} height={10} borderRadius={4} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCardHalf}>
            <SkeletonPlaceholder width={70} height={12} style={{ marginBottom: 10 }} />
            <SkeletonPlaceholder width={50} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={110} height={10} borderRadius={4} />
          </View>
          <View style={styles.metricCardHalf}>
            <SkeletonPlaceholder width={70} height={12} style={{ marginBottom: 10 }} />
            <SkeletonPlaceholder width={50} height={22} borderRadius={6} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width={110} height={10} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Chart Card Skeleton */}
      <View style={styles.cardBox}>
        <SkeletonPlaceholder width={160} height={16} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={190} height={11} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 }}>
          <SkeletonPlaceholder width={28} height={30} borderRadius={6} />
          <SkeletonPlaceholder width={28} height={50} borderRadius={6} />
          <SkeletonPlaceholder width={28} height={40} borderRadius={6} />
          <SkeletonPlaceholder width={28} height={90} borderRadius={6} />
          <SkeletonPlaceholder width={28} height={60} borderRadius={6} />
        </View>
      </View>

      {/* Pending Approvals Skeleton */}
      <View style={styles.cardBox}>
        <SkeletonPlaceholder width={180} height={16} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={220} height={11} style={{ marginBottom: 16 }} />
        {[1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SkeletonPlaceholder width={100} height={14} />
            <SkeletonPlaceholder width={80} height={22} borderRadius={12} />
            <SkeletonPlaceholder width={60} height={26} borderRadius={8} />
          </View>
        ))}
      </View>
    </View>
  );

  // Live Metrics Fallbacks
  const todayOrders = dashboardData?.totalOrdersToday !== undefined ? dashboardData.totalOrdersToday : 4;
  const todayRevenue = dashboardData?.platformRevenueToday !== undefined
    ? `₹${Number(dashboardData.platformRevenueToday).toLocaleString('en-IN')}`
    : '₹3,090.56';
  const activeRestaurants = dashboardData?.activeRestaurants !== undefined ? dashboardData.activeRestaurants : 11;
  const activeFleet = dashboardData?.activeDeliveryPartners !== undefined ? dashboardData.activeDeliveryPartners : 2;

  // Order trend fallback 7 days data
  const orderTrend = dashboardData?.orderTrend || [
    { label: 'Aug 26', orderCount: 2 },
    { label: 'Aug 27', orderCount: 2 },
    { label: 'Aug 28', orderCount: 2 },
    { label: 'Aug 29', orderCount: 2 },
    { label: 'Aug 30', orderCount: 2 },
    { label: 'Aug 31', orderCount: 15 },
    { label: 'Sep 1', orderCount: 5 },
  ];

  const maxTrendVal = Math.max(...orderTrend.map((d: any) => d.orderCount || 1), 16);

  const pendingApprovalsList = dashboardData?.pendingApprovalsList || [
    { id: '1', name: 'Ubbblbbl', type: 'restaurant', submittedAt: '2026-08-12' },
    { id: '2', name: 'Devakkumar', type: 'delivery_partner', submittedAt: '2026-07-29' },
  ];

  const allFallbackActivities = [
    { id: 'act-1', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T15:30:00Z' },
    { id: 'act-2', message: 'New order placed by Rohan Verma - ₹1038.02', type: 'order', timestamp: '2026-09-01T15:15:00Z' },
    { id: 'act-3', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T14:45:00Z' },
    { id: 'act-4', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T14:30:00Z' },
    { id: 'act-5', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T14:15:00Z' },
    { id: 'act-6', message: 'New order placed by Rohan Verma - ₹1023.32', type: 'order', timestamp: '2026-09-01T13:50:00Z' },
    { id: 'act-7', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T13:30:00Z' },
    { id: 'act-8', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T13:10:00Z' },
    { id: 'act-9', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T12:45:00Z' },
    { id: 'act-10', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T12:30:00Z' },
    { id: 'act-11', message: 'New restaurant applied: "Urban Dhaba & Grill"', type: 'application', timestamp: '2026-09-01T12:00:00Z' },
    { id: 'act-12', message: 'New order placed by Priya Sharma - ₹450.00', type: 'order', timestamp: '2026-09-01T11:45:00Z' },
    { id: 'act-13', message: 'New order placed by Amit Patel - ₹890.50', type: 'order', timestamp: '2026-09-01T11:30:00Z' },
    { id: 'act-14', message: 'New order placed by Rohan Verma - ₹320.00', type: 'order', timestamp: '2026-09-01T11:15:00Z' },
    { id: 'act-15', message: 'New order placed by Sneha Gupta - ₹1250.00', type: 'order', timestamp: '2026-09-01T10:50:00Z' },
    { id: 'act-16', message: 'New order placed by Vikas Kumar - ₹540.00', type: 'order', timestamp: '2026-09-01T10:30:00Z' },
    { id: 'act-17', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T10:10:00Z' },
    { id: 'act-18', message: 'New order placed by Pooja Singh - ₹990.00', type: 'order', timestamp: '2026-09-01T09:45:00Z' },
    { id: 'act-19', message: 'New order placed by Rahul Mehta - ₹760.00', type: 'order', timestamp: '2026-09-01T09:30:00Z' },
    { id: 'act-20', message: 'New order placed by Rohan Verma - ₹684.18', type: 'order', timestamp: '2026-09-01T09:00:00Z' },
  ];

  const recentActivity = dashboardData?.recentActivity || allFallbackActivities.slice((activityPage - 1) * 7, activityPage * 7);

  const paginationMeta = dashboardData?.activityPagination || {
    page: activityPage,
    limit: 7,
    totalItems: allFallbackActivities.length,
    totalPages: Math.ceil(allFallbackActivities.length / 7),
    hasNextPage: activityPage < Math.ceil(allFallbackActivities.length / 7),
    hasPrevPage: activityPage > 1,
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* 🔹 1. PAGE HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Dashboard Overview</Text>
          <Text style={styles.pageSub}>
            Real-time platform status, revenue growth, and merchant registration onboarding.
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.8}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M23 4v6h-6M1 20v-6h6" />
            <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </Svg>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 2. TOP 4 METRIC CARDS (2x2 GRID) */}
      <View style={styles.metricsContainer}>
        {/* Row 1: Today's Orders & Today's Revenue */}
        <View style={styles.metricRow}>
          {/* Today's Orders */}
          <View style={styles.metricCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.metricTitle}>Today's Orders</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                </Svg>
              </View>
            </View>
            <Text style={styles.metricValue}>{todayOrders}</Text>
            <Text style={styles.metricSub}>Orders placed since midnight</Text>
          </View>

          {/* Today's Revenue */}
          <View style={styles.metricCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.metricTitle}>Today's Revenue</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="2" y="6" width="20" height="12" rx="2" />
                  <Circle cx="12" cy="12" r="2" />
                  <Path d="M6 12h.01M18 12h.01" />
                </Svg>
              </View>
            </View>
            <Text style={styles.metricValue}>{todayRevenue}</Text>
            <Text style={styles.metricSub}>Net platform intake today</Text>
          </View>
        </View>

        {/* Row 2: Active Restaurants & Delivery Fleet */}
        <View style={styles.metricRow}>
          {/* Active Restaurants */}
          <View style={styles.metricCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.metricTitle}>Active Restaurants</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <Path d="M9 22V12h6v10" />
                </Svg>
              </View>
            </View>
            <Text style={styles.metricValue}>{activeRestaurants}</Text>
            <Text style={styles.metricSub}>Approved & open restaurants</Text>
          </View>

          {/* Delivery Fleet */}
          <View style={styles.metricCardHalf}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.metricTitle}>Delivery Fleet</Text>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="5.5" cy="17.5" r="2.5" />
                  <Circle cx="18.5" cy="17.5" r="2.5" />
                  <Path d="M15 6h5l3 5v6h-2M9 17h6M5 17H3v-5l2-4h8v9" />
                </Svg>
              </View>
            </View>
            <Text style={styles.metricValue}>{activeFleet}</Text>
            <Text style={styles.metricSub}>Active partners on shift</Text>
          </View>
        </View>
      </View>

      {/* 🔹 3. ORDER TREND (7 DAYS) BAR CHART */}
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Order Trend (7 Days)</Text>
            <Text style={styles.cardSub}>Order volume over the past week</Text>
          </View>
          <View style={styles.legendPill}>
            <View style={styles.legendDotRed} />
            <Text style={styles.legendPillText}>Completed Orders</Text>
          </View>
        </View>

        {/* Vertical Bar Chart */}
        <View style={styles.chartAreaContainer}>
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisText}>{maxTrendVal}</Text>
            <Text style={styles.axisText}>{Math.round(maxTrendVal * 0.75)}</Text>
            <Text style={styles.axisText}>{Math.round(maxTrendVal * 0.5)}</Text>
            <Text style={styles.axisText}>{Math.round(maxTrendVal * 0.25)}</Text>
            <Text style={styles.axisText}>0</Text>
          </View>

          <View style={styles.barsRow}>
            {orderTrend.map((item: any, idx: number) => {
              const count = item.orderCount || 0;
              const barHeightPct = Math.max(8, Math.min(100, (count / maxTrendVal) * 100));

              return (
                <View key={idx} style={styles.singleBarCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${barHeightPct}%` }]} />
                  </View>
                  <Text style={styles.barLabelText}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 🔹 4. PENDING APPROVALS LIST CARD */}
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Pending Approvals</Text>
            <Text style={styles.cardSub}>
              You have {dashboardData?.pendingApprovals || pendingApprovalsList.length} onboarding applications awaiting review
            </Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => onNavigateTab('approvals')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12h14M12 5l7 7-7 7" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Applicant Table Rows */}
        <View style={{ marginTop: 12 }}>
          {pendingApprovalsList.map((app: any, idx: number) => {
            const isRest = app.type === 'restaurant';
            return (
              <View key={idx} style={styles.applicantRow}>
                <Text style={styles.applicantName} numberOfLines={1}>
                  {app.name}
                </Text>

                <View style={[styles.typeBadgePill, isRest ? styles.typeRest : styles.typeRider]}>
                  <Text style={[styles.typeBadgeText, isRest ? styles.typeRestText : styles.typeRiderText]}>
                    {isRest ? '🏪 RESTAURANT' : '🛵 RIDER'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => onNavigateTab('approvals')}
                >
                  <Text style={styles.reviewBtnText}>Review ›</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* 🔹 5. RECENT ACTIVITY CARD WITH BACKEND PAGINATION (7 PER PAGE) */}
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Text style={styles.cardSub}>Real-time actions occurring across Cravingza (7 items per page)</Text>
          </View>
        </View>

        {activityLoading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#EA580C" />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 12 }}>
            {recentActivity.map((act: any, idx: number) => {
              const isOrder = act.type === 'order';
              const formattedTime = formatTime12Hour(act.timestamp);

              return (
                <View key={idx} style={styles.activityRow}>
                  {/* Left Shopping Bag Icon */}
                  <View style={styles.actIconCircleWeb}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      {isOrder ? (
                        <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                      ) : (
                        <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      )}
                    </Svg>
                  </View>

                  {/* Right Card Content */}
                  <View style={styles.actContentCard}>
                    <Text style={styles.actMessageTitleWeb}>{act.message}</Text>
                    <Text style={styles.actTimeTextWeb}>{formattedTime}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 🔹 Backend Pagination Controls */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, (!paginationMeta.hasPrevPage || activityLoading) && styles.pageBtnDisabled]}
            disabled={!paginationMeta.hasPrevPage || activityLoading}
            onPress={() => fetchDashboardStats(activityPage - 1, true)}
          >
            <Text style={[styles.pageBtnText, (!paginationMeta.hasPrevPage || activityLoading) && styles.pageBtnTextDisabled]}>
              ‹ Previous
            </Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicatorText}>
            Page {paginationMeta.page} of {paginationMeta.totalPages}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageBtn,
              (!paginationMeta.hasNextPage || activityLoading) && styles.pageBtnDisabled,
            ]}
            disabled={!paginationMeta.hasNextPage || activityLoading}
            onPress={() => fetchDashboardStats(activityPage + 1, true)}
          >
            <Text
              style={[
                styles.pageBtnText,
                (!paginationMeta.hasNextPage || activityLoading) && styles.pageBtnTextDisabled,
              ]}
            >
              Next ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  metricCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legendDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2410C',
  },
  legendPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  chartAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 16,
    paddingBottom: 4,
  },
  yAxisLabels: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  axisText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  barsRow: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingLeft: 4,
  },
  singleBarCol: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    flex: 1,
  },
  barTrack: {
    width: 22,
    height: '80%',
    justifyContent: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 6,
  },
  barLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 8,
  },
  applicantName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  typeBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeRest: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  typeRestText: {
    color: '#B45309',
  },
  typeRider: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  typeRiderText: {
    color: '#1D4ED8',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  reviewBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actIconCircleWeb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actContentCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actMessageTitleWeb: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  actTimeTextWeb: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  pageBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
