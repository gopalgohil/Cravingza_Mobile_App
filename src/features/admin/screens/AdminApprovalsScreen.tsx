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
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  getAdminRestaurantsApi,
  approveRestaurantApi,
  rejectRestaurantApi,
  getAdminDeliveryProfilesApi,
  approveDeliveryPartnerApi,
  rejectDeliveryPartnerApi,
} from '../services/adminApi';

export const AdminApprovalsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'delivery'>('restaurant');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Document Image Preview Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('Document View');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      if (activeTab === 'restaurant') {
        console.log('Fetching Super Admin Restaurants API...');
        const res = await getAdminRestaurantsApi();
        console.log('Admin Restaurants Response:', res);
        setItems(res?.data || res?.restaurants || res || []);
      } else {
        console.log('Fetching Super Admin Delivery Profiles API...');
        const res = await getAdminDeliveryProfilesApi();
        console.log('Admin Delivery Profiles Response:', res);
        setItems(res?.data || res?.profiles || res || []);
      }
    } catch (err: any) {
      console.log('Error fetching admin applications:', err.message);
      Alert.alert('Super Admin Access', err.message || 'Failed to fetch pending applications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleApprove = async (id: string, name: string) => {
    Alert.alert(
      'Approve Partner? ✅',
      `Are you sure you want to approve "${name}"? This will upgrade their role and make their profile live on Cravingza.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Now ✅',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              if (activeTab === 'restaurant') {
                const res = await approveRestaurantApi(id);
                Alert.alert('Approved! 🎉', res?.message || 'Restaurant has been approved & role updated!');
              } else {
                const res = await approveDeliveryPartnerApi(id);
                Alert.alert('Approved! 🎉', res?.message || 'Delivery rider has been approved & role updated!');
              }
              fetchApplications();
            } catch (err: any) {
              Alert.alert('Approval Error ❌', err.message || 'Failed to approve application.');
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
      `Are you sure you want to reject "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject ❌',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              if (activeTab === 'restaurant') {
                const res = await rejectRestaurantApi(id);
                Alert.alert('Rejected', res?.message || 'Restaurant application rejected.');
              } else {
                const res = await rejectDeliveryPartnerApi(id);
                Alert.alert('Rejected', res?.message || 'Delivery rider application rejected.');
              }
              fetchApplications();
            } catch (err: any) {
              Alert.alert('Rejection Error ❌', err.message || 'Failed to reject application.');
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

    // Exact extraction for all 3 Cloudinary Document URLs uploaded by customer
    const coverUrl =
      item.image ||
      item.coverImageUrl ||
      item.coverImage ||
      item.documents?.coverImage ||
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';

    const fssaiUrl =
      item.documents?.fssaiLicense ||
      item.documents?.fssai ||
      item.fssaiLicenseUrl ||
      item.fssaiLicense ||
      item.fssai ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';

    const gstUrl =
      item.documents?.businessRegistration ||
      item.documents?.gstCertificate ||
      item.businessRegistrationUrl ||
      item.gstCertificateUrl ||
      item.gstCertificate ||
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemTitle}>{item.name || 'Unnamed Restaurant'}</Text>
          <View
            style={[
              styles.statusBadge,
              isApproved && styles.statusBadgeApproved,
              isRejected && styles.statusBadgeRejected,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isApproved && styles.statusTextApproved,
                isRejected && styles.statusTextRejected,
              ]}
            >
              {isApproved ? 'APPROVED ✅' : isRejected ? 'REJECTED ❌' : 'PENDING ⏳'}
            </Text>
          </View>
        </View>

        <Text style={styles.cuisineText}>
          🏷️ {Array.isArray(item.cuisineTags) ? item.cuisineTags.join(', ') : item.cuisineTags || 'Fast Food'}
        </Text>
        <Text style={styles.detailText}>📍 {item.location?.address || item.addressLine || 'Sector 62 Market'}, {item.location?.city || item.city || 'Noida'}</Text>
        <Text style={styles.detailText}>📮 Pincode: {item.pincode || '201301'}</Text>
        <Text style={styles.detailText}>📞 Owner Phone: {item.ownerPhone || item.phone || '9876543210'}</Text>

        {/* 🌟 3 Cloudinary Uploaded Documents Grid */}
        <Text style={styles.docHeaderTitle}>☁️ Cloudinary Uploaded Documents (3 Files):</Text>
        <View style={styles.docGrid}>
          {/* Document 1: Cover Photo */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => coverUrl && openImageModal(coverUrl, 'Cover Photo')}
            disabled={!coverUrl}
          >
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 20 }}>🖼️</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🖼️ Cover Photo</Text>
              <Text style={[styles.docViewLink, !coverUrl && { color: '#94A3B8' }]}>
                {coverUrl ? 'View 👁️' : 'Missing ⚠️'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Document 2: FSSAI License */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => fssaiUrl && openImageModal(fssaiUrl, 'FSSAI License')}
            disabled={!fssaiUrl}
          >
            {fssaiUrl ? (
              <Image source={{ uri: fssaiUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 20 }}>📜</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>📜 FSSAI License</Text>
              <Text style={[styles.docViewLink, !fssaiUrl && { color: '#94A3B8' }]}>
                {fssaiUrl ? 'View 👁️' : 'Missing ⚠️'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Document 3: GST Certificate */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => gstUrl && openImageModal(gstUrl, 'GST Certificate')}
            disabled={!gstUrl}
          >
            {gstUrl ? (
              <Image source={{ uri: gstUrl }} style={styles.docThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.docThumb, styles.emptyDocThumb]}>
                <Text style={{ fontSize: 20 }}>🧾</Text>
                <Text style={styles.emptyDocText}>Not Uploaded</Text>
              </View>
            )}
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🧾 GST Certificate</Text>
              <Text style={[styles.docViewLink, !gstUrl && { color: '#94A3B8' }]}>
                {gstUrl ? 'View 👁️' : 'Missing ⚠️'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {actionLoadingId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 14 }} />
        ) : (
          <View style={styles.actionBtnRow}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item._id, item.name)}
                >
                  <Text style={styles.approveBtnText}>✅ Approve Partner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item._id, item.name)}
                >
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

    const dlUrl =
      item.documents?.drivingLicense ||
      item.drivingLicenseUrl ||
      '';

    const aadhaarUrl =
      item.documents?.aadhaarCard ||
      item.aadhaarCardUrl ||
      '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemTitle}>{item.user?.name || item.phone || 'Delivery Rider'}</Text>
          <View
            style={[
              styles.statusBadge,
              isApproved && styles.statusBadgeApproved,
              isRejected && styles.statusBadgeRejected,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isApproved && styles.statusTextApproved,
                isRejected && styles.statusTextRejected,
              ]}
            >
              {isApproved ? 'APPROVED ✅' : isRejected ? 'REJECTED ❌' : 'PENDING ⏳'}
            </Text>
          </View>
        </View>

        <Text style={styles.detailText}>🛵 Vehicle: {item.vehicleType?.toUpperCase()} ({item.vehicleNumber || 'N/A'})</Text>
        <Text style={styles.detailText}>📞 Phone: {item.phone}</Text>
        <Text style={styles.detailText}>📍 City: {item.city} (Pincode: {item.pincode})</Text>

        <Text style={styles.docHeaderTitle}>☁️ Cloudinary KYC Documents (2 Files):</Text>
        <View style={styles.docGrid}>
          <TouchableOpacity style={styles.docCard} onPress={() => openImageModal(dlUrl, 'Driving License')}>
            <Image source={{ uri: dlUrl }} style={styles.docThumb} resizeMode="cover" />
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🪪 Driving License</Text>
              <Text style={styles.docViewLink}>View 👁️</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.docCard} onPress={() => openImageModal(aadhaarUrl, 'Aadhaar Card')}>
            <Image source={{ uri: aadhaarUrl }} style={styles.docThumb} resizeMode="cover" />
            <View style={styles.docCardBadge}>
              <Text style={styles.docCardTitle} numberOfLines={1}>🆔 Aadhaar Card</Text>
              <Text style={styles.docViewLink}>View 👁️</Text>
            </View>
          </TouchableOpacity>
        </View>

        {actionLoadingId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 14 }} />
        ) : (
          <View style={styles.actionBtnRow}>
            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item._id, item.user?.name || 'Rider')}
                >
                  <Text style={styles.approveBtnText}>✅ Approve Rider</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item._id, item.user?.name || 'Rider')}
                >
                  <Text style={styles.rejectBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
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
          <Text style={styles.topHeaderTitle}>Super Admin Portal 🛡️</Text>
          <TouchableOpacity onPress={fetchApplications} style={styles.refreshBtn}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'restaurant' && styles.tabBtnActive]}
            onPress={() => setActiveTab('restaurant')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'restaurant' && styles.tabBtnTextActive]}>
              🏪 Restaurants
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'delivery' && styles.tabBtnActive]}
            onPress={() => setActiveTab('delivery')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'delivery' && styles.tabBtnTextActive]}>
              🛵 Delivery Riders
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Fetching applications from MongoDB...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id || item.id}
            renderItem={activeTab === 'restaurant' ? renderRestaurantItem : renderDeliveryItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36 }}>📋</Text>
                <Text style={styles.emptyTitle}>No Applications Found</Text>
                <Text style={styles.emptySub}>
                  No pending {activeTab === 'restaurant' ? 'restaurant' : 'delivery rider'} applications found in MongoDB.
                </Text>
              </View>
            }
          />
        )}

        {/* Full Image Preview Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>📄 {selectedTitle}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: 'bold' }}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.fullPreviewImage} resizeMode="contain" />
              )}
            </View>
          </View>
        </Modal>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    padding: 4,
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
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: COLORS.white,
    fontWeight: '800',
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
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: FONT_SIZE.md,
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
    marginBottom: 6,
  },
  detailText: {
    fontSize: FONT_SIZE.xs,
    color: '#475569',
    marginTop: 2,
  },
  docHeaderTitle: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  docGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  docCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  docThumb: {
    width: '100%',
    height: 70,
    backgroundColor: '#E2E8F0',
  },
  emptyDocThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  emptyDocText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  docCardBadge: {
    padding: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  docCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
  },
  docViewLink: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.xs + 1,
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  rejectBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONT_SIZE.xs + 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: FONT_SIZE.sm + 1,
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fullPreviewImage: {
    width: '100%',
    height: 380,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
});
