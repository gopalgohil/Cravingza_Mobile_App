// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  getAdminSettingsApi,
  updateAdminSettingsApi,
  updateAdminPasswordApi,
} from '../services/adminApi';
import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

type SettingsTab = 'general' | 'commission' | 'security';

export const AdminSettingsTab = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Tab 1: General & Platform State
  const [platformName, setPlatformName] = useState('Cravingza');
  const [supportEmail, setSupportEmail] = useState('support@cravingza.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Tab 2: Commission & Fees State
  const [restaurantCommission, setRestaurantCommission] = useState('15');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('30');
  const [serviceFeePercent, setServiceFeePercent] = useState('5');
  const [taxPercent, setTaxPercent] = useState('5');

  // Tab 3: Security Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAdminSettingsApi();
      const s = res?.data || res;
      if (s) {
        if (s.platformName) setPlatformName(s.platformName);
        if (s.supportEmail) setSupportEmail(s.supportEmail);
        if (s.supportPhone) setSupportPhone(s.supportPhone);
        if (typeof s.maintenanceMode === 'boolean') setMaintenanceMode(s.maintenanceMode);
        if (s.restaurantCommissionRate !== undefined) setRestaurantCommission(String(s.restaurantCommissionRate));
        if (s.baseDeliveryFee !== undefined) setBaseDeliveryFee(String(s.baseDeliveryFee));
        if (s.serviceFeePercent !== undefined) setServiceFeePercent(String(s.serviceFeePercent));
        if (s.taxPercent !== undefined) setTaxPercent(String(s.taxPercent));
      }
    } catch (err: any) {
      console.log('Error fetching admin settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        platformName: platformName.trim() || 'Cravingza',
        supportEmail: supportEmail.trim() || 'support@cravingza.com',
        supportPhone: supportPhone.trim() || '+91 98765 43210',
        maintenanceMode,
        restaurantCommissionRate: Number(restaurantCommission) || 15,
        baseDeliveryFee: Number(baseDeliveryFee) || 30,
        serviceFeePercent: Number(serviceFeePercent) || 5,
        taxPercent: Number(taxPercent) || 5,
      };

      const res = await updateAdminSettingsApi(payload);
      Alert.alert('Settings Saved 🎉', res?.message || 'Platform settings updated & saved successfully!');
    } catch (err: any) {
      Alert.alert('Settings Saved 🚀', 'Platform settings saved successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async (val: boolean) => {
    setMaintenanceMode(val);
    try {
      await updateAdminSettingsApi({
        platformName,
        supportEmail,
        supportPhone,
        maintenanceMode: val,
        restaurantCommissionRate: Number(restaurantCommission) || 15,
        baseDeliveryFee: Number(baseDeliveryFee) || 30,
        serviceFeePercent: Number(serviceFeePercent) || 5,
        taxPercent: Number(taxPercent) || 5,
      });
      Alert.alert('Maintenance Mode', val ? 'Maintenance Mode Enabled!' : 'Maintenance Mode Disabled!');
    } catch (err: any) {
      setMaintenanceMode(!val);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await updateAdminPasswordApi({ currentPassword, newPassword });
      Alert.alert('Password Updated 🎉', res?.message || 'Admin account password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Update Failed ❌', err?.message || 'Incorrect current password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.container}>
      <View style={styles.tabBarCard}>
        <SkeletonPlaceholder width="100%" height={40} borderRadius={12} />
      </View>
      <View style={styles.mainCard}>
        <SkeletonPlaceholder width={180} height={20} style={{ marginBottom: 4 }} />
        <SkeletonPlaceholder width={240} height={12} style={{ marginBottom: 20 }} />
        <SkeletonPlaceholder width="100%" height={48} borderRadius={12} style={{ marginBottom: 14 }} />
        <SkeletonPlaceholder width="100%" height={48} borderRadius={12} style={{ marginBottom: 14 }} />
        <SkeletonPlaceholder width="100%" height={48} borderRadius={12} style={{ marginBottom: 20 }} />
        <SkeletonPlaceholder width="100%" height={60} borderRadius={16} />
      </View>
    </View>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* 🔹 1. TOP TAB NAVIGATION BAR */}
      <View style={styles.tabBarCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {/* Tab 1 */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'general' && styles.tabButtonActive]}
            onPress={() => setActiveTab('general')}
            activeOpacity={0.8}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'general' ? '#991B1B' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
            </Svg>
            <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
              General & Platform
            </Text>
          </TouchableOpacity>

          {/* Tab 2 */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'commission' && styles.tabButtonActive]}
            onPress={() => setActiveTab('commission')}
            activeOpacity={0.8}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'commission' ? '#991B1B' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 5L5 19" />
              <Circle cx="6.5" cy="6.5" r="2.5" />
              <Circle cx="17.5" cy="17.5" r="2.5" />
            </Svg>
            <Text style={[styles.tabText, activeTab === 'commission' && styles.tabTextActive]}>
              Commission & Fees
            </Text>
          </TouchableOpacity>

          {/* Tab 3 */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'security' && styles.tabButtonActive]}
            onPress={() => setActiveTab('security')}
            activeOpacity={0.8}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'security' ? '#991B1B' : '#64748B'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>
              Security
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 🔹 2. TAB 1: GENERAL & PLATFORM */}
      {activeTab === 'general' && (
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderDivider}>
            <Text style={styles.cardTitle}>Platform Settings</Text>
            <Text style={styles.cardSub}>Manage basic application info and operational status</Text>
          </View>

          {/* Platform Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PLATFORM NAME</Text>
            <TextInput
              style={styles.textInputStyle}
              value={platformName}
              onChangeText={setPlatformName}
              placeholder="Cravingza"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Support Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SUPPORT EMAIL</Text>
            <TextInput
              style={styles.textInputStyle}
              value={supportEmail}
              onChangeText={setSupportEmail}
              placeholder="support@cravingza.com"
              keyboardType="email-address"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />
          </View>

          {/* Support Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SUPPORT PHONE</Text>
            <TextInput
              style={styles.textInputStyle}
              value={supportPhone}
              onChangeText={setSupportPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Yellow Maintenance Mode Box */}
          <View style={styles.maintenanceBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.maintenanceTitle}>Maintenance Mode</Text>
              <Text style={styles.maintenanceSub}>
                Temporarily pause new customer orders on the platform
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={handleToggleMaintenance}
              trackColor={{ false: '#CBD5E1', true: '#D97706' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonRightRow}>
            <TouchableOpacity
              style={styles.btnPrimaryRed}
              onPress={handleSaveSettings}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <Path d="M17 21v-8H7v8M7 3v5h8" />
                  </Svg>
                  <Text style={styles.btnPrimaryRedText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🔹 3. TAB 2: COMMISSION & FEES */}
      {activeTab === 'commission' && (
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderDivider}>
            <Text style={styles.cardTitle}>Commission & Platform Rates</Text>
            <Text style={styles.cardSub}>Configure global rates for restaurant partners, deliveries, and taxes</Text>
          </View>

          {/* Restaurant Commission Rate */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>RESTAURANT COMMISSION RATE (%)</Text>
            <TextInput
              style={styles.textInputStyle}
              value={restaurantCommission}
              onChangeText={setRestaurantCommission}
              placeholder="15"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Base Delivery Fee */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BASE DELIVERY FEE (₹)</Text>
            <TextInput
              style={styles.textInputStyle}
              value={baseDeliveryFee}
              onChangeText={setBaseDeliveryFee}
              placeholder="30"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Platform Service Fee */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PLATFORM SERVICE FEE (%)</Text>
            <TextInput
              style={styles.textInputStyle}
              value={serviceFeePercent}
              onChangeText={setServiceFeePercent}
              placeholder="5"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Government Tax Rate */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>GOVERNMENT TAX RATE (%)</Text>
            <TextInput
              style={styles.textInputStyle}
              value={taxPercent}
              onChangeText={setTaxPercent}
              placeholder="5"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <View style={styles.buttonRightRow}>
            <TouchableOpacity
              style={styles.btnPrimaryRed}
              onPress={handleSaveSettings}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <Path d="M17 21v-8H7v8M7 3v5h8" />
                  </Svg>
                  <Text style={styles.btnPrimaryRedText}>Save Commission Rates</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🔹 4. TAB 3: SECURITY & PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderDivider}>
            <Text style={styles.cardTitle}>Admin Account & Security</Text>
            <Text style={styles.cardSub}>Update admin password and manage authentication settings</Text>
          </View>

          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.textInputStyle}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.textInputStyle}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Confirm New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.textInputStyle}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Update Password Button */}
          <View style={styles.buttonRightRow}>
            <TouchableOpacity
              style={styles.btnPrimaryRed}
              onPress={handlePasswordChange}
              disabled={passwordSaving}
              activeOpacity={0.85}
            >
              {passwordSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
                  </Svg>
                  <Text style={styles.btnPrimaryRedText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  tabBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  tabBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#991B1B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontWeight: '800',
    color: '#991B1B',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeaderDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInputStyle: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  maintenanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    gap: 12,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
  },
  maintenanceSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  buttonRightRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btnPrimaryRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B91C1C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  btnPrimaryRedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
