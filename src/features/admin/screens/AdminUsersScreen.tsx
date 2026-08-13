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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminUsersApi, updateUserStatusApi } from '../services/adminApi';

export const AdminUsersScreen = ({ navigation }: any) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'owner' | 'delivery'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching Admin Users API...');
      const res = await getAdminUsersApi();
      console.log('Admin Users API Response:', res);
      setUsers(res?.data || res?.users || res || []);
    } catch (err: any) {
      console.log('Error fetching users:', err.message);
      Alert.alert('User Management', err.message || 'Failed to fetch platform users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
          text: isBlocked ? 'Unblock Account 🔓' : 'Block Account 🔒',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoadingId(userId);
            try {
              const res = await updateUserStatusApi(userId, newStatus);
              Alert.alert('Status Updated', res?.message || `User account marked as ${newStatus}.`);
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

  const filteredUsers = users.filter((u) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'customer') return u.role === 'customer' || !u.role;
    if (activeFilter === 'owner') return u.role === 'restaurant_owner' || u.role === 'owner';
    if (activeFilter === 'delivery') return u.role === 'delivery_partner' || u.role === 'delivery';
    return true;
  });

  const renderUserItem = ({ item }: { item: any }) => {
    const isBlocked = item.status === 'blocked';
    const roleText =
      item.role === 'restaurant_owner' || item.role === 'owner'
        ? '🏪 Restaurant Owner'
        : item.role === 'delivery_partner' || item.role === 'delivery'
        ? '🛵 Delivery Partner'
        : item.role === 'admin'
        ? '🛡️ Super Admin'
        : '👤 Customer';

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
            <Text style={styles.userRole}>{roleText}</Text>
          </View>
          <View style={[styles.statusBadge, isBlocked ? styles.statusBlocked : styles.statusActive]}>
            <Text style={[styles.statusBadgeText, isBlocked ? styles.statusTextBlocked : styles.statusTextActive]}>
              {isBlocked ? 'BLOCKED 🔒' : 'ACTIVE ✅'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.phoneText}>📞 Phone: {item.phone || 'N/A'}</Text>

          {actionLoadingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <TouchableOpacity
              style={[styles.blockBtn, isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]}
              onPress={() => handleToggleUserStatus(item._id, item.name || 'User', item.status)}
            >
              <Text style={[styles.blockBtnText, isBlocked ? styles.unblockText : styles.blockText]}>
                {isBlocked ? '🔓 Unblock User' : '🔒 Block User'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backCircleBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>User Management 👥</Text>
          <TouchableOpacity onPress={fetchUsers} style={styles.refreshBtn}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
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

        {/* User List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching Platform Users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id || item.id}
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
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topHeaderTitle: {
    color: '#0F172A',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748B',
    marginTop: 8,
    fontSize: FONT_SIZE.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 1,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBlocked: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
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
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: FONT_SIZE.xs,
    color: '#475569',
    fontWeight: '600',
  },
  blockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  blockBtnStyle: {
    backgroundColor: '#FEE2E2',
  },
  unblockBtnStyle: {
    backgroundColor: '#DCFCE7',
  },
  blockBtnText: {
    fontSize: 11,
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
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
