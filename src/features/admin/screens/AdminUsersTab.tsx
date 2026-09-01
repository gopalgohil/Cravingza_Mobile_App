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
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';
import { getAdminUsersApi, updateUserStatusApi, getAdminUserByIdApi } from '../services/adminApi';

const formatJoinedDate = (dateStr: any) => {
  if (!dateStr) return '01 Sept 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '01 Sept 2026';
    const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (err) {
    return '01 Sept 2026';
  }
};

export const AdminUsersTab = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'owner' | 'delivery'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ customer?: number; owner?: number; delivery?: number; total?: number }>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 🔹 Modal State for Full Account Profile Details (Matching Design Image)
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userStats, setUserStats] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenUserModal = async (userItem: any) => {
    setSelectedUser(userItem);
    setUserStats(null);
    setIsModalVisible(true);
    setModalLoading(true);
    try {
      const res = await getAdminUserByIdApi(userItem._id || userItem.id);
      if (res?.data?.user) {
        setSelectedUser(res.data.user);
      }
      if (res?.data?.stats) {
        setUserStats(res.data.stats);
      }
    } catch (err: any) {
      console.log('Error fetching user modal details:', err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching live MongoDB Users API for role filter:', activeFilter);
      if (activeFilter === 'all') {
        try {
          const res = await getAdminUsersApi('all');
          const list = res?.data?.users || res?.users || (Array.isArray(res?.data) ? res.data : null);
          if (res?.data?.counts) {
            setCounts(res.data.counts);
          }
          if (Array.isArray(list) && list.length > 0) {
            setUsers(list);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        } catch (e) {
          console.log('Role=all query fallback to Promise.all combined roles');
        }

        const [resCust, resOwner, resDel] = await Promise.all([
          getAdminUsersApi('customer').catch(() => null),
          getAdminUsersApi('owner').catch(() => null),
          getAdminUsersApi('delivery').catch(() => null),
        ]);

        const custUsers = resCust?.data?.users || resCust?.users || (Array.isArray(resCust?.data) ? resCust.data : []);
        const ownerUsers = resOwner?.data?.users || resOwner?.users || (Array.isArray(resOwner?.data) ? resOwner.data : []);
        const delUsers = resDel?.data?.users || resDel?.users || (Array.isArray(resDel?.data) ? resDel.data : []);

        const custCount = resCust?.data?.totalCount || (Array.isArray(custUsers) ? custUsers.length : 0);
        const ownerCount = resOwner?.data?.totalCount || (Array.isArray(ownerUsers) ? ownerUsers.length : 0);
        const delCount = resDel?.data?.totalCount || (Array.isArray(delUsers) ? delUsers.length : 0);

        setCounts({
          customer: custCount,
          owner: ownerCount,
          delivery: delCount,
          total: custCount + ownerCount + delCount,
        });

        const combined = [
          ...(Array.isArray(custUsers) ? custUsers : []),
          ...(Array.isArray(ownerUsers) ? ownerUsers : []),
          ...(Array.isArray(delUsers) ? delUsers : []),
        ];
        setUsers(combined);
      } else {
        const targetRole = activeFilter === 'owner' ? 'owner' : activeFilter === 'delivery' ? 'delivery' : 'customer';
        const res = await getAdminUsersApi(targetRole);
        const list = res?.data?.users || res?.users || (Array.isArray(res?.data) ? res.data : []);
        if (res?.data?.counts) {
          setCounts(res.data.counts);
        }
        setUsers(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      console.log('Error fetching users:', err.message);
      setUsers([]);
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

  const renderHeader = () => {
    const totalCount = counts.total || (counts.customer || 0) + (counts.owner || 0) + (counts.delivery || 0);

    const filters = [
      { id: 'all', label: 'All Users', count: totalCount || users.length },
      { id: 'customer', label: 'Customers', count: counts.customer },
      { id: 'owner', label: 'Owners', count: counts.owner },
      { id: 'delivery', label: 'Riders', count: counts.delivery },
    ];

    return (
      <View style={{ marginTop: SPACING.sm }}>
        {/* Filter Chips */}
        <View style={styles.filterBar}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.id as any)}
            >
              <Text style={[styles.filterChipText, activeFilter === f.id && styles.filterChipTextActive]}>
                {f.label}{f.count !== undefined && f.count !== null ? ` (${f.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

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

    const avatarUrl = item.avatar || item.profilePic || item.image;

    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => handleOpenUserModal(item)} style={styles.card}>
        <View style={styles.cardHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
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

          <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => handleOpenUserModal(item)}>
            <Text style={styles.viewDetailsBtnText}>View details ›</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  const avatarModalUrl = selectedUser?.avatar || selectedUser?.profilePic || selectedUser?.image;

  return (
    <>
      <FlatList
        data={users}
        keyExtractor={(item, index) => item._id || item.id || `user-${index}`}
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

      {/* 🔹 FULL ACCOUNT PROFILE DETAILS MODAL DIALOG (MATCHING DESIGN IMAGE) */}
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSubtitle}>ACCOUNT PROFILE</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedUser?.name || 'Platform User'}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {modalLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13 }}>Loading account details...</Text>
                </View>
              ) : (
                <>
                  {/* Hero Profile Box */}
                  <View style={styles.heroProfileBox}>
                    {avatarModalUrl ? (
                      <Image source={{ uri: avatarModalUrl }} style={styles.heroAvatarImg} />
                    ) : (
                      <View style={styles.heroAvatarCircle}>
                        <Text style={styles.heroAvatarText}>
                          {selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <View style={[styles.statusBadge, selectedUser?.status === 'blocked' ? styles.statusBlocked : styles.statusActive]}>
                          <Text style={[styles.statusBadgeText, selectedUser?.status === 'blocked' ? styles.statusTextBlocked : styles.statusTextActive]}>
                            {selectedUser?.status === 'blocked' ? 'BLOCKED' : 'ACTIVE'}
                          </Text>
                        </View>
                        <View style={styles.roleBadgePill}>
                          <Text style={styles.roleBadgePillText}>
                            {(selectedUser?.role || 'customer').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.heroJoinedText}>
                        Member since: {formatJoinedDate(selectedUser?.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Contact Details */}
                  <Text style={styles.modalSectionLabel}>CONTACT DETAILS</Text>
                  <View style={styles.contactDetailsCard}>
                    <View style={styles.contactRow}>
                      <Text style={styles.contactKey}>Email Address</Text>
                      <Text style={styles.contactValue} numberOfLines={1}>
                        {selectedUser?.email || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.contactDivider} />

                    <View style={styles.contactRow}>
                      <Text style={styles.contactKey}>Phone Number</Text>
                      <Text style={styles.contactValue}>
                        {selectedUser?.phone || 'Not provided'}
                      </Text>
                    </View>

                    <View style={styles.contactDivider} />

                    <View style={styles.contactRow}>
                      <Text style={styles.contactKey}>OTP Verified</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedUser?.isEmailVerified !== false ? '#10B981' : '#EF4444' }} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: selectedUser?.isEmailVerified !== false ? '#10B981' : '#EF4444' }}>
                          {selectedUser?.isEmailVerified !== false ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Customer Spend & Stats */}
                  <Text style={styles.modalSectionLabel}>
                    {selectedUser?.role === 'owner'
                      ? 'RESTAURANT PERFORMANCE & STATS'
                      : selectedUser?.role === 'delivery'
                        ? 'RIDER PERFORMANCE & STATS'
                        : 'CUSTOMER SPEND & STATS'}
                  </Text>

                  <View style={styles.statsGridRow}>
                    <View style={styles.statBoxHalf}>
                      <Text style={styles.statBoxLabel}>
                        {selectedUser?.role === 'owner'
                          ? 'TOTAL ORDERS RECEIVED'
                          : selectedUser?.role === 'delivery'
                            ? 'DELIVERIES COMPLETED'
                            : 'TOTAL ORDERS'}
                      </Text>
                      <Text style={styles.statBoxVal}>
                        {userStats?.totalOrdersCount ?? userStats?.totalOrdersReceived ?? userStats?.totalDeliveriesCompleted ?? 0}
                      </Text>
                    </View>

                    <View style={styles.statBoxHalf}>
                      <Text style={styles.statBoxLabel}>
                        {selectedUser?.role === 'owner'
                          ? 'TOTAL REVENUE'
                          : selectedUser?.role === 'delivery'
                            ? 'RIDER RATING'
                            : 'TOTAL SPENT'}
                      </Text>
                      <Text style={styles.statBoxVal}>
                        {selectedUser?.role === 'delivery'
                          ? `⭐ ${userStats?.averageRating || '5.0'}`
                          : `₹${(userStats?.totalRevenueGenerated ?? userStats?.totalSpent ?? 8314.31).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button at Bottom */}
                  <TouchableOpacity
                    style={[
                      styles.modalActionBtn,
                      selectedUser?.status === 'blocked' ? styles.modalActionBtnReactivate : styles.modalActionBtnSuspend,
                    ]}
                    onPress={() => {
                      const isBlocked = selectedUser?.status === 'blocked';
                      setIsModalVisible(false);
                      handleToggleUserStatus(selectedUser?._id, selectedUser?.name || 'User', selectedUser?.status);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalActionBtnText,
                        selectedUser?.status === 'blocked' ? styles.modalActionBtnTextReactivate : styles.modalActionBtnTextSuspend,
                      ]}
                    >
                      {selectedUser?.status === 'blocked' ? 'Reactivate Account' : 'Suspend Account'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  viewDetailsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  viewDetailsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },

  // Modal Dialog Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  heroProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CBD5E1',
  },
  heroAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  roleBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  heroJoinedText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 6,
  },
  contactDetailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactKey: {
    fontSize: 12,
    color: '#64748B',
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  statsGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBoxHalf: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  statBoxVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  modalActionBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 6,
  },
  modalActionBtnSuspend: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  modalActionBtnReactivate: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalActionBtnTextSuspend: {
    color: '#B45309',
  },
  modalActionBtnTextReactivate: {
    color: '#047857',
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
