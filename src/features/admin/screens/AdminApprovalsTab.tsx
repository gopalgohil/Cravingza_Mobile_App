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
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  getAdminRestaurantsApi,
  approveRestaurantApi,
  rejectRestaurantApi,
  getAdminDeliveryProfilesApi,
  approveDeliveryPartnerApi,
  rejectDeliveryPartnerApi,
} from '../services/adminApi';

import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

export const AdminApprovalsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'restaurant' | 'delivery'>('restaurant');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('Document View');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      if (activeSubTab === 'restaurant') {
        const res = await getAdminRestaurantsApi('all');
        setItems(res?.data || res?.restaurants || res || []);
      } else {
        const res = await getAdminDeliveryProfilesApi('all');
        setItems(res?.data || res?.profiles || res || []);
      }
    } catch (err: any) {
      console.log('Error fetching admin applications:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeSubTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <SkeletonPlaceholder width={180} height={20} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs + 4 }} />
      <View style={styles.tabContainer}>
        <View style={[styles.tabBtn, { backgroundColor: '#CBD5E1' }]} />
        <View style={styles.tabBtn} />
      </View>
      {[1, 2].map((i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <SkeletonPlaceholder width={160} height={18} />
            <SkeletonPlaceholder width={70} height={20} borderRadius={6} />
          </View>
          <SkeletonPlaceholder width={100} height={12} style={{ marginTop: 6 }} />
          <SkeletonPlaceholder width={220} height={10} style={{ marginTop: 4 }} />
          <SkeletonPlaceholder width={140} height={10} style={{ marginTop: 4 }} />
          <SkeletonPlaceholder width={130} height={12} style={{ marginTop: 10, marginBottom: 6 }} />
          <View style={styles.docGrid}>
            <View style={styles.docCard}>
              <SkeletonPlaceholder width="100%" height={60} borderRadius={0} />
              <SkeletonPlaceholder width="80%" height={10} style={{ margin: 4, alignSelf: 'center' }} />
            </View>
            <View style={styles.docCard}>
              <SkeletonPlaceholder width="100%" height={60} borderRadius={0} />
              <SkeletonPlaceholder width="80%" height={10} style={{ margin: 4, alignSelf: 'center' }} />
            </View>
            <View style={styles.docCard}>
              <SkeletonPlaceholder width="100%" height={60} borderRadius={0} />
              <SkeletonPlaceholder width="80%" height={10} style={{ margin: 4, alignSelf: 'center' }} />
            </View>
          </View>
          <View style={styles.actionBtnRow}>
            <SkeletonPlaceholder width="48%" height={36} borderRadius={10} />
            <SkeletonPlaceholder width="48%" height={36} borderRadius={10} />
          </View>
        </View>
      ))}
    </View>
  );

  const handleApprove = async (id: string, name: string) => {
    Alert.alert(
      'Approve Partner? ✅',
      `Approve "${name}" and make profile live on Cravingza?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Now ✅',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              if (activeSubTab === 'restaurant') {
                const res = await approveRestaurantApi(id);
                Alert.alert('Approved! 🎉', res?.message || 'Restaurant approved & role updated!');
              } else {
                const res = await approveDeliveryPartnerApi(id);
                Alert.alert('Approved! 🎉', res?.message || 'Delivery rider approved & role updated!');
              }
              fetchApplications();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string, name: string) => {
    Alert.alert(
      'Reject Application? ❌',
      `Reject application for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject ❌',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              if (activeSubTab === 'restaurant') {
                const res = await rejectRestaurantApi(id);
                Alert.alert('Rejected', res?.message || 'Restaurant application rejected.');
              } else {
                const res = await rejectDeliveryPartnerApi(id);
                Alert.alert('Rejected', res?.message || 'Rider application rejected.');
              }
              fetchApplications();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const openImageModal = (url: string, title: string) => {
    if (url) {
      setSelectedImage(url);
      setSelectedTitle(title);
      setModalVisible(true);
    }
  };

  const renderRestaurantItem = ({ item }: { item: any }) => {
    const isPending = item.approvalStatus === 'pending' || !item.approvalStatus;
    const isApproved = item.approvalStatus === 'approved';
    const isRejected = item.approvalStatus === 'rejected';

    const coverUrl = item.image || item.coverImageUrl || item.coverImage || item.documents?.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';
    const fssaiUrl = item.documents?.fssaiLicense || item.documents?.fssai || item.fssaiLicenseUrl || item.fssaiLicense || item.fssai || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';
    const gstUrl = item.documents?.businessRegistration || item.documents?.gstCertificate || item.businessRegistrationUrl || item.gstCertificateUrl || item.gstCertificate || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemTitle}>{item.name || 'Unnamed Restaurant'}</Text>
          <View style={[styles.statusBadge, isApproved && styles.statusBadgeApproved, isRejected && styles.statusBadgeRejected]}>
            <Text style={[styles.statusText, isApproved && styles.statusTextApproved, isRejected && styles.statusTextRejected]}>
              {isApproved ? 'APPROVED ✅' : isRejected ? 'REJECTED ❌' : 'PENDING ⏳'}
            </Text>
          </View>
        </View>

        <Text style={styles.cuisineText}>
          🏷️ {Array.isArray(item.cuisineTags) ? item.cuisineTags.join(', ') : item.cuisineTags || 'Fast Food'}
        </Text>
        <Text style={styles.detailText}>📍 Address: {item.location?.address || item.addressLine || 'N/A'}, {item.location?.city || item.city || 'Noida'}</Text>
        <Text style={styles.detailText}>📞 Phone: {item.ownerPhone || item.phone || '9876543210'}</Text>

        <Text style={styles.docHeaderTitle}>☁️ Cloudinary Documents:</Text>
        <View style={styles.docGrid}>
          {/* Document 1: Cover */}
          <TouchableOpacity style={styles.docCard} onPress={() => coverUrl && openImageModal(coverUrl, 'Cover Photo')} disabled={!coverUrl}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 16 }}>🖼️</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🖼️ Cover</Text>
              <Text style={[styles.docViewLink, !coverUrl && { color: '#94A3B8' }]}>{coverUrl ? 'View 👁️' : 'Missing ⚠️'}</Text>
            </View>
          </TouchableOpacity>

          {/* Document 2: FSSAI */}
          <TouchableOpacity style={styles.docCard} onPress={() => fssaiUrl && openImageModal(fssaiUrl, 'FSSAI License')} disabled={!fssaiUrl}>
            {fssaiUrl ? (
              <Image source={{ uri: fssaiUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 16 }}>📜</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>📜 FSSAI</Text>
              <Text style={[styles.docViewLink, !fssaiUrl && { color: '#94A3B8' }]}>{fssaiUrl ? 'View 👁️' : 'Missing ⚠️'}</Text>
            </View>
          </TouchableOpacity>

          {/* Document 3: GST */}
          <TouchableOpacity style={styles.docCard} onPress={() => gstUrl && openImageModal(gstUrl, 'GST Certificate')} disabled={!gstUrl}>
            {gstUrl ? (
              <Image source={{ uri: gstUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 16 }}>🧾</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🧾 GST</Text>
              <Text style={[styles.docViewLink, !gstUrl && { color: '#94A3B8' }]}>{gstUrl ? 'View 👁️' : 'Missing ⚠️'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {actionLoadingId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.actionBtnRow}>
            {isPending && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(item._id, item.name)}>
                  <Text style={styles.approveBtnText}>✅ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(item._id, item.name)}>
                  <Text style={styles.rejectBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderDeliveryItem = ({ item }: { item: any }) => {
    const isPending = item.approvalStatus === 'pending' || !item.approvalStatus;
    const isApproved = item.approvalStatus === 'approved';
    const isRejected = item.approvalStatus === 'rejected';

    const dlUrl = item.documents?.drivingLicense || item.drivingLicenseUrl || '';
    const aadhaarUrl = item.documents?.aadhaarCard || item.aadhaarCardUrl || '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemTitle}>{item.user?.name || item.phone || 'Delivery Rider'}</Text>
          <View style={[styles.statusBadge, isApproved && styles.statusBadgeApproved, isRejected && styles.statusBadgeRejected]}>
            <Text style={[styles.statusText, isApproved && styles.statusTextApproved, isRejected && styles.statusTextRejected]}>
              {isApproved ? 'APPROVED ✅' : isRejected ? 'REJECTED ❌' : 'PENDING ⏳'}
            </Text>
          </View>
        </View>

        <Text style={styles.detailText}>Vehicle: {item.vehicleType?.toUpperCase()} ({item.vehicleNumber || 'N/A'})</Text>
        <Text style={styles.detailText}>📞 Phone: {item.phone}</Text>

        <Text style={styles.docHeaderTitle}>☁️ Cloudinary Documents:</Text>
        <View style={styles.docGrid}>
          <TouchableOpacity style={styles.docCard} onPress={() => dlUrl && openImageModal(dlUrl, 'Driving License')} disabled={!dlUrl}>
            {dlUrl ? (
              <Image source={{ uri: dlUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 16 }}>🪪</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🪪 License</Text>
              <Text style={[styles.docViewLink, !dlUrl && { color: '#94A3B8' }]}>{dlUrl ? 'View 👁️' : 'Missing ⚠️'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docCard} onPress={() => aadhaarUrl && openImageModal(aadhaarUrl, 'Aadhaar Card')} disabled={!aadhaarUrl}>
            {aadhaarUrl ? (
              <Image source={{ uri: aadhaarUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 16 }}>🆔</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🆔 Aadhaar</Text>
              <Text style={[styles.docViewLink, !aadhaarUrl && { color: '#94A3B8' }]}>{aadhaarUrl ? 'View 👁️' : 'Missing ⚠️'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {actionLoadingId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.actionBtnRow}>
            {isPending && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(item._id, item.user?.name || 'Rider')}>
                  <Text style={styles.approveBtnText}>✅ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(item._id, item.user?.name || 'Rider')}>
                  <Text style={styles.rejectBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.sectionHeaderTitle}>Approvals Management</Text>
      
      {/* Sub Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === 'restaurant' && styles.tabBtnActive]}
          onPress={() => setActiveSubTab('restaurant')}
        >
          <Text style={[styles.tabBtnText, activeSubTab === 'restaurant' && styles.tabBtnTextActive]}>
            Restaurants
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeSubTab === 'delivery' && styles.tabBtnActive]}
          onPress={() => setActiveSubTab('delivery')}
        >
          <Text style={[styles.tabBtnText, activeSubTab === 'delivery' && styles.tabBtnTextActive]}>
            Delivery Riders
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id || item.id}
        ListHeaderComponent={renderHeader}
        renderItem={activeSubTab === 'restaurant' ? renderRestaurantItem : renderDeliveryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32 }}>📋</Text>
            <Text style={styles.emptyTitle}>No Applications Pending</Text>
            <Text style={styles.emptySub}>
              All {activeSubTab === 'restaurant' ? 'restaurant' : 'rider'} applications have been verified.
            </Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📄 {selectedTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 14, color: '#0F172A', fontWeight: 'bold' }}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullPreviewImage} resizeMode="contain" />
            )}
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: FONT_SIZE.md - 1,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  statusTextApproved: {
    color: '#16A34A',
  },
  statusTextRejected: {
    color: '#DC2626',
  },
  cuisineText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  docHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 6,
  },
  docGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  docCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  docThumb: {
    width: '100%',
    height: 60,
  },
  emptyDocThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  emptyDocText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  docCardBadge: {
    padding: 4,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  docCardTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E293B',
  },
  docViewLink: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.xs,
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  rejectBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullPreviewImage: {
    width: '100%',
    height: 340,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});
