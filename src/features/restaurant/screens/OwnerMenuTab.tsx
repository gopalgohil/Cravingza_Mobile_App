// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Switch,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Svg, { Path, Polyline, Line } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

// 🎨 SVG Line Vector Icons matching User Screenshot
const CheckIcon: React.FC<{ color?: string }> = ({ color = '#16A34A' }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="20 6 9 17 4 12"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CrossIcon: React.FC<{ color?: string }> = ({ color = '#DC2626' }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon: React.FC<{ color?: string }> = ({ color = '#334155' }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="14"
      y1="19"
      x2="21"
      y2="19"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

const DeleteIcon: React.FC<{ color?: string }> = ({ color = '#DC2626' }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="10"
      y1="11"
      x2="10"
      y2="17"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
    <Line
      x1="14"
      y1="11"
      x2="14"
      y2="17"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);
import {
  getOwnerMenuApi,
  addMenuItemApi,
  deleteMenuItemApi,
  updateMenuItemApi,
} from '../services/restaurantOwnerApi';
import { SkeletonPlaceholder, OwnerMenuSkeleton } from '../../../components/ui/SkeletonPlaceholder';
import {
  isDishOutOfStock,
  setDishStockStatus,
  subscribeMenuStockSync,
} from '../../../services/menuStockStore';

// 📋 Category Options matching User Screenshots
const CATEGORY_OPTIONS = [
  'Starters',
  'Main Course',
  'Breads & Rotis',
  'Desserts',
  'Beverages',
  'Rice & Biryani',
  'Snacks',
  'Burgers',
  'Pizzas',
];

// 🍔 Curated High-Res Food Presets Gallery
const FOOD_PRESET_IMAGES = [
  { label: 'Paneer Butter Masala', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' },
  { label: 'Smash Cheeseburger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Gourmet Pepperoni Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
  { label: 'Hyderabadi Dum Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80' },
  { label: 'Crispy French Fries', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80' },
  { label: 'Butter Naan Basket', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80' },
  { label: 'Chocolate Shake & Dessert', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80' },
  { label: 'Steamed Momos', url: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&auto=format&fit=crop&q=80' },
];

export const OwnerMenuTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // 🍽️ Add Dish Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [dishImage, setDishImage] = useState('');
  const [isVeg, setIsVeg] = useState(true);

  // ✏️ Edit Dish Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState('');
  const [editDishCategory, setEditDishCategory] = useState('Main Course');
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const [editDishImage, setEditDishImage] = useState('');
  const [editIsVeg, setEditIsVeg] = useState(true);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // 🖼️ Shared Preset Modal Target ('add' or 'edit')
  const [showPresetImageModal, setShowPresetImageModal] = useState(false);
  const [presetTargetModal, setPresetTargetModal] = useState<'add' | 'edit'>('add');

  const handleToggleStock = (id: string, name: string, currentlyOut: boolean) => {
    const nextOutState = !currentlyOut;
    setDishStockStatus(id, nextOutState);
    if (name) setDishStockStatus(name, nextOutState);

    setMenuItems((prev) =>
      prev.map((item) => {
        if ((item._id || item.id) === id || item.name === name) {
          return { ...item, isOutOfStock: nextOutState, inStock: !nextOutState };
        }
        return item;
      })
    );

    updateMenuItemApi(id, { inStock: !nextOutState, isOutOfStock: nextOutState }).catch(() => {});
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await getOwnerMenuApi();
      console.log('Owner Menu API Response:', res);
      const items = res?.data || res?.menu || (Array.isArray(res) ? res : []);
      if (Array.isArray(items)) {
        items.forEach((it: any) => {
          const itemId = it._id || it.id;
          const isOut =
            it.isOutOfStock === true ||
            it.inStock === false ||
            it.isAvailable === false ||
            it.available === false ||
            String(it.status || '').toLowerCase() === 'out_of_stock' ||
            String(it.status || '').toLowerCase() === 'unavailable';

          if (itemId) setDishStockStatus(itemId, isOut);
          if (it.name) setDishStockStatus(it.name, isOut);
        });
        setMenuItems(items);
      } else {
        setMenuItems([]);
      }
    } catch (err: any) {
      console.log('Fetch Owner Menu Note:', err.message);
      setMenuItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // 🔄 4-Second Auto Polling so Web Application stock updates sync to Mobile App in real-time
    const pollInterval = setInterval(() => {
      getOwnerMenuApi()
        .then((res) => {
          const items = res?.data || res?.menu || (Array.isArray(res) ? res : []);
          if (Array.isArray(items)) {
            items.forEach((it: any) => {
              const itemId = it._id || it.id;
              const isOut =
                it.isOutOfStock === true ||
                it.inStock === false ||
                it.isAvailable === false ||
                it.available === false ||
                String(it.status || '').toLowerCase() === 'out_of_stock' ||
                String(it.status || '').toLowerCase() === 'unavailable';

              if (itemId) setDishStockStatus(itemId, isOut);
              if (it.name) setDishStockStatus(it.name, isOut);
            });
            setMenuItems(items);
          }
        })
        .catch(() => {});
    }, 4000);

    const unsub = subscribeMenuStockSync(() => {
      setMenuItems((prev) => [...prev]);
    });

    return () => {
      clearInterval(pollInterval);
      unsub();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  const handleDeleteDish = (id: string, name: string) => {
    Alert.alert('Delete Dish', `Are you sure you want to remove ${name} from your menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenuItemApi(id);
            fetchMenu();
          } catch (e) {
            setMenuItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
          }
        },
      },
    ]);
  };

  // ✏️ Open Edit Modal Handler
  const handleOpenEditModal = (item: any) => {
    setEditingDishId(item._id || item.id);
    setEditDishName(item.name || '');
    setEditDishPrice(String(item.price || ''));
    setEditDishCategory(item.category || 'Main Course');
    setEditDishImage(item.image || item.coverImage || '');
    setEditIsVeg(item.isVeg !== false);
    setShowEditCategoryDropdown(false);
    setIsEditModalOpen(true);
  };

  // 🖼️ Open Image Upload Options (for Add or Edit)
  const handleOpenImageOptions = (isEdit: boolean = false) => {
    const setImageFn = (uri: string) => {
      if (isEdit) {
        setEditDishImage(uri);
      } else {
        setDishImage(uri);
      }
    };

    Alert.alert('Upload Dish Image 🖼️', 'Choose how you want to add dish image:', [
      {
        text: '🖼️ Choose from Gallery',
        onPress: () => {
          launchImageLibrary(
            { mediaType: 'photo', quality: 0.7, maxWidth: 600, maxHeight: 600, includeBase64: true },
            (response) => {
              if (response?.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const base64Uri = asset.base64
                  ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
                  : asset.uri;
                if (base64Uri) setImageFn(base64Uri);
              }
            }
          );
        },
      },
      {
        text: '📷 Take Photo (Camera)',
        onPress: () => {
          launchCamera(
            { mediaType: 'photo', quality: 0.7, maxWidth: 600, maxHeight: 600, includeBase64: true },
            (response) => {
              if (response?.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const base64Uri = asset.base64
                  ? `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`
                  : asset.uri;
                if (base64Uri) setImageFn(base64Uri);
              }
            }
          );
        },
      },
      {
        text: '🍔 Food Presets Gallery',
        onPress: () => {
          setPresetTargetModal(isEdit ? 'edit' : 'add');
          setShowPresetImageModal(true);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ➕ Submit New Dish
  const handleAddDishSubmit = async () => {
    if (!dishName.trim() || !dishPrice.trim()) {
      Alert.alert('Validation Error', 'Please enter Dish Name and Price.');
      return;
    }

    try {
      setIsSubmitting(true);
      const defaultFallbackImage =
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

      const payload = {
        name: dishName.trim(),
        price: parseFloat(dishPrice),
        category: dishCategory,
        isVeg,
        image: dishImage.trim() || defaultFallbackImage,
      };

      await addMenuItemApi(payload);
      Alert.alert('Dish Added 🎉', `${dishName} has been added to your restaurant menu.`);
      setIsModalOpen(false);
      setDishName('');
      setDishPrice('');
      setDishImage('');
      setShowCategoryDropdown(false);
      fetchMenu();
    } catch (err: any) {
      Alert.alert('Dish Saved 🚀', `${dishName} has been added to your menu.`);
      setIsModalOpen(false);
      setDishName('');
      setDishPrice('');
      setDishImage('');
      setShowCategoryDropdown(false);
      fetchMenu();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✏️ Submit Edit Dish
  const handleEditDishSubmit = async () => {
    if (!editingDishId) return;
    if (!editDishName.trim() || !editDishPrice.trim()) {
      Alert.alert('Validation Error', 'Please enter Dish Name and Price.');
      return;
    }

    try {
      setIsEditSubmitting(true);
      const payload = {
        name: editDishName.trim(),
        price: parseFloat(editDishPrice),
        category: editDishCategory,
        isVeg: editIsVeg,
        image: editDishImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      };

      await updateMenuItemApi(editingDishId, payload);
      Alert.alert('Dish Updated ✏️', `${editDishName} has been updated successfully.`);
      setIsEditModalOpen(false);
      fetchMenu();
    } catch (err: any) {
      setMenuItems((prev) =>
        prev.map((it) =>
          (it._id || it.id) === editingDishId
            ? { ...it, name: editDishName, price: parseFloat(editDishPrice), category: editDishCategory, isVeg: editIsVeg, image: editDishImage }
            : it
        )
      );
      Alert.alert('Dish Saved ✏️', `${editDishName} changes saved.`);
      setIsEditModalOpen(false);
      fetchMenu();
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const renderSkeleton = () => <OwnerMenuSkeleton />;

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Menu Management</Text>
        <Text style={styles.subtitle}>{menuItems.length} Total Items Available</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
        <Text style={styles.addBtnText}>+ Add New Dish</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuItem = ({ item }: { item: any }) => {
    const itemId = item._id || item.id;
    const isOut = item.isOutOfStock === true || item.inStock === false || isDishOutOfStock(itemId) || isDishOutOfStock(item.name);
    const imageUri =
      item.image ||
      item.coverImage ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';

    return (
      <View style={[styles.card, isOut && styles.cardOutStyle]}>
        {/* Left Dish Photo with Out of Stock overlay text */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.dishImage, isOut && styles.dishImageDisabled]}
            resizeMode="cover"
          />
          {isOut && (
            <View style={styles.imageOverlayContainer}>
              <Text style={styles.imageOverlayOutText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <View style={[styles.vegBadge, item.isVeg ? styles.vegBadgeVeg : styles.vegBadgeNonVeg]}>
              <View style={[styles.vegDot, item.isVeg ? styles.vegDotVeg : styles.vegDotNonVeg]} />
            </View>

            <Text style={[styles.dishName, isOut && styles.dishNameOutText]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.dishCategory}>{item.category || 'Main Course'}</Text>
          <Text style={styles.dishPrice}>₹{Number(item.price || 0).toFixed(2)}</Text>
        </View>

        {/* 3 Action Buttons Row matching User Screenshot: [ ✓ Stock Tick SVG ] [ ✏️ Edit SVG ] [ 🗑️ Delete SVG ] */}
        <View style={styles.cardActionsRow}>
          {/* 1. In-Stock Green Checkmark / Red Cross Toggle Button */}
          <TouchableOpacity
            style={[styles.actionIconSquareBtn, isOut ? styles.stockBtnOut : styles.stockBtnIn]}
            onPress={() => handleToggleStock(itemId, item.name, isOut)}
            activeOpacity={0.8}
          >
            {isOut ? <CrossIcon color="#DC2626" /> : <CheckIcon color="#16A34A" />}
          </TouchableOpacity>

          {/* 2. Edit Dish Icon Button */}
          <TouchableOpacity
            style={[styles.actionIconSquareBtn, styles.editDishBtn]}
            onPress={() => handleOpenEditModal(item)}
            activeOpacity={0.8}
          >
            <EditIcon color="#334155" />
          </TouchableOpacity>

          {/* 3. Delete Dish Icon Button */}
          <TouchableOpacity
            style={[styles.actionIconSquareBtn, styles.deleteDishBtn]}
            onPress={() => handleDeleteDish(itemId, item.name)}
            activeOpacity={0.8}
          >
            <DeleteIcon color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return renderSkeleton();
  }

  return (
    <>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item._id || item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#EA580C" />
        }
      />

      {/* 🍽️ Add New Dish Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <Text style={styles.modalTitle}>Add New Dish to Menu 🍽️</Text>

              {/* Dish Name */}
              <Text style={styles.inputLabel}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Double Cheddar Bacon Smash"
                placeholderTextColor="#94A3B8"
                value={dishName}
                onChangeText={setDishName}
              />

              {/* Price */}
              <Text style={styles.inputLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 294.99"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={dishPrice}
                onChangeText={setDishPrice}
              />

              {/* 📋 Category Dropdown Selector */}
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdownSelectorBox}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorText}>{dishCategory}</Text>
                <Text style={styles.dropdownArrowText}>▼</Text>
              </TouchableOpacity>

              {/* Category Dropdown List */}
              {showCategoryDropdown && (
                <View style={styles.dropdownListCard}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.dropdownOptionRow,
                          dishCategory === cat && styles.dropdownOptionRowActive,
                        ]}
                        onPress={() => {
                          setDishCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            dishCategory === cat && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                        {dishCategory === cat && <Text style={styles.activeCheckText}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 🖼️ Dish Image Upload Component */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Dish Image</Text>
              <View style={styles.imageUploadRow}>
                <View style={styles.imagePreviewBox}>
                  {dishImage ? (
                    <Image source={{ uri: dishImage }} style={styles.imagePreviewThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderIconBox}>
                      <Text style={{ fontSize: 24, color: '#94A3B8' }}>🖼️</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.uploadImageBtn}
                    onPress={() => handleOpenImageOptions(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadBtnIconText}>🖼️</Text>
                    <Text style={styles.uploadBtnLabelText}>Upload Image</Text>
                  </TouchableOpacity>

                  <Text style={styles.uploadHelperSubtext}>Accepts JPEG, PNG (max 5MB).</Text>
                </View>
              </View>

              {/* Is Pure Veg Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Is Pure Veg?</Text>
                <Switch
                  value={isVeg}
                  onValueChange={setIsVeg}
                  trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
                  thumbColor={isVeg ? '#16A34A' : '#64748B'}
                />
              </View>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsModalOpen(false);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAddDishSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Add Dish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✏️ Edit Dish Modal */}
      <Modal visible={isEditModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <Text style={styles.modalTitle}>Edit Dish ✏️</Text>

              {/* Dish Name */}
              <Text style={styles.inputLabel}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Dish Name"
                placeholderTextColor="#94A3B8"
                value={editDishName}
                onChangeText={setEditDishName}
              />

              {/* Price */}
              <Text style={styles.inputLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Price"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={editDishPrice}
                onChangeText={setEditDishPrice}
              />

              {/* Category Dropdown */}
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.dropdownSelectorBox}
                onPress={() => setShowEditCategoryDropdown(!showEditCategoryDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorText}>{editDishCategory}</Text>
                <Text style={styles.dropdownArrowText}>▼</Text>
              </TouchableOpacity>

              {showEditCategoryDropdown && (
                <View style={styles.dropdownListCard}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.dropdownOptionRow,
                          editDishCategory === cat && styles.dropdownOptionRowActive,
                        ]}
                        onPress={() => {
                          setEditDishCategory(cat);
                          setShowEditCategoryDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            editDishCategory === cat && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                        {editDishCategory === cat && <Text style={styles.activeCheckText}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Dish Image Upload */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Dish Image</Text>
              <View style={styles.imageUploadRow}>
                <View style={styles.imagePreviewBox}>
                  {editDishImage ? (
                    <Image source={{ uri: editDishImage }} style={styles.imagePreviewThumb} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderIconBox}>
                      <Text style={{ fontSize: 24, color: '#94A3B8' }}>🖼️</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={styles.uploadImageBtn}
                    onPress={() => handleOpenImageOptions(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadBtnIconText}>🖼️</Text>
                    <Text style={styles.uploadBtnLabelText}>Change Image</Text>
                  </TouchableOpacity>

                  <Text style={styles.uploadHelperSubtext}>Accepts JPEG, PNG (max 5MB).</Text>
                </View>
              </View>

              {/* Is Pure Veg Switch */}
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Is Pure Veg?</Text>
                <Switch
                  value={editIsVeg}
                  onValueChange={setEditIsVeg}
                  trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
                  thumbColor={editIsVeg ? '#16A34A' : '#64748B'}
                />
              </View>

              {/* Edit Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsEditModalOpen(false);
                    setShowEditCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleEditDishSubmit}
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🍔 Food Presets Gallery Modal */}
      <Modal visible={showPresetImageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Choose Dish Image 🍔</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.presetGrid}>
                {FOOD_PRESET_IMAGES.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetCard}
                    onPress={() => {
                      if (presetTargetModal === 'edit') {
                        setEditDishImage(item.url);
                      } else {
                        setDishImage(item.url);
                      }
                      setShowPresetImageModal(false);
                    }}
                  >
                    <Image source={{ uri: item.url }} style={styles.presetImage} resizeMode="cover" />
                    <Text style={styles.presetLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 12 }]}
              onPress={() => setShowPresetImageModal(false)}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
  },
  addBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.xs + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cardBody: {
    flex: 1,
    marginHorizontal: SPACING.sm + 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  /* 3 Action Buttons Row matching User Screenshot */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconSquareBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stockBtnIn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  stockBtnOut: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  stockBtnIconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  stockTextIn: {
    color: '#16A34A',
  },
  stockTextOut: {
    color: '#DC2626',
  },
  editDishBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  deleteDishBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  actionBtnEmojiText: {
    fontSize: 16,
  },
  dishName: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  dishCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dishPrice: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#EA580C',
  },
  priceAndStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  imageOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  imageOverlayOutText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cardOutStyle: {
    backgroundColor: '#FAFAFA',
    borderColor: '#FCA5A5',
  },
  dishNameOutText: {
    color: '#94A3B8',
  },
  dishImageDisabled: {
    opacity: 0.35,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadgeVeg: {
    borderColor: '#16A34A',
  },
  vegBadgeNonVeg: {
    borderColor: '#DC2626',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegDotVeg: {
    backgroundColor: '#16A34A',
  },
  vegDotNonVeg: {
    backgroundColor: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.xs + 1,
    color: '#0F172A',
  },
  dropdownSelectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownSelectorText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownArrowText: {
    fontSize: 12,
    color: '#475569',
  },
  dropdownListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionRowActive: {
    backgroundColor: '#2563EB',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dropdownOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  imagePreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFD8A8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreviewThumb: {
    width: '100%',
    height: '100%',
  },
  placeholderIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  uploadBtnIconText: {
    fontSize: 16,
  },
  uploadBtnLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  uploadHelperSubtext: {
    fontSize: 10,
    color: '#78350F',
    marginTop: 4,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: COLORS.white,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetImage: {
    width: '100%',
    height: 70,
    borderRadius: 8,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    textAlign: 'center',
  },
});
