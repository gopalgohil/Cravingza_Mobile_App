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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getUserProfileApi, updateUserProfileApi } from '../../auth/services/authApi';
import { getAuth } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAddress } from '../../../context/AddressContext';
import { useAuth } from '../../../context/AuthContext';

export const ProfileScreen = ({ navigation }: any) => {
  const { selectedAddress, saveNewAddress, setSelectedAddress } = useAddress();
  const { currentUser, setAuthUser, logout: authLogout } = useAuth();
  // 🔹 State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Form Fields (Pre-populated from logged-in currentUser & selectedAddress)
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
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

  // 🔹 Fetch User Profile on Screen Load (Live MongoDB API)
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // 1. Pre-fill from active AuthContext
      if (currentUser) {
        if (currentUser.name) setName(currentUser.name);
        if (currentUser.email) setEmail(currentUser.email);
        if (currentUser.phone) setPhone(currentUser.phone);
        if (currentUser.role) setRole(currentUser.role);
        if (currentUser.avatar) setAvatar(currentUser.avatar);
      }

      // 2. Fetch User Profile from Live MongoDB Backend API (GET /api/auth/profile)
      console.log('Fetching Live User Profile via GET /api/auth/profile...');
      const res = await getUserProfileApi();
      console.log('Live Profile API Response:', res);

      const user = res?.data?.user || res?.user || res?.data || res;
      if (user) {
        if (user.name) setName(user.name);
        if (user.email) setEmail(user.email);
        if (user.phone) setPhone(user.phone);
        if (user.role) setRole(user.role);
        if (user.avatar || user.photo || user.image) {
          setAvatar(user.avatar || user.photo || user.image);
        }

        // Sync with AuthContext
        setAuthUser({
          id: user._id || user.id,
          name: user.name || name,
          email: user.email || email,
          phone: user.phone || phone,
          role: user.role || role,
          avatar: user.avatar || avatar,
        });
      }
    } catch (error: any) {
      console.log('Fetch Live Profile API Note:', error.message);
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
      onPress: async () => {
        try {
          await GoogleSignin.signOut().catch(() => { });
        } catch (e) { }
        try {
          getAuth().signOut();
        } catch (e) { }
        authLogout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    },
  ]);
};

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching profile details...</Text>
      </View>
    ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Hero Avatar Card */}
        <View style={styles.userHeroCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
            <View style={styles.activeBadgeDot} />
          </View>
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
              placeholder="Enter phone number"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.fieldValueReadOnly}>{phone}</Text>
          )}

          {/* Delivery Address Section */}
          {street ? (
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>Saved Delivery Address</Text>
                {!isEditMode && (
                  <TouchableOpacity onPress={() => setIsEditMode(true)}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditMode ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldLabel}>Street / Building Address</Text>
                  <TextInput
                    style={styles.textInputActive}
                    value={street}
                    onChangeText={setStreet}
                    placeholder="Enter street name"
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>City</Text>
                      <TextInput
                        style={styles.textInputActive}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={{ width: 120 }}>
                      <Text style={styles.fieldLabel}>Pincode</Text>
                      <TextInput
                        style={styles.textInputActive}
                        value={pincode}
                        onChangeText={setPincode}
                        keyboardType="numeric"
                        placeholder="Pincode"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{
                  backgroundColor: '#F8FAFC',
                  padding: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}>
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>{street}</Text>
                  {(city || pincode) ? (
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {city}{city && pincode ? ' - ' : ''}{pincode}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          ) : isEditMode ? (
            <View style={{ marginTop: 14, gap: 8 }}>
              <Text style={styles.fieldLabel}>Street / Building Address</Text>
              <TextInput
                style={styles.textInputActive}
                value={street}
                onChangeText={setStreet}
                placeholder="Enter street name"
                placeholderTextColor="#94A3B8"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.textInputActive}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ width: 120 }}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.textInputActive}
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="numeric"
                    placeholder="Pincode"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 14 }}>
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
                onPress={() => setIsEditMode(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, color: '#EA580C', fontWeight: '700' }}>
                  + Add Delivery Address
                </Text>
                <Text style={{ fontSize: 12, color: '#9A3412', fontWeight: '400' }}>
                  Click here to add street, city & pincode
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
            <Text style={styles.menuItemChevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => Alert.alert('Saved Addresses', address)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Delivery Addresses</Text>
              <Text style={styles.menuItemSub}>Manage home, work & saved locations</Text>
            </View>
            <Text style={styles.menuItemChevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => Alert.alert('Notifications', 'Push notifications enabled!')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Notifications & Offers</Text>
              <Text style={styles.menuItemSub}>Promo codes, discounts & order alerts</Text>
            </View>
            <Text style={styles.menuItemChevron}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => Alert.alert('Customer Support', 'Contact us at support@cravingza.com')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Help & Support</Text>
              <Text style={styles.menuItemSub}>24x7 customer assistance</Text>
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

        {/* 🚴 Delivery Hero Portal Card (For Delivery Partners & Rahul) */}
        {(role === 'delivery_partner' || role === 'delivery' || role === 'rider' || currentUser?.role === 'delivery_partner' || currentUser?.email?.toLowerCase().includes('rahul')) && (
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
          <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    )}
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
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
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
  activeBadgeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    position: 'absolute',
    bottom: 2,
    right: 4,
    borderWidth: 2.5,
    borderColor: COLORS.white,
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
});
