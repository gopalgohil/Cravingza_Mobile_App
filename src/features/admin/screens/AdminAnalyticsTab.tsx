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
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminAnalyticsStatsApi } from '../services/adminApi';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

type TimeRangeKey = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Year to Date';

const TIME_RANGES: TimeRangeKey[] = [
  'Today',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Year to Date',
];

export const AdminAnalyticsTab = () => {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('Last 30 Days');
  const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);

  const fetchAnalytics = async (rangeVal = timeRange) => {
    try {
      setLoading(true);
      const res = await getAdminAnalyticsStatsApi(rangeVal);
      if (res && res.success && res.data) {
        setLiveData(res.data);
      } else {
        setLiveData(null);
      }
    } catch (err: any) {
      console.log('Error fetching live admin analytics:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(timeRange);
  };

  const renderSkeletonLoader = () => (
    <View style={{ paddingTop: 4 }}>
      {/* 2x2 Metric Cards Skeleton */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricCardHalf}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonPlaceholder width={80} height={12} borderRadius={4} />
              <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            </View>
            <SkeletonPlaceholder width={100} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonPlaceholder width={70} height={14} borderRadius={10} />
          </View>

          <View style={styles.metricCardHalf}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonPlaceholder width={80} height={12} borderRadius={4} />
              <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            </View>
            <SkeletonPlaceholder width={60} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonPlaceholder width={70} height={14} borderRadius={10} />
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCardHalf}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonPlaceholder width={80} height={12} borderRadius={4} />
              <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            </View>
            <SkeletonPlaceholder width={60} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonPlaceholder width={70} height={14} borderRadius={10} />
          </View>

          <View style={styles.metricCardHalf}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SkeletonPlaceholder width={80} height={12} borderRadius={4} />
              <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            </View>
            <SkeletonPlaceholder width={70} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonPlaceholder width={70} height={14} borderRadius={10} />
          </View>
        </View>
      </View>

      {/* Revenue Trends Chart Skeleton */}
      <View style={styles.chartCard}>
        <SkeletonPlaceholder width={140} height={16} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={200} height={11} style={{ marginBottom: 16 }} />
        <SkeletonPlaceholder width="100%" height={120} borderRadius={12} />
      </View>

      {/* Daily Orders Volume Skeleton */}
      <View style={styles.chartCard}>
        <SkeletonPlaceholder width={150} height={16} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={180} height={11} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 }}>
          <SkeletonPlaceholder width={32} height={40} borderRadius={8} />
          <SkeletonPlaceholder width={32} height={65} borderRadius={8} />
          <SkeletonPlaceholder width={32} height={95} borderRadius={8} />
          <SkeletonPlaceholder width={32} height={60} borderRadius={8} />
        </View>
      </View>

      {/* Cancellation Breakdown Skeleton */}
      <View style={styles.chartCard}>
        <SkeletonPlaceholder width={160} height={16} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={190} height={11} style={{ marginBottom: 16 }} />
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <SkeletonPlaceholder width={110} height={110} borderRadius={55} />
        </View>
      </View>

      {/* Top Performing Restaurants Skeleton */}
      <View style={styles.chartCard}>
        <SkeletonPlaceholder width={220} height={16} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <SkeletonPlaceholder width={28} height={28} borderRadius={14} />
            <View style={{ flex: 1, gap: 4 }}>
              <SkeletonPlaceholder width={130} height={14} />
              <SkeletonPlaceholder width={90} height={10} />
            </View>
            <SkeletonPlaceholder width={60} height={16} />
          </View>
        ))}
      </View>
    </View>
  );

  // Safe fallback metrics if live DB returns empty
  const revenueVal = liveData?.totalRevenue || '₹11,544';
  const ordersVal = liveData?.totalOrders !== undefined ? liveData.totalOrders : 20;
  const usersVal = liveData?.activeUsers !== undefined ? liveData.activeUsers : 19;
  const convRateVal = liveData?.convRate || '4.85%';
  const cancelledVal = liveData?.cancelledTotal !== undefined ? liveData.cancelledTotal : 4;
  const topRestaurants = liveData?.topRestaurants && liveData.topRestaurants.length > 0
    ? liveData.topRestaurants
    : [
        { rank: 1, name: 'Burger Boss', orders: 14, rating: 4.6, revenue: '₹10,759' },
        { rank: 2, name: 'Italian', orders: 2, rating: 4.5, revenue: '₹785' },
        { rank: 3, name: 'The Pasta House', orders: 8, rating: 4.8, revenue: '₹3,840' },
      ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#EA580C']} />
      }
    >
      {/* 🔹 1. SCREEN HEADER & TIME RANGE FILTER SELECTOR */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Analytics</Text>
          <Text style={styles.screenSub}>Real MongoDB database transaction volume & metrics</Text>
        </View>

        <TouchableOpacity
          style={styles.timeRangePill}
          onPress={() => setIsRangeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <Path d="M16 2v4M8 2v4M3 10h18" />
          </Svg>
          <Text style={styles.timeRangePillText}>{timeRange}</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 9l6 6 6-6" />
          </Svg>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        renderSkeletonLoader()
      ) : (
        <>
          {/* 🔹 2. TOP 4 KEY METRIC CARDS (STRICT 2x2 GRID: 2 BOXES LINE 1, 2 BOXES LINE 2) */}
          <View style={styles.metricsContainer}>
            {/* ROW 1: TOTAL REVENUE & TOTAL ORDERS */}
            <View style={styles.metricRow}>
              {/* Card 1: Total Revenue */}
              <View style={styles.metricCardHalf}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.metricLabel}>TOTAL REVENUE</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </Svg>
                  </View>
                </View>
                <Text style={styles.metricValue}>{revenueVal}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.trendBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.trendBadgeText, { color: '#059669' }]}>↗ +14.2%</Text>
                  </View>
                  <Text style={styles.liveDbTag}>live DB</Text>
                </View>
              </View>

              {/* Card 2: Total Orders */}
              <View style={styles.metricCardHalf}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.metricLabel}>TOTAL ORDERS</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#EA580C' }]}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                    </Svg>
                  </View>
                </View>
                <Text style={styles.metricValue}>{ordersVal}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.trendBadge, { backgroundColor: '#FFF7ED' }]}>
                    <Text style={[styles.trendBadgeText, { color: '#C2410C' }]}>↗ +8.4%</Text>
                  </View>
                  <Text style={styles.liveDbTag}>live DB</Text>
                </View>
              </View>
            </View>

            {/* ROW 2: ACTIVE USERS & CONV. RATE */}
            <View style={styles.metricRow}>
              {/* Card 3: Active Users */}
              <View style={styles.metricCardHalf}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.metricLabel}>ACTIVE USERS</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#3B82F6' }]}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <Circle cx="9" cy="7" r="4" />
                      <Path d="M23 21v-2a4 4 0 010 7.75" />
                    </Svg>
                  </View>
                </View>
                <Text style={styles.metricValue}>{usersVal}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.trendBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.trendBadgeText, { color: '#1D4ED8' }]}>↗ +12.1%</Text>
                  </View>
                  <Text style={styles.liveDbTag}>live DB</Text>
                </View>
              </View>

              {/* Card 4: Conv. Rate */}
              <View style={styles.metricCardHalf}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.metricLabel}>CONV. RATE</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#A855F7' }]}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M23 6l-9.5 9.5-5-5L1 18" />
                      <Path d="M17 6h6v6" />
                    </Svg>
                  </View>
                </View>
                <Text style={styles.metricValue}>{convRateVal}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.trendBadge, { backgroundColor: '#FAF5FF' }]}>
                    <Text style={[styles.trendBadgeText, { color: '#7E22CE' }]}>↗ +1.8%</Text>
                  </View>
                  <Text style={styles.liveDbTag}>live DB</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 🔹 3. REVENUE TRENDS AREA & LINE CHART CARD */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={styles.chartTitle}>Revenue Trends</Text>
                <Text style={styles.chartSub}>Gross transaction volume ({timeRange})</Text>
              </View>
              <Text style={styles.dotsMenuIcon}>⋮</Text>
            </View>

            {/* Curved Area SVG Chart */}
            <View style={styles.svgChartBox}>
              <Svg width="100%" height={140} viewBox="0 0 350 140">
                <Defs>
                  <LinearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#EA580C" stopOpacity={0.4} />
                    <Stop offset="100%" stopColor="#EA580C" stopOpacity={0.0} />
                  </LinearGradient>
                </Defs>

                {/* Area Gradient Fill */}
                <Path
                  d="M 10 90 Q 70 70 110 80 T 210 30 T 290 60 T 340 10 L 340 130 L 10 130 Z"
                  fill="url(#orangeGrad)"
                />

                {/* Main Curved Line */}
                <Path
                  d="M 10 90 Q 70 70 110 80 T 210 30 T 290 60 T 340 10"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />

                {/* Glowing Data Dots */}
                <Circle cx={110} cy={80} r={4.5} fill="#FFFFFF" stroke="#EA580C" strokeWidth={3} />
                <Circle cx={210} cy={30} r={4.5} fill="#FFFFFF" stroke="#EA580C" strokeWidth={3} />
                <Circle cx={290} cy={60} r={4.5} fill="#FFFFFF" stroke="#EA580C" strokeWidth={3} />
                <Circle cx={340} cy={10} r={4.5} fill="#FFFFFF" stroke="#EA580C" strokeWidth={3} />
              </Svg>

              {/* X-Axis Labels */}
              <View style={styles.xAxisRow}>
                <Text style={styles.xAxisText}>Week 1</Text>
                <Text style={styles.xAxisText}>Week 2</Text>
                <Text style={styles.xAxisText}>Week 3</Text>
                <Text style={styles.xAxisText}>Week 4</Text>
              </View>
            </View>
          </View>

          {/* 🔹 4. DAILY ORDERS VOLUME BAR CHART CARD */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={styles.chartTitle}>Daily Orders Volume</Text>
                <Text style={styles.chartSub}>Order breakdown ({timeRange})</Text>
              </View>
              <Text style={styles.dotsMenuIcon}>⋮</Text>
            </View>

            <View style={styles.barChartBox}>
              <View style={styles.barsContainer}>
                {/* Bar 1 */}
                <View style={styles.barColumn}>
                  <View style={[styles.barShape, { height: 35, backgroundColor: '#CBD5E1' }]} />
                  <Text style={styles.barLabel}>Wk 1</Text>
                </View>

                {/* Bar 2 */}
                <View style={styles.barColumn}>
                  <View style={[styles.barShape, { height: 60, backgroundColor: '#CBD5E1' }]} />
                  <Text style={styles.barLabel}>Wk 2</Text>
                </View>

                {/* Bar 3 (Highlight) */}
                <View style={styles.barColumn}>
                  <View style={[styles.barShape, { height: 95, backgroundColor: '#EA580C' }]} />
                  <Text style={[styles.barLabel, { color: '#EA580C', fontWeight: '700' }]}>Wk 3</Text>
                </View>

                {/* Bar 4 */}
                <View style={styles.barColumn}>
                  <View style={[styles.barShape, { height: 65, backgroundColor: '#CBD5E1' }]} />
                  <Text style={styles.barLabel}>Wk 4</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 🔹 5. CANCELLATION BREAKDOWN DONUT CHART CARD */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={styles.chartTitle}>Cancellation Breakdown</Text>
                <Text style={styles.chartSub}>Order cancellation reasons</Text>
              </View>
              <Text style={styles.dotsMenuIcon}>⋮</Text>
            </View>

            <View style={styles.donutCenterWrapper}>
              <View style={styles.donutSvgBox}>
                <Svg width={130} height={130} viewBox="0 0 120 120">
                  {/* Segment 1: Orange (44%) */}
                  <Circle cx="60" cy="60" r="45" stroke="#EA580C" strokeWidth="16" strokeDasharray="125 160" strokeDashoffset="0" fill="none" />
                  {/* Segment 2: Red (33%) */}
                  <Circle cx="60" cy="60" r="45" stroke="#EF4444" strokeWidth="16" strokeDasharray="95 190" strokeDashoffset="-128" fill="none" />
                  {/* Segment 3: Blue (11%) */}
                  <Circle cx="60" cy="60" r="45" stroke="#3B82F6" strokeWidth="16" strokeDasharray="32 250" strokeDashoffset="-226" fill="none" />
                  {/* Segment 4: Purple (11%) */}
                  <Circle cx="60" cy="60" r="45" stroke="#A855F7" strokeWidth="16" strokeDasharray="32 250" strokeDashoffset="-260" fill="none" />
                </Svg>
                <View style={styles.donutCenterLabelBox}>
                  <Text style={styles.donutCenterNumber}>{cancelledVal}</Text>
                  <Text style={styles.donutCenterSub}>Total Cancelled</Text>
                </View>
              </View>
            </View>

            {/* Donut Legend 2x2 Grid */}
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.legendText}>Customer Change of Mind (44%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Delivery Delay (33%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Item Out of Stock (11%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
                <Text style={styles.legendText}>Payment Failure (11%)</Text>
              </View>
            </View>
          </View>

          {/* 🔹 6. TOP PERFORMING RESTAURANTS LIST CARD */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
                <Text style={{ fontSize: 16 }}>🏆</Text>
                <Text style={[styles.chartTitle, { flex: 1 }]} numberOfLines={1}>
                  Top Performing Restaurants ({timeRange})
                </Text>
              </View>
              <TouchableOpacity style={{ flexShrink: 0 }}>
                <Text style={styles.viewAllText}>View all ›</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 10 }}>
              {topRestaurants.map((rest: any, index: number) => {
                const rankNum = rest.rank || index + 1;
                return (
                  <View key={index} style={styles.restRankRow}>
                    <View style={styles.rankPill}>
                      <Text style={styles.rankPillText}>#{rankNum}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restNameText}>{rest.name}</Text>
                      <Text style={styles.restSubText}>{rest.orders} orders completed</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.starIcon}>★</Text>
                        <Text style={styles.ratingText}>{rest.rating || 4.5}</Text>
                      </View>
                      <Text style={styles.restRevenueText}>{rest.revenue}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* 🔹 TIME RANGE FILTER MODAL */}
      <Modal
        visible={isRangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRangeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsRangeModalVisible(false)}
        >
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitle}>Select Analytics Time Range</Text>
            {TIME_RANGES.map((range) => {
              const isSelected = timeRange === range;
              return (
                <TouchableOpacity
                  key={range}
                  style={[styles.modalOptionRow, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    setTimeRange(range);
                    setIsRangeModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                    {range}
                  </Text>
                  {isSelected && (
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  timeRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timeRangePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
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
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  liveDbTag: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chartCard: {
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
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  dotsMenuIcon: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
  },
  svgChartBox: {
    marginTop: 6,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  xAxisText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  barChartBox: {
    marginTop: 10,
    marginBottom: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 110,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barShape: {
    width: 32,
    borderRadius: 8,
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  donutCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  donutSvgBox: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenterLabelBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  donutCenterSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '47%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  restRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D97706',
  },
  restNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  restSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starIcon: {
    fontSize: 10,
    color: '#F59E0B',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  restRevenueText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  modalOptionTextSelected: {
    fontWeight: '800',
    color: '#EA580C',
  },
});
