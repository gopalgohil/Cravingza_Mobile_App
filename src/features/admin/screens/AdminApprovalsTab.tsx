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
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  getAdminRestaurantsApi,
  approveRestaurantApi,
  rejectRestaurantApi,
  getAdminDeliveryProfilesApi,
  approveDeliveryPartnerApi,
  rejectDeliveryPartnerApi,
} from '../services/adminApi';

import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

// 🔹 Clean SVG Vector Outline Icons matching uploaded specification
const UserOutlineIcon = ({ size = 18, color = "#64748B" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const MailOutlineIcon = ({ size = 18, color = "#64748B" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path d="M22 6l-10 7L2 6" />
  </Svg>
);

const PhoneOutlineIcon = ({ size = 18, color = "#64748B" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </Svg>
);

const LocationPinOutlineIcon = ({ size = 20, color = "#64748B" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 21s-7-5.33-7-11a7 7 0 1114 0c0 5.67-7 11-7 11z" />
    <Circle cx="12" cy="10" r="2.5" />
    <Path d="M4 22h16" />
  </Svg>
);


export const AdminApprovalsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'restaurant' | 'delivery'>('restaurant');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Selected Application Modal for Full Details
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Image Zoom Modal
  const [imageModalVisible, setImageModalVisible] = useState(false);
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

  const openImageZoom = (url: string, title: string) => {
    setSelectedImage(url);
    setSelectedTitle(title);
    setImageModalVisible(true);
  };

  const handleApprove = async (id: string, name: string) => {
    Alert.alert('Approve Partner', `Are you sure you want to approve "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          try {
            setActionLoadingId(id);
            if (activeSubTab === 'restaurant') {
              await approveRestaurantApi(id);
            } else {
              await approveDeliveryPartnerApi(id);
            }
            Alert.alert('Success 🎉', `Application for "${name}" has been approved!`);
            setDetailModalVisible(false);
            fetchApplications();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Action failed.');
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (id: string, name: string) => {
    Alert.alert('Reject Application', `Are you sure you want to reject "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoadingId(id);
            if (activeSubTab === 'restaurant') {
              await rejectRestaurantApi(id);
            } else {
              await rejectDeliveryPartnerApi(id);
            }
            Alert.alert('Application Rejected', `Application for "${name}" has been rejected.`);
            setDetailModalVisible(false);
            fetchApplications();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Action failed.');
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
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
          <SkeletonPlaceholder width={160} height={18} />
          <SkeletonPlaceholder width={100} height={12} style={{ marginTop: 6 }} />
          <SkeletonPlaceholder width={220} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );

  const renderRestaurantItem = ({ item }: { item: any }) => {
    const isApproved = item.approvalStatus === 'approved';
    const isRejected = item.approvalStatus === 'rejected';

    const ownerName = item.ownerName || item.owner?.name || item.name || item.user?.name || 'Partner Owner';
    const city = item.city || item.location?.city || 'Vadodara';
    const appliedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '13 Aug';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedApplication(item);
          setDetailModalVisible(true);
        }}
      >
        {/* Top Header Row: Restaurant Name & Status Badge */}
        <View style={styles.cardHeaderRow}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.name || 'Restaurant Application'}</Text>
          <View style={[styles.statusBadge, isApproved && styles.statusBadgeApproved, isRejected && styles.statusBadgeRejected]}>
            <Text style={[styles.statusText, isApproved && styles.statusTextApproved, isRejected && styles.statusTextRejected]}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Sub Meta Row: Owner Name & Location */}
        <View style={styles.ownerInfoRow}>
          <View style={styles.metaItem}>
            <UserOutlineIcon size={14} color="#64748B" />
            <Text style={styles.ownerMetaText} numberOfLines={1}>{ownerName}</Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <View style={styles.metaItem}>
            <LocationPinOutlineIcon size={14} color="#64748B" />
            <Text style={styles.ownerMetaText} numberOfLines={1}>{city}</Text>
          </View>
        </View>

        {/* Card Footer Row: Applied Date & CTA */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.appliedDateText}>Applied {appliedDate}</Text>
          <View style={styles.reviewCtaBtn}>
            <Text style={styles.tapToViewText}>Review Application →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDeliveryItem = ({ item }: { item: any }) => {
    const isApproved = item.approvalStatus === 'approved';
    const isRejected = item.approvalStatus === 'rejected';

    const riderName = item.user?.name || item.name || 'Delivery Partner';
    const city = item.city || 'Vadodara';
    const appliedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '13 Aug';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedApplication(item);
          setDetailModalVisible(true);
        }}
      >
        {/* Top Header Row: Delivery Partner Badge & Rider Name */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.applicationLabelSub}>DELIVERY PARTNER APPLICATION</Text>
            <Text style={styles.itemTitle} numberOfLines={1}>{riderName}</Text>
          </View>
          <View style={[styles.statusBadge, isApproved && styles.statusBadgeApproved, isRejected && styles.statusBadgeRejected]}>
            <Text style={[styles.statusText, isApproved && styles.statusTextApproved, isRejected && styles.statusTextRejected]}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Sub Meta Row: Vehicle Type & Location */}
        <View style={styles.ownerInfoRow}>
          <View style={styles.metaItem}>
            <UserOutlineIcon size={14} color="#64748B" />
            <Text style={styles.ownerMetaText} numberOfLines={1}>{item.vehicleType?.toUpperCase() || 'MOTORCYCLE'}</Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <View style={styles.metaItem}>
            <LocationPinOutlineIcon size={14} color="#64748B" />
            <Text style={styles.ownerMetaText} numberOfLines={1}>{city}</Text>
          </View>
        </View>

        {/* Card Footer Row: Applied Date & CTA */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.appliedDateText}>Applied {appliedDate}</Text>
          <View style={styles.reviewCtaBtn}>
            <Text style={styles.tapToViewText}>Review Application →</Text>
          </View>
        </View>
      </TouchableOpacity>
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

  // Selected Application Document Extraction
  const coverUrl =
    selectedApplication?.image ||
    selectedApplication?.coverImageUrl ||
    selectedApplication?.coverImage ||
    selectedApplication?.documents?.coverImage ||
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';

  const fssaiUrl =
    selectedApplication?.documents?.fssaiLicense ||
    selectedApplication?.documents?.fssai ||
    selectedApplication?.fssaiLicenseUrl ||
    selectedApplication?.fssaiLicense ||
    selectedApplication?.fssai ||
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';

  const gstUrl =
    selectedApplication?.documents?.businessRegistration ||
    selectedApplication?.documents?.gstCertificate ||
    selectedApplication?.businessRegistrationUrl ||
    selectedApplication?.gstCertificateUrl ||
    selectedApplication?.gstCertificate ||
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

  const dlDocUrl =
    selectedApplication?.documents?.drivingLicense ||
    selectedApplication?.drivingLicenseUrl ||
    selectedApplication?.drivingLicense ||
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80';

  const aadhaarDocUrl =
    selectedApplication?.documents?.aadhaarCard ||
    selectedApplication?.aadhaarCardUrl ||
    selectedApplication?.aadhaarCard ||
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80';

  const ownerName =
    selectedApplication?.user?.name ||
    selectedApplication?.ownerName ||
    selectedApplication?.owner?.name ||
    selectedApplication?.name ||
    'Applicant';

  const ownerEmail =
    selectedApplication?.user?.email ||
    selectedApplication?.ownerEmail ||
    selectedApplication?.owner?.email ||
    selectedApplication?.email ||
    'applicant@cravingza.com';

  const ownerPhone =
    selectedApplication?.user?.phone ||
    selectedApplication?.ownerPhone ||
    selectedApplication?.phone ||
    selectedApplication?.owner?.phone ||
    'N/A';

  const addressLine =
    selectedApplication?.addressLine ||
    selectedApplication?.address ||
    selectedApplication?.location?.address ||
    (selectedApplication?.city ? `${selectedApplication.city}${selectedApplication.pincode ? ` - ${selectedApplication.pincode}` : ''}` : 'Vadodara');

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

      {/* 🌟 1. FULL APPLICATION DETAILS MODAL */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSectionLabel}>
                    {activeSubTab === 'restaurant' ? 'RESTAURANT DETAILS' : 'DELIVERY PARTNER APPLICATION'}
                  </Text>
                  <Text style={styles.modalDetailTitle}>
                    {activeSubTab === 'restaurant'
                      ? (selectedApplication?.name || selectedApplication?.restaurantName || 'Restaurant Application')
                      : (selectedApplication?.user?.name || selectedApplication?.name || 'Delivery Partner Application')}
                  </Text>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}>
                  <Text style={{ fontSize: 16, color: '#64748B', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Cover Photo Box (RESTAURANT ONLY) */}
              {activeSubTab === 'restaurant' && (
                <View style={styles.coverBoxContainer}>
                  <Image source={{ uri: coverUrl }} style={styles.coverPhotoImg} resizeMode="cover" />
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover Photo</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewFullCoverBtn}
                    onPress={() => openImageZoom(coverUrl, 'Cover Photo')}
                  >
                    <Text style={styles.viewFullCoverText}>View Full Image</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Cuisine Tags (RESTAURANT ONLY) */}
              {activeSubTab === 'restaurant' && (
                <>
                  <Text style={styles.subFieldLabel}>CUISINE & TAGS</Text>
                  <View style={styles.cuisineRow}>
                    {(selectedApplication?.cuisines || ['Indian', 'Biryani', 'Fast Food']).map((tag: string, idx: number) => (
                      <View key={idx} style={styles.cuisinePill}>
                        <Text style={styles.cuisinePillText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Contact Box */}
              <Text style={styles.subFieldLabel}>
                {activeSubTab === 'restaurant' ? 'OWNER CONTACT' : 'RIDER CONTACT INFORMATION'}
              </Text>
              <View style={styles.contactGrayCard}>
                <View style={styles.contactItemRow}>
                  <UserOutlineIcon size={20} color="#64748B" />
                  <Text style={styles.contactValNameText}>{ownerName}</Text>
                </View>
                <View style={styles.contactItemRow}>
                  <MailOutlineIcon size={20} color="#64748B" />
                  <Text style={styles.contactValSubText}>{ownerEmail}</Text>
                </View>
                <View style={styles.contactItemRow}>
                  <PhoneOutlineIcon size={20} color="#64748B" />
                  <Text style={styles.contactValSubText}>{ownerPhone}</Text>
                </View>
              </View>

              {/* Location Details */}
              <Text style={styles.subFieldLabel}>
                {activeSubTab === 'restaurant' ? 'LOCATION DETAILS' : 'SERVICE CITY & AREA'}
              </Text>
              <View style={styles.locationDetailRow}>
                <LocationPinOutlineIcon size={22} color="#64748B" />
                <Text style={styles.locationValText}>{addressLine}</Text>
              </View>

              {/* Business Credentials & Verification Documents (DYNAMIC FROM MONGODB) */}
              {activeSubTab === 'delivery' ? (
                <>
                  <Text style={[styles.subFieldLabel, { marginTop: 16 }]}>
                    BUSINESS & VEHICLE CREDENTIALS
                  </Text>
                  <View style={styles.credentialsCard}>
                    <View style={styles.credRow}>
                      <Text style={styles.credLabel}>Vehicle Type:</Text>
                      <Text style={styles.credVal}>{selectedApplication?.vehicleType?.toUpperCase() || 'MOTORCYCLE'}</Text>
                    </View>
                    <View style={styles.credRow}>
                      <Text style={styles.credLabel}>Vehicle Number:</Text>
                      <Text style={styles.credVal}>{selectedApplication?.vehicleNumber || 'GJ-06-XX-1234'}</Text>
                    </View>
                    <View style={styles.credRow}>
                      <Text style={styles.credLabel}>City & Pincode:</Text>
                      <Text style={styles.credVal}>{selectedApplication?.city || 'Vadodara'} {selectedApplication?.pincode ? `- ${selectedApplication.pincode}` : ''}</Text>
                    </View>
                    {selectedApplication?.bankDetails && (
                      <View style={styles.credRow}>
                        <Text style={styles.credLabel}>Bank Account:</Text>
                        <Text style={styles.credVal}>
                          {selectedApplication?.bankDetails?.bankName || 'Bank'} (Acc: {selectedApplication?.bankDetails?.accountNumber || '****'})
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.subFieldLabel, { marginTop: 16 }]}>
                    VERIFICATION DOCUMENTS (DL & AADHAAR)
                  </Text>
                  <View style={styles.docBoxList}>
                    {/* Driving License */}
                    <TouchableOpacity
                      style={styles.docRowBox}
                      onPress={() => openImageZoom(dlDocUrl, 'Driving License')}
                    >
                      <Image source={{ uri: dlDocUrl }} style={styles.docRowThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docRowTitle}>🪪 Driving License Document</Text>
                        <Text style={styles.docRowSub}>Click to view high-res document</Text>
                      </View>
                      <Text style={styles.docViewLinkText}>View →</Text>
                    </TouchableOpacity>

                    {/* Aadhaar Card */}
                    <TouchableOpacity
                      style={styles.docRowBox}
                      onPress={() => openImageZoom(aadhaarDocUrl, 'Aadhaar Card')}
                    >
                      <Image source={{ uri: aadhaarDocUrl }} style={styles.docRowThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docRowTitle}>🧾 Aadhaar / ID Card</Text>
                        <Text style={styles.docRowSub}>Click to view high-res document</Text>
                      </View>
                      <Text style={styles.docViewLinkText}>View →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.subFieldLabel, { marginTop: 16 }]}>
                    BUSINESS CREDENTIALS & VERIFICATION DOCUMENTS
                  </Text>
                  <View style={styles.docBoxList}>
                    {/* Document 1: FSSAI */}
                    <TouchableOpacity
                      style={styles.docRowBox}
                      onPress={() => openImageZoom(fssaiUrl, 'FSSAI License')}
                    >
                      <Image source={{ uri: fssaiUrl }} style={styles.docRowThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docRowTitle}>📜 FSSAI License Document</Text>
                        <Text style={styles.docRowSub}>Click to view high-res document</Text>
                      </View>
                      <Text style={styles.docViewLinkText}>View →</Text>
                    </TouchableOpacity>

                    {/* Document 2: GST / Business Registry */}
                    <TouchableOpacity
                      style={styles.docRowBox}
                      onPress={() => openImageZoom(gstUrl, 'Business Registry Copy')}
                    >
                      <Image source={{ uri: gstUrl }} style={styles.docRowThumb} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docRowTitle}>🧾 Business Registry Copy (GST)</Text>
                        <Text style={styles.docRowSub}>Click to view high-res document</Text>
                      </View>
                      <Text style={styles.docViewLinkText}>View →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Action Buttons / Status Banners Footer */}
              {actionLoadingId === selectedApplication?._id ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
              ) : selectedApplication?.approvalStatus === 'approved' ? (
                <View style={styles.approvedStatusBanner}>
                  <Text style={styles.approvedStatusText}>✓ Application Approved & Verified Partner</Text>
                </View>
              ) : selectedApplication?.approvalStatus === 'rejected' ? (
                <View style={styles.rejectedStatusBanner}>
                  <Text style={styles.rejectedStatusText}>✕ Application Rejected</Text>
                </View>
              ) : (
                <View style={styles.modalActionFooter}>
                  <TouchableOpacity
                    style={styles.btnRejectClean}
                    onPress={() =>
                      handleReject(
                        selectedApplication?._id,
                        selectedApplication?.user?.name || selectedApplication?.name || selectedApplication?.restaurantName || 'Partner'
                      )
                    }
                  >
                    <Text style={styles.btnRejectCleanText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnApproveClean}
                    onPress={() =>
                      handleApprove(
                        selectedApplication?._id,
                        selectedApplication?.user?.name || selectedApplication?.name || selectedApplication?.restaurantName || 'Partner'
                      )
                    }
                  >
                    <Text style={styles.btnApproveCleanText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🌟 2. FULL IMAGE ZOOM MODAL */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.imageZoomOverlay}>
          <View style={styles.imageZoomCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>📄 {selectedTitle}</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeBtn}>
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
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  applicationLabelSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  credentialsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  credLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  credVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  ownerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ownerMetaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  metaDivider: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appliedDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewCtaBtn: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  tapToViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  statusBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeRejected: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  statusTextApproved: {
    color: '#047857',
  },
  statusTextRejected: {
    color: '#BE123C',
  },
  tapToViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  modalDetailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  coverBoxContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  coverPhotoImg: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  viewFullCoverBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewFullCoverText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cuisineRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cuisinePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cuisinePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  contactGrayCard: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 16,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactValNameText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
  },
  contactValSubText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  locationValText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
    flex: 1,
  },
  docBoxList: {
    gap: 10,
    marginVertical: 10,
  },
  docRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  docRowThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  docRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docRowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  docViewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  // 🌟 Action Buttons Footer (Clean NO LEFT ICONS)
  modalActionFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnRejectClean: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRejectCleanText: {
    color: '#E11D48',
    fontSize: 15,
    fontWeight: '800',
  },
  btnApproveClean: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669', // Clean Green Accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnApproveCleanText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Image Zoom Modal
  imageZoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageZoomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  fullPreviewImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  approvedStatusBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  approvedStatusText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
  },
  rejectedStatusBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  rejectedStatusText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
});
