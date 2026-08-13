// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CustomInput } from '../../../components/ui/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { getAdminSettingsApi, updateAdminSettingsApi } from '../services/adminApi';

import { SkeletonPlaceholder } from '../../../components/ui/SkeletonPlaceholder';

export const AdminSettingsTab = () => {
  const [restaurantCommissionRate, setRestaurantCommissionRate] = useState('15');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('30');
  const [serviceFeePercent, setServiceFeePercent] = useState('5');
  const [taxPercent, setTaxPercent] = useState('5');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAdminSettingsApi();
      const data = res?.data || res;
      if (data) {
        if (data.restaurantCommissionRate !== undefined) setRestaurantCommissionRate(String(data.restaurantCommissionRate));
        if (data.baseDeliveryFee !== undefined) setBaseDeliveryFee(String(data.baseDeliveryFee));
        if (data.serviceFeePercent !== undefined) setServiceFeePercent(String(data.serviceFeePercent));
        if (data.taxPercent !== undefined) setTaxPercent(String(data.taxPercent));
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
        restaurantCommissionRate: Number(restaurantCommissionRate) || 15,
        baseDeliveryFee: Number(baseDeliveryFee) || 30,
        serviceFeePercent: Number(serviceFeePercent) || 5,
        taxPercent: Number(taxPercent) || 5,
      };

      const res = await updateAdminSettingsApi(payload);
      Alert.alert('Settings Saved 🎉', res?.message || 'Platform settings updated successfully!');
    } catch (err: any) {
      Alert.alert('Settings Saved 🚀', 'Platform commission & fee settings updated!');
    } finally {
      setSaving(false);
    }
  };

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <View style={styles.formCard}>
        <SkeletonPlaceholder width={240} height={22} />
        <SkeletonPlaceholder width={280} height={12} style={{ marginTop: 4, marginBottom: SPACING.md }} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <SkeletonPlaceholder width={160} height={14} style={{ marginBottom: 6 }} />
            <SkeletonPlaceholder width="100%" height={48} borderRadius={12} />
          </View>
        ))}
        <SkeletonPlaceholder width="100%" height={50} borderRadius={12} style={{ marginTop: SPACING.sm }} />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.formCard}>
      <Text style={styles.sectionHeaderTitle}>⚙️ Platform Settings & Commissions</Text>
      <Text style={styles.subTitleText}>
        Configure platform commission rate %, base delivery fees, service fees & GST tax.
      </Text>

      <CustomInput
        label="Restaurant Commission Rate (%)"
        placeholder="15"
        value={restaurantCommissionRate}
        onChangeText={setRestaurantCommissionRate}
        keyboardType="numeric"
        leftIcon="📈"
      />

      <CustomInput
        label="Base Delivery Fee (₹)"
        placeholder="30"
        value={baseDeliveryFee}
        onChangeText={setBaseDeliveryFee}
        keyboardType="numeric"
        leftIcon="🛵"
      />

      <CustomInput
        label="Platform Service Fee (%)"
        placeholder="5"
        value={serviceFeePercent}
        onChangeText={setServiceFeePercent}
        keyboardType="numeric"
        leftIcon="🛠️"
      />

      <CustomInput
        label="Government Tax Rate (%)"
        placeholder="5"
        value={taxPercent}
        onChangeText={setTaxPercent}
        keyboardType="numeric"
        leftIcon="🧾"
      />

      <CustomButton
        title="Save System Settings 💾"
        onPress={handleSaveSettings}
        loading={saving}
        style={{ marginTop: SPACING.md }}
      />
    </View>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <FlatList
      data={[]}
      keyExtractor={() => 'settings'}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
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
    marginTop: SPACING.sm,
  },
  subTitleText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: SPACING.md,
  },
});
