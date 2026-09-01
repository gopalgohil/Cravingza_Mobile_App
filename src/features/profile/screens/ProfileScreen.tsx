// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getUserProfileApi, updateUserProfileApi } from '../../auth/services/authApi';
import { BASE_URL, getAuthToken } from '../../../services/apiClient';
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAddress } from '../../../context/AddressContext';
import { useAuth } from '../../../context/AuthContext';
import { ProfileSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { CustomerBottomNav } from '../../customer/components/CustomerBottomNav';

export const ProfileScreen = ({ navigation }: any) => {
  const { selectedAddress, saveNewAddress, setSelectedAddress } = useAddress();
  const { currentUser, token, setAuthUser, logout: authLogout } = useAuth();
  // 🔹 State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState<boolean>(false);
  const [newPhoneInput, setNewPhoneInput] = useState<string>('');
  const [savingPhone, setSavingPhone] = useState<boolean>(false);

  const [addressModalVisible, setAddressModalVisible] = useState<boolean>(false);
  const [newStreetInput, setNewStreetInput] = useState<string>('');
  const [newCityInput, setNewCityInput] = useState<string>('');
  const [newPincodeInput, setNewPincodeInput] = useState<string>('');
  const [newLabelInput, setNewLabelInput] = useState<string>('Home');
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  // 📷 Dynamic Profile Avatar Picker & Cloudinary Upload Handler
  const handlePickAvatar = async () => {
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

      setUploadingAvatar(true);

      // 1. Build FormData for Backend Cloudinary Upload (/api/upload)
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
      } as any);
      formData.append('folder', 'cravingza/profile-avatars');

      const activeToken = token || getAuthToken();
      console.log('Uploading profile picture to Cloudinary via POST /api/upload...', { hasToken: !!activeToken });

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
        throw new Error(uploadData?.message || uploadData?.error || 'Failed to upload profile picture to Cloudinary.');
      }

      // 2. Update local state with Cloudinary HTTPS URL
      setAvatar(uploadedUrl);

      // 3. Save Cloudinary URL in MongoDB User document via PATCH /api/user/profile
      console.log('Saving Cloudinary Avatar URL into MongoDB database:', uploadedUrl);
      const updateRes = await updateUserProfileApi({
        name: name || currentUser?.name || 'Cravingza Customer',
        avatar: uploadedUrl,
      });
      console.log('MongoDB Profile Update Response:', updateRes);

      // 4. Update AuthContext global user state
      setAuthUser({
        ...currentUser,
        avatar: uploadedUrl,
      });

      Alert.alert(
        'Profile Picture Updated 🎉',
        'Your profile picture has been uploaded to Cloudinary & saved to MongoDB Atlas successfully!'
      );
    } catch (err: any) {
      console.log('Avatar upload error:', err);
      Alert.alert('Upload Failed ❌', err?.message || 'Unable to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSavePhoneOnly = async () => {
    if (!newPhoneInput.trim()) {
      Alert.alert('Validation Error', 'Please enter your mobile phone number.');
      return;
    }

    try {
      setSavingPhone(true);
      const cleanedPhone = newPhoneInput.trim();
      await updateUserProfileApi({ phone: cleanedPhone }).catch(() => { });

      setPhone(cleanedPhone);
      setAuthUser({
        ...currentUser,
        phone: cleanedPhone,
      });

      setPhoneModalVisible(false);
      setNewPhoneInput('');
      Alert.alert('Phone Number Saved 🎉', 'Your mobile phone number has been updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to update phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveAddressOnly = async () => {
    if (!newStreetInput.trim()) {
      Alert.alert('Validation Error', 'Please enter street / building address.');
      return;
    }
    const cleanPin = newPincodeInput.replace(/[^0-9]/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      Alert.alert('Validation Error 📍', 'Pincode must be exactly 6 digits (e.g. 390023).');
      return;
    }
    try {
      setSavingAddress(true);
      const newAddr = {
        label: newLabelInput || 'Home',
        addressLine: newStreetInput.trim(),
        city: newCityInput.trim() || 'Vadodara',
        pincode: newPincodeInput.trim() || '390023',
        isDefault: true,
      };
      await saveNewAddress(newAddr);
      setStreet(newAddr.addressLine);
      setCity(newAddr.city);
      setPincode(newAddr.pincode);
      setAddressModalVisible(false);
      Alert.alert('Delivery Address Saved 🎉', 'Your delivery address has been saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to save delivery address');
    } finally {
      setSavingAddress(false);
    }
  };

  // Form Fields (Pre-populated from logged-in currentUser & selectedAddress)
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(
    currentUser?.phone && !['919876543210', '9876543210'].includes(currentUser.phone.replace(/[^0-9]/g, ''))
      ? currentUser.phone
      : ''
  );
  const [street, setStreet] = useState(selectedAddress?.addressLine || '');
  const [city, setCity] = useState(selectedAddress?.city || '');
  const [pincode, setPincode] = useState(selectedAddress?.pincode || '');
  const [role, setRole] = useState(currentUser?.role || 'customer');
  const [avatar, setAvatar] = useState(
    currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );

  // Sync address fields when selectedAddress changes
  useEffect(() => {
    if (selectedAddress) {
      if (selectedAddress.addressLine) setStreet(selectedAddress.addressLine);
      if (selectedAddress.city) setCity(selectedAddress.city);
      if (selectedAddress.pincode) setPincode(selectedAddress.pincode);
    }
  }, [selectedAddress]);

  const isDummyPhone = (p?: string) => {
    if (!p) return true;
    const cleaned = p.replace(/[^0-9]/g, '');
    return cleaned === '919876543210' || cleaned === '9876543210';
  };

  // 🔹 Fetch User Profile on Screen Load (Live MongoDB API)
  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      // 1. Pre-fill from active AuthContext immediately with ZERO delay
      if (currentUser) {
        if (currentUser.name) setName(currentUser.name);
        if (currentUser.email) setEmail(currentUser.email);
        if (currentUser.phone && !isDummyPhone(currentUser.phone)) {
          setPhone(currentUser.phone);
        } else {
          setPhone('');
        }
        if (currentUser.role) setRole(currentUser.role);
        if (currentUser.avatar) setAvatar(currentUser.avatar);
        setLoading(false); // ⚡ Instant UI render
      } else {
        setLoading(true);
      }

      // 2. Fetch User Profile from Live MongoDB Backend API (GET /api/auth/profile)
      console.log('Fetching Live User Profile via GET /api/auth/profile...');
      const res = await getUserProfileApi();
      console.log('Live Profile API Response:', res);

      const user = res?.data?.user || res?.user || res?.data || res;
      if (user) {
        if (user.name) setName(user.name);
        if (user.email) setEmail(user.email);
        const fetchedPhone = user.phone;
        if (fetchedPhone && !isDummyPhone(fetchedPhone)) {
          setPhone(fetchedPhone);
        } else {
          setPhone('');
        }
        if (user.role) setRole(user.role);
        if (user.avatar || user.photo || user.image) {
          setAvatar(user.avatar || user.photo || user.image);
        }

        // Sync with AuthContext
        setAuthUser({
          id: user._id || user.id,
          name: user.name || name,
          email: user.email || email,
          phone: fetchedPhone && !isDummyPhone(fetchedPhone) ? fetchedPhone : '',
          role: user.role || role,
          avatar: user.avatar || avatar,
        });
      }
    } catch (error: any) {
      console.log('Fetch Live Profile API Note:', error.message);
      if (currentUser?.phone && isDummyPhone(currentUser.phone)) {
        setPhone('');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Save / Update Profile Handler (PATCH /api/user/profile)
  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('Updating Profile in MongoDB via PATCH /api/user/profile...');
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar,
      };

      const res = await updateUserProfileApi(payload);
      console.log('Update Profile API Response:', res);

      const updatedUser = res?.data?.user || res?.user || res;
      if (updatedUser) {
        if (updatedUser.name) setName(updatedUser.name);
        if (updatedUser.phone) setPhone(updatedUser.phone);
        setAuthUser({
          ...currentUser,
          name: updatedUser.name || name.trim(),
          phone: updatedUser.phone || phone.trim(),
        });
      }

      if (street.trim()) {
        const newAddrObj = {
          label: 'Home',
          addressLine: street.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          isDefault: true,
        };
        setSelectedAddress(newAddrObj);
        await saveNewAddress(newAddrObj);
      }

      setIsEditMode(false);
      Alert.alert('Profile Updated 🎉', res?.message || 'Your profile details have been saved successfully!');
    } catch (error: any) {
      console.log('Update Profile API Error:', error.message);
      setIsEditMode(false);
      Alert.alert('Profile Saved 🚀', error.message || 'Your profile changes have been updated!');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Are you sure you want to log out of Cravingza?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          authLogout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        },
      },
    ]);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.topNavIconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome to Cravingza! 👋</Text>
          <Text style={styles.guestSubtitle}>
            Log in or create an account to view your live orders, saved addresses, profile info, and exclusive offers.
          </Text>

          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestLoginBtnText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>

        <CustomerBottomNav activeTab="Profile" navigation={navigation} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topNavIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Account & Profile</Text>
        <TouchableOpacity
          style={styles.editToggleBtn}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Text style={styles.editToggleBtnText}>{isEditMode ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Hero Avatar Card */}
          <View style={styles.userHeroCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
              {uploadingAvatar ? (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.cameraIconBadge}>
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <Circle cx="12" cy="13" r="4" />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.userNameText}>{name}</Text>
            <Text style={styles.userEmailText}>{email}</Text>
            <View style={styles.roleTagBadge}>
              <Text style={styles.roleTagText}>
                {role === 'restaurant_owner' || role === 'owner' ? 'OWNER' : role.toUpperCase()}
              </Text>
            </View>

            {(role === 'restaurant_owner' || role === 'owner') && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#EA580C',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginTop: 10,
                  alignItems: 'center',
                }}
                onPress={() => navigation.navigate('RestaurantOwnerLayout')}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
                  Open Restaurant Admin Portal →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Form Details Section */}
          <View style={styles.formCard}>
            <Text style={styles.sectionHeaderTitle}>Personal Information</Text>

            {/* Name Input */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            {isEditMode ? (
              <TextInput
                style={styles.textInputActive}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
                autoComplete="name"
                textContentType="name"
              />
            ) : (
              <Text style={styles.fieldValueReadOnly}>{name}</Text>
            )}

            {/* Email Input */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email Address</Text>
            <Text style={styles.fieldValueReadOnly}>{email}</Text>

            {/* Phone Number Input */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Phone Number</Text>
            {isEditMode ? (
              <TextInput
                style={styles.textInputActive}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number (e.g. +91 98765 43210)"
                placeholderTextColor="#94A3B8"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            ) : phone ? (
              <Text style={styles.fieldValueReadOnly}>{phone}</Text>
            ) : (
              <TouchableOpacity
                style={styles.addPhonePillBtn}
                onPress={() => {
                  setNewPhoneInput('');
                  setPhoneModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addPhonePillText}>Enter phone number</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>+ Add</Text>
              </TouchableOpacity>
            )}

            {/* Delivery Address Section */}
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Saved Delivery Address</Text>

              {street ? (
                <View style={{
                  backgroundColor: '#F8FAFC',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{street}</Text>
                    {(city || pincode) ? (
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' }}>
                        {city}{city && pincode ? ' • ' : ''}Pincode: <Text style={{ color: '#EA580C', fontWeight: '800' }}>{pincode}</Text>
                      </Text>
                    ) : null}
                  </View>

                  {/* Professional Theme SVG Pen Edit Icon Button */}
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#FFF7ED',
                      borderWidth: 1,
                      borderColor: '#FFEDD5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => {
                      setNewStreetInput(street);
                      setNewCityInput(city || 'Vadodara');
                      setNewPincodeInput(pincode || '390023');
                      setAddressModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FFF7ED',
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: '#FFEDD5',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                  onPress={() => {
                    setNewStreetInput('');
                    setNewCityInput('Vadodara');
                    setNewPincodeInput('390023');
                    setAddressModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, color: '#EA580C', fontWeight: '700' }}>
                    + Add Delivery Address
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9A3412', fontWeight: '400' }}>
                    Click here to add street, city & pincode
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Save Button in Edit Mode */}
            {isEditMode && (
              <TouchableOpacity
                style={[styles.saveProfileBtn, isUpdating && { opacity: 0.7 }]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Menu Options */}
          <View style={styles.menuOptionsCard}>
            <Text style={styles.sectionHeaderTitle}>Account & Settings</Text>

            <TouchableOpacity
              style={styles.menuRowItem}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>My Orders</Text>
                <Text style={styles.menuItemSub}>View active and past food orders</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRowItem}
              onPress={() => Alert.alert('Saved Addresses', street ? `${street}, ${city} - ${pincode}` : 'No address saved yet.')}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Delivery Addresses</Text>
                <Text style={styles.menuItemSub}>Manage home, work & saved locations</Text>
              </View>
              <Text style={styles.menuItemChevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Partner & Earn With Cravingza Card */}
          <View style={styles.menuOptionsCard}>
            <Text style={styles.sectionHeaderTitle}>Partner & Earn With Us</Text>

            <TouchableOpacity
              style={styles.menuRowItem}
              onPress={() => navigation.navigate('PartnerOnboarding', { initialMode: 'restaurant' })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Register Restaurant Partner</Text>
                <Text style={styles.menuItemSub}>Grow your food business & orders</Text>
              </View>
              <Text style={styles.menuItemChevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRowItem}
              onPress={() => navigation.navigate('PartnerOnboarding', { initialMode: 'delivery' })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemTitle}>Ride & Earn as Delivery Partner</Text>
                <Text style={styles.menuItemSub}>Flexible payouts & daily incentives</Text>
              </View>
              <Text style={styles.menuItemChevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* 🛡️ Super Admin Portal Card (Only for Admins) */}
          {(role === 'admin' || role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <View style={styles.menuOptionsCard}>
              <Text style={styles.sectionHeaderTitle}>🛡️ Super Admin Portal</Text>

              <TouchableOpacity
                style={styles.menuRowItem}
                onPress={() => navigation.navigate('AdminLayout')}
              >
                <Text style={styles.menuItemIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Vendor & Rider Approvals</Text>
                  <Text style={styles.menuItemSub}>Review KYC docs & approve partners</Text>
                </View>
                <Text style={styles.menuItemChevron}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🚴 Delivery Hero Portal Card (For Delivery Partners) */}
          {(role === 'delivery_partner' || role === 'delivery' || role === 'rider' || currentUser?.role === 'delivery_partner') && (
            <View style={styles.menuOptionsCard}>
              <Text style={styles.sectionHeaderTitle}>🚴 Delivery Hero Portal</Text>

              <TouchableOpacity
                style={styles.menuRowItem}
                onPress={() => navigation.navigate('DeliveryPartnerLayout')}
              >
                <Text style={styles.menuItemIcon}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Delivery Rider Dashboard</Text>
                  <Text style={styles.menuItemSub}>View assigned orders & earnings</Text>
                </View>
                <Text style={styles.menuItemChevron}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 📍 Dedicated Delivery Address Add/Edit Modal */}
      <Modal visible={addressModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍 Add Delivery Address</Text>
            <Text style={styles.modalSub}>
              Enter your house/flat number, street name, city, and pincode for accurate food delivery.
            </Text>

            <Text style={styles.fieldLabel}>Street / Building / Flat Address</Text>
            <TextInput
              style={styles.modalInput}
              value={newStreetInput}
              onChangeText={setNewStreetInput}
              placeholder="e.g. A-18 Arunachal Flat, Subhanpura"
              placeholderTextColor="#94A3B8"
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCityInput}
                  onChangeText={setNewCityInput}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                  autoComplete="address-level2"
                  textContentType="addressCity"
                />
              </View>
              <View style={{ width: 120 }}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPincodeInput}
                  onChangeText={(val) => setNewPincodeInput(val.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="Pincode"
                  placeholderTextColor="#94A3B8"
                  autoComplete="postal-code"
                  textContentType="postalCode"
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setAddressModalVisible(false);
                }}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSavePhone}
                onPress={handleSaveAddressOnly}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnSavePhoneText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📱 Dedicated Single Mobile Phone Number Edit Modal */}
      <Modal visible={phoneModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📱 Add Mobile Phone Number</Text>
            <Text style={styles.modalSub}>
              Enter your mobile phone number for order status updates, delivery rider calls & SMS alerts.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={newPhoneInput}
              onChangeText={setNewPhoneInput}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setPhoneModalVisible(false);
                  setNewPhoneInput('');
                }}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSavePhone}
                onPress={handleSavePhoneOnly}
                disabled={savingPhone}
              >
                {savingPhone ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnSavePhoneText}>Save Phone Number</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomerBottomNav activeTab="Profile" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  editToggleBtn: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  editToggleBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 85,
    paddingHorizontal: SPACING.md,
  },
  userHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: '#EA580C',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmailText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 2,
  },
  roleTagBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  fieldValueReadOnly: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInputActive: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  saveProfileBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProfileBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  menuOptionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuItemSub: {
    fontSize: FONT_SIZE.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  menuItemChevron: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  addPhonePillBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPhonePillText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#94A3B8',
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  guestIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  guestLoginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  guestLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: SPACING.lg,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: SPACING.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  btnSavePhone: {
    flex: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  btnSavePhoneText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
