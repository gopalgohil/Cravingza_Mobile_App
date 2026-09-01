// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

export const AdminUsersTab = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'owner' | 'delivery'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching live MongoDB Users API for role filter:', activeFilter);
      if (activeFilter === 'all') {
        const [resCust, resOwner, resDel] = await Promise.all([
          getAdminUsersApi('customer').catch(() => null),
          getAdminUsersApi('owner').catch(() => null),
          getAdminUsersApi('delivery').catch(() => null),
        ]);

        const custUsers = resCust?.data?.users || resCust?.users || resCust?.data || [];
        const ownerUsers = resOwner?.data?.users || resOwner?.users || resOwner?.data || [];
        const delUsers = resDel?.data?.users || resDel?.users || resDel?.data || [];

        const combined = [
          ...(Array.isArray(custUsers) ? custUsers : []),
          ...(Array.isArray(ownerUsers) ? ownerUsers : []),
          ...(Array.isArray(delUsers) ? delUsers : []),
        ];
        setUsers(combined);
      } else {
        const targetRole = activeFilter === 'owner' ? 'owner' : activeFilter === 'delivery' ? 'delivery' : 'customer';
        const res = await getAdminUsersApi(targetRole);
        const list = res?.data?.users || res?.users || res?.data || (Array.isArray(res) ? res : []);
        setUsers(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      console.log('Error fetching users:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleUserStatus = (userId: string, userName: string, currentStatus: string) => {
    const isBlocked = currentStatus === 'blocked';
    const newStatus = isBlocked ? 'active' : 'blocked';

    Alert.alert(
      `${isBlocked ? 'Unblock' : 'Block'} User Account?`,
      `Are you sure you want to ${newStatus} account for "${userName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock 🔓' : 'Block 🔒',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoadingId(userId);
            try {
              const res = await updateUserStatusApi(userId, newStatus);
              Alert.alert('Updated', res?.message || `User account marked as ${newStatus}.`);
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update user status.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const renderSkeleton = () => (
    <View style={[styles.listContent, { marginTop: SPACING.sm }]}>
      <View style={styles.filterBar}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPlaceholder key={i} width={75} height={28} borderRadius={10} />
        ))}
      </View>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonPlaceholder width={140} height={14} />
              <SkeletonPlaceholder width={180} height={10} />
              <SkeletonPlaceholder width={90} height={10} />
            </View>
            <SkeletonPlaceholder width={60} height={20} borderRadius={6} />
          </View>
          <View style={styles.divider} />
          <View style={styles.cardFooter}>
            <SkeletonPlaceholder width={110} height={12} />
            <SkeletonPlaceholder width={80} height={26} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View style={{ marginTop: SPACING.sm }}>
      {/* Filter Chips */}
      <View style={styles.filterBar}>
        {[
          { id: 'all', label: 'All Users' },
          { id: 'customer', label: 'Customers' },
          { id: 'owner', label: 'Owners' },
          { id: 'delivery', label: 'Riders' },
        ].map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.id as any)}
          >
            <Text style={[styles.filterChipText, activeFilter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => {
    const isBlocked = item.status === 'blocked';
    const isOwner = item.role === 'restaurant_owner' || item.role === 'owner';
    const isDelivery = item.role === 'delivery_partner' || item.role === 'delivery';
    const isAdmin = item.role === 'admin';

    const roleLabel = isOwner
      ? 'Restaurant Owner'
      : isDelivery
        ? 'Delivery Partner'
        : isAdmin
          ? 'Super Admin'
          : 'Customer';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.name || 'Platform User'}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                {isOwner ? (
                  <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                ) : isDelivery ? (
                  <Path d="M15 6h5l3 5v6h-2M9 17h6M5 17H3v-5l2-4h8v9" />
                ) : (
                  <Circle cx="12" cy="7" r="4" />
                )}
              </Svg>
              <Text style={styles.userRole}>{roleLabel}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isBlocked ? styles.statusBlocked : styles.statusActive]}>
            <Text style={[styles.statusBadgeText, isBlocked ? styles.statusTextBlocked : styles.statusTextActive]}>
              {isBlocked ? 'BLOCKED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </Svg>
            <Text style={styles.phoneText}>{item.phone || 'N/A'}</Text>
          </View>

          {actionLoadingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <TouchableOpacity
              style={[styles.blockBtn, isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]}
              onPress={() => handleToggleUserStatus(item._id, item.name || 'User', item.status)}
            >
              <Text style={[styles.blockBtnText, isBlocked ? styles.unblockText : styles.blockText]}>
                {isBlocked ? 'Unblock' : 'Block'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id || item.id}
      ListHeaderComponent={renderHeader}
      renderItem={renderUserItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 32 }}>👥</Text>
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptySub}>No accounts match the selected filter.</Text>
        </View>
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
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: FONT_SIZE.xs + 2,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBlocked: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextBlocked: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 11,
    color: '#475569',
  },
  blockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  blockBtnStyle: {
    backgroundColor: '#FEE2E2',
  },
  unblockBtnStyle: {
    backgroundColor: '#DCFCE7',
  },
  blockBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  blockText: {
    color: '#DC2626',
  },
  unblockText: {
    color: '#16A34A',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  emptySub: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 2,
  },
});
