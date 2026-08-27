// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import {
  getOwnerStoreDetailsApi,
  updateOwnerStoreDetailsApi,
  toggleRestaurantStatusApi,
} from '../services/restaurantOwnerApi';
import { OwnerSettingsSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import { useAuth } from '../../../context/AuthContext';

export const OwnerSettingsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Store Profile States
  const [restaurantName, setRestaurantName] = useState('Burger Boss');
  const [cuisine, setCuisine] = useState('Gourmet Smash Burgers & Sides');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState('101 Burger Boulevard, Sector 18');
  const [city, setCity] = useState('Vadodara');
  const [pincode, setPincode] = useState('390023');
  const [openingTime, setOpeningTime] = useState('10:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');
  const [minOrder, setMinOrder] = useState('150');
  const [prepTime, setPrepTime] = useState('20-25 mins');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Address Modal States
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [newStreetInput, setNewStreetInput] = useState('');
  const [newCityInput, setNewCityInput] = useState('');
  const [newPincodeInput, setNewPincodeInput] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const res = await getOwnerStoreDetailsApi();
      const rest = res?.data?.restaurant || res?.data || res?.restaurant || res;

      if (rest) {
        if (rest.name || rest.restaurantName) setRestaurantName(rest.name || rest.restaurantName);
        if (rest.cuisine) setCuisine(rest.cuisine);
        if (rest.phone || rest.contactPhone) setPhone(rest.phone || rest.contactPhone);
        if (rest.email || rest.ownerEmail) setEmail(rest.email || rest.ownerEmail);
        if (rest.location?.address || rest.address) setAddress(rest.location?.address || rest.address);
        if (rest.location?.city || rest.city) setCity(rest.location?.city || rest.city);
        if (rest.location?.zipCode || rest.location?.pincode || rest.pincode || rest.zipCode) {
          setPincode(rest.location?.zipCode || rest.location?.pincode || rest.pincode || rest.zipCode);
        }
        if (rest.openingTime) setOpeningTime(rest.openingTime);
        if (rest.closingTime) setClosingTime(rest.closingTime);
        if (rest.minOrder) setMinOrder(String(rest.minOrder));
        if (rest.prepTime) setPrepTime(String(rest.prepTime));
        if (typeof rest.isOpen === 'boolean') setIsStoreOpen(rest.isOpen);
      }
    } catch (err: any) {
      console.log('Fetch Store Details Note:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStoreDetails();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStoreDetails();
  };

  const handleToggleStoreStatus = async (val: boolean) => {
    setIsStoreOpen(val);
    try {
      await toggleRestaurantStatusApi(val).catch(() => {});
      Alert.alert(
        val ? 'Store Opened! 🟢' : 'Store Closed 🔴',
        val
          ? 'Burger Boss is now OPEN and accepting online customer orders.'
          : 'Burger Boss is now CLOSED for new incoming orders.'
      );
    } catch (e) {}
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
      const payload = {
        address: newStreetInput.trim(),
        city: newCityInput.trim() || 'Vadodara',
        pincode: cleanPin,
        zipCode: cleanPin,
      };
      await updateOwnerStoreDetailsApi(payload);
      setAddress(payload.address);
      setCity(payload.city);
      setPincode(cleanPin);
      setAddressModalVisible(false);
      Alert.alert('Location Updated 🎉', 'Restaurant address and pincode have been updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to save restaurant address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Validation Error', 'Restaurant name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: restaurantName.trim(),
        cuisine: cuisine.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        zipCode: pincode.trim(),
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        minOrder: minOrder.trim(),
        prepTime: prepTime.trim(),
        isOpen: isStoreOpen,
      };

      await updateOwnerStoreDetailsApi(payload);

      Alert.alert(
        'Store Profile Saved! 🎉',
        `Live details for ${restaurantName.trim()} have been updated successfully!`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return <OwnerSettingsSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EA580C" />}
    >
      <Text style={styles.sectionHeaderTitle}>Store Profile & Business Settings</Text>

      {/* Header Profile Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarBox}>
          <Text style={{ fontSize: 28 }}>🍔</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.storeTitleText}>{restaurantName}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>VERIFIED ✔️</Text>
            </View>
          </View>
          <Text style={styles.storeEmailText}>{email}</Text>
          <Text style={styles.storePhoneText}>📞 {phone}</Text>
        </View>
      </View>

      {/* Quick Store Operations Toggle Card */}
      <View style={styles.card}>
        <View style={styles.statusToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSectionTitle}>Accepting Online Orders</Text>
            <Text style={styles.statusSubtext}>
              {isStoreOpen ? '🟢 Online & accepting live customer orders' : '🔴 Offline • Store closed for orders'}
            </Text>
          </View>
          <Switch
            value={isStoreOpen}
            onValueChange={handleToggleStoreStatus}
            trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
            thumbColor={isStoreOpen ? '#EA580C' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Form Card 1: Basic Information */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>General Business Details</Text>

        <Text style={styles.inputLabel}>Restaurant Business Name</Text>
        <TextInput style={styles.input} value={restaurantName} onChangeText={setRestaurantName} placeholder="e.g. Burger Boss" />

        <Text style={styles.inputLabel}>Primary Cuisine / Specialties</Text>
        <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} placeholder="e.g. Gourmet Smash Burgers & Sides" />

        <Text style={styles.inputLabel}>Contact Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.inputLabel}>Admin Owner Email Address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      {/* Form Card 2: Address & Location Card with Dedicated Popup Modal */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifySpace: 'between', justifyContent: 'space-between' }}>
          <Text style={styles.cardSectionTitle}>📍 Location & Address</Text>
          <TouchableOpacity
            style={styles.editAddrBtn}
            onPress={() => {
              setNewStreetInput(address);
              setNewCityInput(city);
              setNewPincodeInput(pincode);
              setAddressModalVisible(true);
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </Svg>
            <Text style={styles.editAddrBtnText}>Edit Address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savedAddressDisplayBox}>
          <Text style={styles.savedAddrStreet}>{address}</Text>
          <Text style={styles.savedAddrCityPin}>
            {city} {city && pincode ? ' • ' : ''}Pincode: <Text style={{ fontWeight: '800', color: '#EA580C' }}>{pincode}</Text>
          </Text>
        </View>
      </View>

      {/* Form Card 3: Operating Hours & Logistics */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Operating Hours & Operations</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Opening Time</Text>
            <TextInput style={styles.input} value={openingTime} onChangeText={setOpeningTime} placeholder="10:00 AM" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Closing Time</Text>
            <TextInput style={styles.input} value={closingTime} onChangeText={setClosingTime} placeholder="11:00 PM" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Min Order (₹)</Text>
            <TextInput style={styles.input} value={minOrder} onChangeText={setMinOrder} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Avg Prep Time</Text>
            <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.saveBtnText}>💾 Save Live Store Settings</Text>
        )}
      </TouchableOpacity>

      {/* 📍 Dedicated Restaurant Address Edit Modal Popup */}
      <Modal visible={addressModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📍 Edit Restaurant Address</Text>
            <Text style={styles.modalSub}>
              Enter street address, city, and 6-digit pincode for customer orders & rider pickup.
            </Text>

            <Text style={styles.modalInputLabel}>Street / Building / Area Address</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              value={newStreetInput}
              onChangeText={setNewStreetInput}
              placeholder="e.g. 101 Burger Boulevard, Sector 18"
              placeholderTextColor="#94A3B8"
              multiline
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalInputLabel}>City / Region</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCityInput}
                  onChangeText={setNewCityInput}
                  placeholder="e.g. Vadodara"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ width: 120 }}>
                <Text style={styles.modalInputLabel}>Pincode</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPincodeInput}
                  onChangeText={(val) => setNewPincodeInput(val.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="390023"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSaveAddress}
                onPress={handleSaveAddressOnly}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnSaveAddressText}>Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.md || 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs + 2,
    marginLeft: 4,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  storeEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  storePhoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: FONT_SIZE.xs + 1,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 40,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.xs + 2,
    fontWeight: '900',
    color: COLORS.white,
  },
  editAddrBtn: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editAddrBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  savedAddressDisplayBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  savedAddrStreet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  savedAddrCityPin: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  btnSaveAddress: {
    flex: 2,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSaveAddressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
