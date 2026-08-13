// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

export const OwnerSettingsTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Punjabi Dhaba & Grill');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Shop 12, Main Market, Sector 62, Noida');
  const [openingTime, setOpeningTime] = useState('11:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');

  const handleSaveSettings = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Settings Saved 🎉', 'Your restaurant information has been updated successfully!');
    }, 600);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeaderTitle}>Store Profile Settings</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Restaurant Business Name</Text>
        <TextInput
          style={styles.input}
          value={restaurantName}
          onChangeText={setRestaurantName}
        />

        <Text style={styles.inputLabel}>Contact Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Full Restaurant Address</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Opening Time</Text>
            <TextInput
              style={styles.input}
              value={openingTime}
              onChangeText={setOpeningTime}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Closing Time</Text>
            <TextInput
              style={styles.input}
              value={closingTime}
              onChangeText={setClosingTime}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Store Details</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.xs + 1,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: COLORS.white,
  },
});
