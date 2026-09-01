// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';
import { BASE_URL, getAuthToken, apiClient } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';



interface DeliveryAvatarModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarUpdated: (newUrl: string) => void;
}

export const DeliveryAvatarModal: React.FC<DeliveryAvatarModalProps> = ({
  visible,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated,
}) => {
  const { currentUser, setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(currentAvatarUrl || '');

  const activeAvatar = selectedUrl || currentAvatarUrl || RIDER_PRESET_AVATARS[0].url;

  // Save selected avatar URL into MongoDB Atlas database and AuthContext
  const saveAvatarToBackend = async (url: string) => {
    try {
      setLoading(true);
      console.log('💾 Saving Delivery Boy Avatar URL to MongoDB database:', url);
      await apiClient('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: currentUser?.name || 'Delivery Partner',
          avatar: url,
        }),
      });

      // Update global user context state
      setAuthUser({
        ...currentUser,
        avatar: url,
      });

      setSelectedUrl(url);
      onAvatarUpdated(url);

      Alert.alert(
        'Avatar Updated 🎉',
        'Your profile picture has been updated and saved to your account successfully!'
      );
      onClose();
    } catch (err: any) {
      console.log('Error saving avatar:', err);
      Alert.alert('Update Failed ❌', err?.message || 'Unable to save avatar.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for custom gallery image pick & Cloudinary upload
  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 600,
        maxHeight: 600,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) return;

      setLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `rider_avatar_${Date.now()}.jpg`,
      } as any);
      formData.append('folder', 'cravingza/profile-avatars');

      const activeToken = getAuthToken();
      console.log('Uploading custom photo to Cloudinary via POST /api/upload...');

      const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log('Cloudinary Upload API Response:', uploadData);

      const uploadedUrl =
        uploadData?.url ||
        uploadData?.secure_url ||
        uploadData?.data?.url ||
        uploadData?.data?.secure_url;

      if (!uploadRes.ok || !uploadedUrl) {
        throw new Error(uploadData?.message || uploadData?.error || 'Failed to upload photo to Cloudinary.');
      }

      await saveAvatarToBackend(uploadedUrl);
    } catch (err: any) {
      console.log('Gallery upload error:', err);
      Alert.alert('Upload Failed ❌', err?.message || 'Unable to upload photo.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>Choose Profile Avatar 🚴</Text>
              <Text style={styles.modalSubtitle}>Pick a hero avatar or upload your own photo</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Active Preview */}
          <View style={styles.activePreviewCard}>
            <View style={styles.avatarFrame}>
              <Image source={{ uri: activeAvatar }} style={styles.previewImage} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="medium" color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroNameText}>{currentUser?.name || 'Delivery Partner'}</Text>
              <Text style={styles.heroSubText}>Verified Cravingza Hero 🚴</Text>
              <View style={styles.activeBadgePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>ACTIVE AVATAR</Text>
              </View>
            </View>
          </View>

          {/* Gallery Upload Banner Button */}
          <TouchableOpacity
            style={styles.uploadGalleryBtn}
            onPress={handlePickFromGallery}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.uploadIconCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <Circle cx="12" cy="13" r="4" />
              </Svg>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.uploadBtnTitle}>Upload Photo from Gallery 📷</Text>
              <Text style={styles.uploadBtnSub}>Select image from phone camera or gallery</Text>
            </View>
            <Text style={styles.uploadArrow}>›</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>OR CHOOSE A HERO AVATAR</Text>

          {/* Preset Hero Avatars Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarGrid}
          >
            {RIDER_PRESET_AVATARS.map((item) => {
              const isSelected = activeAvatar === item.url;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.avatarCard, isSelected && styles.avatarCardSelected]}
                  onPress={() => saveAvatarToBackend(item.url)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.url }} style={styles.presetGridImage} />
                  {isSelected && (
                    <View style={styles.selectedCheckBadge}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.presetNameText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.presetTagText} numberOfLines={1}>
                    {item.tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  activePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  avatarFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EA580C',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  uploadGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadBtnSub: {
    fontSize: 12,
    color: '#FFEDD5',
    marginTop: 1,
  },
  uploadArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  avatarCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  avatarCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  presetGridImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  presetNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  presetTagText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
});
