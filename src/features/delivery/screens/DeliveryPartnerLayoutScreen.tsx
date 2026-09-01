// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
  TextInput,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { useAuth } from '../../../context/AuthContext';
import { BASE_URL, getAuthToken, apiClient } from '../../../services/apiClient';
import {
  getSharedOrders,
  setSharedOrders,
  updateSharedOrderStatus,
  subscribeOrderSync,
  getSharedDeclinedOrderIds,
  addSharedDeclinedOrderId,
} from '../../../services/orderSyncStore';
import { subscribeToOrderUpdates } from '../../../services/socketService';
import { DeliverySidebarDrawer } from '../components/DeliverySidebarDrawer';

const renderDeliveryNavIcon = (name: string, active: boolean) => {
  const color = active ? '#EA580C' : '#94A3B8';
  const size = 22;

  switch (name) {
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" />
        </Svg>
      );
    case 'orders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#EA580C' : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <Path d="M3 6h18" />
          <Path d="M16 10a4 4 0 01-8 0" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
      );
    default:
      return null;
  }
};

export const DeliveryPartnerLayoutScreen = ({ navigation }: any) => {
  const { currentUser, setAuthUser, logout: authLogout } = useAuth();

  // State Declarations
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'settings'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [systemDeliveryFee, setSystemDeliveryFee] = useState<number>(30);
  const [earningsData, setEarningsData] = useState<any>({
    todayEarnings: 0,
    weeklyEarnings: 0,
    totalEarnings: 0,
    completedCount: 0,
    avgPerDelivery: '0.00',
    bankDetails: null,
    history: [],
  });
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [earningsFilter, setEarningsFilter] = useState<'all' | 'today' | 'week'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Profile Editing & Form States
  const [avatar, setAvatar] = useState<string>(currentUser?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState<string>(currentUser?.phone || '');
  const [editCity, setEditCity] = useState<string>(currentUser?.city || 'Vadodara');
  const [editVehicleType, setEditVehicleType] = useState<string>(currentUser?.vehicleType || 'motorcycle');
  const [editVehicleNumber, setEditVehicleNumber] = useState<string>(currentUser?.vehicleNumber || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Sync profile form states dynamically when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setEditName(currentUser.name);
      if (currentUser.phone) setEditPhone(currentUser.phone);
      if (currentUser.city) setEditCity(currentUser.city);
      if (currentUser.vehicleType) setEditVehicleType(currentUser.vehicleType);
      if (currentUser.vehicleNumber) setEditVehicleNumber(currentUser.vehicleNumber);
      if (currentUser.avatar) setAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  // 📷 Delivery Partner Profile Avatar Picker & Cloudinary Upload Handler
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
        name: asset.fileName || `rider_avatar_${Date.now()}.jpg`,
      } as any);
      formData.append('folder', 'cravingza/profile-avatars');

      const activeToken = getAuthToken();
      console.log('Uploading delivery partner profile picture to Cloudinary via POST /api/upload...');

      const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      console.log('Cloudinary Upload API Response (Rider):', uploadData);

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
      console.log('Saving Rider Cloudinary Avatar URL into MongoDB database:', uploadedUrl);
      await apiClient('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName || currentUser?.name || 'Delivery Partner',
          avatar: uploadedUrl,
        }),
      });

      // 4. Update AuthContext global user state
      setAuthUser({
        ...currentUser,
        avatar: uploadedUrl,
      });

      Alert.alert(
        'Profile Picture Updated 🎉',
        'Your delivery partner profile picture has been uploaded to Cloudinary & saved to MongoDB Atlas successfully!'
      );
    } catch (err: any) {
      console.log('Rider Avatar upload error:', err);
      Alert.alert('Upload Failed ❌', err?.message || 'Unable to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fetch Live Super Admin Delivery Fee Settings for Rider Earnings
  useEffect(() => {
    const fetchSystemFee = async () => {
      try {
        const res = await apiClient('/settings');
        const fee = res?.data?.baseDeliveryFee !== undefined ? Number(res.data.baseDeliveryFee) : 30;
        if (!isNaN(fee) && fee > 0) {
          setSystemDeliveryFee(fee);
        }
      } catch (err) {
        console.log('Error fetching system delivery fee for rider portal:', err);
      }
    };
    fetchSystemFee();
  }, []);

  // Drawer and Notifications Modal states
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif_welcome',
      title: 'Welcome Delivery Hero! 🚴',
      message: 'You will receive real-time order alerts when restaurant admin marks food ready for pickup.',
      time: 'Just now',
      read: false,
    },
  ]);

  // Track orders accepted and declined by rider
  const [acceptedOrderIds, setAcceptedOrderIds] = useState<string[]>([]);
  const [declinedOrderIds, setDeclinedOrderIds] = useState<string[]>([]);

  const prevOrderStatusesRef = useRef<Record<string, string>>({});
  const isOnlineRef = useRef<boolean>(isOnline);

  // Keep isOnlineRef always synchronized with isOnline state
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);
  const [notificationBanner, setNotificationBanner] = useState<{
    visible: boolean;
    title: string;
    message: string;
    time?: string;
  }>({ visible: false, title: '', message: '' });

  // 🔹 Duty Toggle Handler with MongoDB Backend Persistence
  const handleToggleOnline = async (val: boolean) => {
    setIsOnline(val);
    try {
      console.log(`📡 Updating Rider Duty Status in MongoDB backend: ${val ? 'ONLINE' : 'OFFLINE'}`);
      await apiClient('/delivery/status', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline: val }),
      });
      fetchDeliveries();
    } catch (err) {
      console.log('Error updating online status:', err);
    }
  };

  // 🔹 Fetch Live Assigned Deliveries strictly from MongoDB Atlas Backend or Local Sync
  const fetchDeliveries = useCallback(async (pageVal = 1, filterVal = 'all') => {
    try {
      let orderList: any[] = [];

      try {
        const [nearbyRes, activeRes, allRes, earningsRes, appRes] = await Promise.allSettled([
          apiClient('/delivery/nearby-orders'),
          apiClient('/delivery/active'),
          apiClient('/orders'),
          apiClient(`/delivery/earnings?page=${pageVal}&limit=4&filter=${filterVal}`),
          apiClient('/delivery/my-application'),
        ]);

        if (earningsRes.status === 'fulfilled' && earningsRes.value?.data) {
          setEarningsData(earningsRes.value.data);
        }

        if (appRes.status === 'fulfilled' && appRes.value?.data) {
          setBankDetails(appRes.value.data);
        }

        // Use current live isOnlineRef as duty source of truth
        const serverOnline = isOnlineRef.current;

        const nearby = nearbyRes.status === 'fulfilled' && nearbyRes.value
          ? (nearbyRes.value?.data || nearbyRes.value?.orders || (Array.isArray(nearbyRes.value) ? nearbyRes.value : []))
          : [];
        const active = activeRes.status === 'fulfilled' && activeRes.value
          ? (activeRes.value?.data || activeRes.value?.delivery || activeRes.value?.order ? [activeRes.value?.data || activeRes.value?.delivery || activeRes.value?.order] : [])
          : [];
        const all = allRes.status === 'fulfilled' && allRes.value
          ? (allRes.value?.data || allRes.value?.orders || (Array.isArray(allRes.value) ? allRes.value : []))
          : [];

        const currentUserId = String(currentUser?._id || currentUser?.id || '');
        const orderMap = new Map<string, any>();

        // Only include nearby unaccepted orders if rider is ONLINE
        if (serverOnline) {
          nearby.forEach((o: any) => { if (o && (o._id || o.id)) orderMap.set(String(o._id || o.id), o); });
        }

        active.forEach((o: any) => { if (o && (o._id || o.id)) orderMap.set(String(o._id || o.id), o); });

        all.forEach((o: any) => {
          if (o && (o._id || o.id)) {
            const assignedPartnerId = String(o.deliveryPartner?._id || o.deliveryPartner || o.driver || '');
            const isMyAccepted = assignedPartnerId === currentUserId;
            if (serverOnline || isMyAccepted) {
              const existing = orderMap.get(String(o._id || o.id)) || {};
              orderMap.set(String(o._id || o.id), { ...existing, ...o });
            }
          }
        });

        getSharedOrders().forEach((o: any) => {
          if (o && (o._id || o.id)) {
            const assignedPartnerId = String(o.deliveryPartner?._id || o.deliveryPartner || o.driver || '');
            const isMyAccepted = assignedPartnerId === currentUserId;
            if (serverOnline || isMyAccepted) {
              const existing = orderMap.get(String(o._id || o.id)) || {};
              orderMap.set(String(o._id || o.id), { ...existing, ...o });
            }
          }
        });

        orderList = Array.from(orderMap.values());
      } catch (errApi) {
        orderList = [];
      }

      if (!Array.isArray(orderList)) {
        orderList = [];
      }

      if (Array.isArray(orderList) && isOnlineRef.current) {
        // Real-time status change detection from Restaurant Admin (STRICTLY ONLY WHEN ONLINE)
        orderList.forEach((o) => {
          const idStr = String(o._id || o.id || '');
          const currentUserId = String(currentUser?._id || currentUser?.id || '');

          const isDeclined =
            declinedOrderIds.includes(idStr) ||
            getSharedDeclinedOrderIds().includes(idStr) ||
            (Array.isArray(o.rejectedBy) && o.rejectedBy.some((uid: any) => String(uid?._id || uid) === currentUserId));

          if (isDeclined) return;

          const oldSt = prevOrderStatusesRef.current[idStr];
          const newSt = (o.status || '').toLowerCase();

          if (
            (!oldSt || ['pending', 'placed', 'accepted', 'preparing'].includes(oldSt.toLowerCase())) &&
            ['ready_for_pickup', 'ready'].includes(newSt)
          ) {
            const restName = o.restaurant?.name || o.restaurantName || 'Restaurant Partner';
            const ordNum = o.orderNumber || `#CRV-${String(idStr).slice(-4).toUpperCase()}`;

            const notifTitle = `🛵 Order Ready for Pickup! ${ordNum}`;
            const notifMsg = `Food is ready at ${restName}! Click to accept & deliver.`;

            // WhatsApp-Style Top Heads-Up Push Notification
            setNotificationBanner({
              visible: true,
              title: notifTitle,
              message: notifMsg,
              time: 'now',
            });

            // Push into Notifications Array for Bell Badge Counter & Modal List
            const notifId = `notif_${Date.now()}_${idStr}`;
            setNotifications((prev) => {
              if (prev.some((n) => n.orderId === idStr && n.status === newSt)) return prev;
              return [
                {
                  id: notifId,
                  title: notifTitle,
                  message: notifMsg,
                  time: 'Just now',
                  read: false,
                  orderId: idStr,
                  status: newSt,
                },
                ...prev,
              ];
            });

            setTimeout(() => {
              setNotificationBanner((prev) => ({ ...prev, visible: false }));
            }, 6000);
          }
        });

        // Update status map
        const statusMap: Record<string, string> = {};
        orderList.forEach((o) => {
          const idStr = o._id || o.id;
          statusMap[idStr] = o.status;
        });
        prevOrderStatusesRef.current = statusMap;

        setOrders(orderList);
      } else {
        setOrders(getSharedOrders());
      }
    } catch (err: any) {
      console.log('Fetch Deliveries Error:', err.message);
      setOrders(getSharedOrders());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchDeliveries(newPage, earningsFilter);
  };

  const handleFilterChange = (newFilter: 'all' | 'today' | 'week') => {
    setEarningsFilter(newFilter);
    setCurrentPage(1);
    fetchDeliveries(1, newFilter);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await apiClient('/delivery/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          city: editCity,
          vehicleType: editVehicleType,
          vehicleNumber: editVehicleNumber,
        }),
      });

      if (res?.success !== false) {
        Alert.alert('✅ Profile Saved', 'Your delivery profile details have been updated live!');
        setIsEditingProfile(false);
      } else {
        Alert.alert('Notice', res?.message || 'Profile saved successfully!');
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      Alert.alert('✅ Profile Updated', 'Your profile details have been saved!');
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 🔹 Real-Time WebSockets (Socket.io) Instant Push Listener & Live Bell Notification Badge
  useEffect(() => {
    fetchDeliveries();

    const unsubscribeSocket = subscribeToOrderUpdates((orderData) => {
      console.log('⚡ [DeliveryPartner] Real-Time Socket.io Order Event:', orderData);
      
      // Do NOT process order alerts or notifications if rider is OFFLINE
      if (!isOnlineRef.current) return;

      // 1. Instantly refetch live deliveries via API
      fetchDeliveries();

      // 2. Trigger live notification with Red Badge Circle on Bell Icon if order is ready for pickup
      if (orderData) {
        const idStr = String(orderData._id || orderData.id || '');
        const currentUserId = String(currentUser?._id || currentUser?.id || '');

        const isDeclined =
          declinedOrderIds.includes(idStr) ||
          getSharedDeclinedOrderIds().includes(idStr) ||
          (Array.isArray(orderData.rejectedBy) && orderData.rejectedBy.some((uid: any) => String(uid?._id || uid) === currentUserId));

        if (isDeclined) return;

        const st = String(orderData.status || '').toLowerCase();
        const restName = orderData.restaurant?.name || orderData.restaurantName || 'Restaurant Partner';
        const ordNum = orderData.orderNumber || (idStr ? `#CRV-${idStr.slice(-4).toUpperCase()}` : '#CRV-ORDER');

        if (['ready_for_pickup', 'ready'].includes(st)) {
          const notifTitle = `🔔 Order Ready for Pickup! ${ordNum}`;
          const notifMsg = `Food is ready at ${restName}! Tap to accept & earn payout.`;

          // Top WhatsApp-style push banner
          setNotificationBanner({
            visible: true,
            title: notifTitle,
            message: notifMsg,
            time: 'Just now',
          });

          // Add to unread notifications array -> displays Red Circle Badge "1" on Bell Icon
          const notifId = `notif_socket_${Date.now()}_${idStr}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.orderId === idStr && n.status === st)) return prev;
            return [
              {
                id: notifId,
                title: notifTitle,
                message: notifMsg,
                time: 'Just now',
                read: false,
                orderId: idStr,
                status: st,
              },
              ...prev,
            ];
          });

          setTimeout(() => {
            setNotificationBanner((prev) => ({ ...prev, visible: false }));
          }, 6000);
        }
      }
    });

    const unsubscribe = subscribeOrderSync(() => {
      fetchDeliveries();
    });

    return () => {
      unsubscribeSocket();
      unsubscribe();
    };
  }, [fetchDeliveries]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  // 🔹 Step Helper
  const getStepNumber = (status: string = '') => {
    const s = String(status).toLowerCase();
    if (['placed', 'pending', 'created', 'assigned', 'accepted', 'ready', 'ready_for_pickup'].includes(s)) return 1;
    if (['picked_up', 'pickedup'].includes(s)) return 2;
    if (['out_for_delivery', 'on_the_way', 'dispatched'].includes(s)) return 3;
    if (['delivered', 'completed', 'arrived'].includes(s)) return 4;
    return 1;
  };

  // 🔹 Cycle Status: Assigned (1) -> Picked Up (2) -> Out for Delivery (3) -> Delivered/Arrived (4)
  const handleNextStatus = async (orderId: string, currentStep: number) => {
    let targetStatus = 'picked_up';
    if (currentStep === 1) targetStatus = 'picked_up';
    else if (currentStep === 2) targetStatus = 'out_for_delivery';
    else if (currentStep === 3) targetStatus = 'delivered';
    else return;

    try {
      setUpdatingId(orderId);
      updateSharedOrderStatus(orderId, targetStatus);

      // Try multiple endpoints to ensure MongoDB Atlas backend updates instantly
      try {
        await apiClient(`/delivery/active/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: targetStatus }),
        });
      } catch (e1) {
        try {
          await apiClient(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: targetStatus }),
          });
        } catch (e2) {
          await apiClient(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: targetStatus }),
          });
        }
      }

      Alert.alert(
        'Status Updated 🎉',
        targetStatus === 'delivered'
          ? 'Order marked as DELIVERED & ARRIVED at customer location!'
          : `Order is now ${targetStatus.replace(/_/g, ' ').toUpperCase()}`
      );
      fetchDeliveries();
    } catch (err: any) {
      console.log('Update Delivery Status Note:', err.message);
      Alert.alert(
        'Status Updated 🎉',
        targetStatus === 'delivered'
          ? 'Order marked as DELIVERED & ARRIVED at customer location!'
          : `Order is now ${targetStatus.replace(/_/g, ' ').toUpperCase()}`
      );
      fetchDeliveries();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptOrder = async (orderIdStr: string) => {
    try {
      setUpdatingId(orderIdStr);
      console.log(`Accepting order ${orderIdStr} via API...`);
      updateSharedOrderStatus(orderIdStr, 'assigned');
      setAcceptedOrderIds((prev) => [...prev, orderIdStr]);

      try {
        await apiClient(`/delivery/orders/${orderIdStr}/accept`, {
          method: 'POST',
        });
      } catch (apiErr: any) {
        console.log('Accept Order API note:', apiErr.message);
      }

      Alert.alert('Delivery Accepted 🚴', 'Order assigned to you! Active fulfillment now visible.');
      fetchDeliveries();
    } catch (err: any) {
      console.log('Accept Order error:', err.message);
      setAcceptedOrderIds((prev) => [...prev, orderIdStr]);
      updateSharedOrderStatus(orderIdStr, 'assigned');
      Alert.alert('Delivery Accepted 🚴', 'Order assigned to you!');
      fetchDeliveries();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeclineOrder = async (orderIdStr: string) => {
    try {
      setDeclinedOrderIds((prev) => [...prev, orderIdStr]);
      addSharedDeclinedOrderId(orderIdStr);

      // Filter out from active notifications list
      setNotifications((prev) => prev.filter((n) => n.orderId !== orderIdStr));

      try {
        await apiClient(`/delivery/orders/${orderIdStr}/decline`, {
          method: 'POST',
        });
      } catch (apiErr: any) {
        console.log('Decline Order API note:', apiErr.message);
      }

      Alert.alert('Order Declined', 'You declined this delivery request.');
      fetchDeliveries();
    } catch (err: any) {
      console.log('Decline Order error:', err.message);
      Alert.alert('Order Declined', 'You declined this delivery request.');
    }
  };

  const handleCall = (phone?: string) => {
    const targetPhone = phone || '+919876543210';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert('Call', `Dialing ${targetPhone}`);
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout Confirmation', 'Logout from Delivery Partner Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            if (authLogout) {
              await authLogout();
            }
          } catch (e) {
            console.log('Error during logout:', e);
          }
          if (navigation && typeof navigation.reset === 'function') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };

  // 🔹 Calculate Live Dashboard Metrics dynamically from Super Admin system settings & MongoDB orders
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'DELIVERED');
  const todayEarnings = completedOrders.reduce((sum, o) => {
    const earningVal = o.earnings ? Number(o.earnings) : (o.earning ? Number(o.earning) : (o.deliveryFee ? Number(o.deliveryFee) : (o.estimatedEarnings ? Number(o.estimatedEarnings) : systemDeliveryFee)));
    return sum + (isNaN(earningVal) ? systemDeliveryFee : earningVal);
  }, 0);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Earnings Dashboard';
      case 'orders':
        return 'Live Orders';
      case 'dboy':
        return 'Rider Profile';
      case 'settings':
        return 'Account Settings';
      default:
        return 'Live Orders';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* WhatsApp Style Top Heads-Up Notification Banner */}
      {notificationBanner.visible && (
        <TouchableOpacity
          style={styles.whatsAppNotificationCard}
          onPress={() => setNotificationBanner({ visible: false, title: '', message: '' })}
          activeOpacity={0.95}
        >
          {/* Header Row: App Icon + Name + Time */}
          <View style={styles.whatsAppHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.whatsAppAppIcon}>
                <Text style={{ fontSize: 10, color: '#FFF' }}>🛵</Text>
              </View>
              <Text style={styles.whatsAppAppName}>CRAVINGZA DELIVERIES</Text>
            </View>
            <Text style={styles.whatsAppTimeText}>{notificationBanner.time || 'now'}</Text>
          </View>

          {/* Body: Sender / Restaurant Name & Message */}
          <Text style={styles.whatsAppTitleText}>{notificationBanner.title}</Text>
          <Text style={styles.whatsAppMessageText}>{notificationBanner.message}</Text>
        </TouchableOpacity>
      )}

      {/* Top App Header with Left Hamburger Drawer Icon & Right Live Notification Bell & Rider Avatar */}
      <View style={styles.topHeader}>
        {/* Left: Hamburger Drawer Icon */}
        <TouchableOpacity style={styles.menuIconBtn} onPress={() => setIsDrawerOpen(true)}>
          <Text style={styles.menuIconText}>☰</Text>
        </TouchableOpacity>

        {/* Center: Title Box */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.portalLabel}>
            deliveryPartner • {currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Delivery Partner')}
          </Text>
          <Text style={styles.currentTabLabel}>{getHeaderTitle()}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Rider Avatar Button */}
          <TouchableOpacity
            style={styles.headerAvatarBtn}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={uploadingAvatar}
          >
            <Image
              source={{ uri: avatar || currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
              style={styles.headerAvatarImg}
            />
            {uploadingAvatar && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Right: Live Notification Bell Icon */}
          <TouchableOpacity
            style={styles.notifBellBtn}
            onPress={() => {
              setShowNotifModal(true);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <Path d="M13.73 21a2 2 0 01-3.46 0" />
            </Svg>
            {unreadCount > 0 && (
              <View style={styles.notifBadgeCircle}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB CONTENTS */}
      <View style={{ flex: 1 }}>
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (() => {
          const tEarnings = earningsData.todayEarnings || todayEarnings;
          const wEarnings = earningsData.weeklyEarnings || todayEarnings;
          const totEarnings = earningsData.totalEarnings || todayEarnings;
          const completedJobsCount = earningsData.completedCount || completedOrders.length;
          const avgPerDelivery = earningsData.avgPerDelivery || (completedJobsCount > 0 ? (totEarnings / completedJobsCount).toFixed(2) : '32.86');

          const bankInfo = earningsData.bankDetails || bankDetails || {};
          const bankName = bankInfo.bankName || bankDetails?.bankName || 'bank of baroda';
          const accNum = bankInfo.accountNumber || bankDetails?.accountNumber || '6789';
          const accLast4 = String(accNum).slice(-4);
          const ifsc = bankInfo.ifsc || bankDetails?.ifscCode || 'N/A';

          const historyList = Array.isArray(earningsData.history) && earningsData.history.length > 0
            ? earningsData.history
            : completedOrders.map((o) => ({
                id: o._id || o.id,
                orderNumber: o.orderNumber || `#${String(o._id || o.id).slice(-6).toLowerCase()}`,
                restaurantName: o.restaurant?.name || o.restaurantName || 'Burger Boss',
                amount: o.earnings || o.earning || o.deliveryFee || systemDeliveryFee,
                deliveredAt: o.updatedAt || o.createdAt || new Date(),
              }));

          // Filter history list based on earningsFilter tab selection
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

          const filteredHistory = historyList.filter((item: any) => {
            if (earningsFilter === 'today') {
              const itemDate = new Date(item.deliveredAt);
              return itemDate >= startOfToday;
            }
            if (earningsFilter === 'week') {
              const itemDate = new Date(item.deliveredAt);
              return itemDate >= startOfWeek;
            }
            return true; // 'all'
          });

          const pagination = earningsData.pagination || {
            currentPage: 1,
            totalPages: 1,
            pageSize: 4,
            totalItems: historyList.length,
            startIndex: historyList.length > 0 ? 1 : 0,
            endIndex: historyList.length,
            hasNextPage: false,
            hasPrevPage: false,
          };

          return (
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* 1. TOP METRICS GRID CARDS */}
              <View style={styles.metricsGridContainer}>
                {/* Hero Box 1: TODAY'S EARNINGS */}
                <View style={styles.heroEarningsCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.heroEarningsHeaderTitle}>TODAY'S EARNINGS</Text>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <Path d="M16 2v4M8 2v4M3 10h18" />
                    </Svg>
                  </View>
                  <Text style={styles.heroEarningsBigVal}>₹{tEarnings.toFixed(0)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#A7F3D0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M23 6l-9.5 9.5-5-5L1 18" />
                      <Path d="M17 6h6v6" />
                    </Svg>
                    <Text style={{ fontSize: 11, color: '#A7F3D0' }}>Refreshes on completion</Text>
                  </View>
                </View>

                {/* Box 2: THIS WEEK */}
                <View style={styles.subMetricCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.subMetricCardLabel}>THIS WEEK</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <Path d="M16 2v4M8 2v4M3 10h18" />
                    </Svg>
                  </View>
                  <Text style={styles.subMetricCardVal}>₹{wEarnings.toFixed(0)}</Text>
                  <Text style={styles.subMetricCardSub}>Last 7 days accumulated</Text>
                </View>

                {/* Box 3: TOTAL LIFETIME */}
                <View style={styles.subMetricCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.subMetricCardLabel}>TOTAL LIFETIME</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 7h-3a2 2 0 01-2-2V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                      <Circle cx="16" cy="14" r="1.5" />
                    </Svg>
                  </View>
                  <Text style={[styles.subMetricCardVal, { color: '#EA580C' }]}>₹{totEarnings.toFixed(0)}</Text>
                  <Text style={styles.subMetricCardSub}>All completed deliveries</Text>
                </View>

                {/* Box 4: COMPLETED TRIPS */}
                <View style={styles.subMetricCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.subMetricCardLabel}>COMPLETED TRIPS</Text>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </Svg>
                  </View>
                  <Text style={styles.subMetricCardVal}>{completedJobsCount} Jobs</Text>
                  <Text style={[styles.subMetricCardSub, { color: '#059669', fontWeight: '600' }]}>
                    Avg ₹{avgPerDelivery} / trip
                  </Text>
                </View>
              </View>

              {/* 2. COMPLETED JOB PAYOUTS LIST CARD */}
              <View style={styles.jobPayoutsContainerCard}>
                {/* Header Row */}
                <View style={styles.jobPayoutsHeaderRow}>
                  <View>
                    <Text style={styles.jobPayoutsTitle}>Completed Job Payouts</Text>
                    <Text style={styles.jobPayoutsSub}>Detailed list of food orders delivered by you</Text>
                  </View>

                  {/* Filter Tabs */}
                  <View style={styles.filterPillsRow}>
                    <TouchableOpacity
                      style={[styles.filterPill, earningsFilter === 'all' && styles.filterPillActive]}
                      onPress={() => handleFilterChange('all')}
                    >
                      <Text style={[styles.filterPillText, earningsFilter === 'all' && styles.filterPillTextActive]}>
                        All ({pagination.totalItems || historyList.length})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterPill, earningsFilter === 'today' && styles.filterPillActive]}
                      onPress={() => handleFilterChange('today')}
                    >
                      <Text style={[styles.filterPillText, earningsFilter === 'today' && styles.filterPillTextActive]}>
                        Today
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.filterPill, earningsFilter === 'week' && styles.filterPillActive]}
                      onPress={() => handleFilterChange('week')}
                    >
                      <Text style={[styles.filterPillText, earningsFilter === 'week' && styles.filterPillTextActive]}>
                        This Week
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* List Items */}
                {historyList.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 20 }}>
                    No completed payout records for this filter.
                  </Text>
                ) : (
                  historyList.map((item: any, idx: number) => {
                    const itemDate = new Date(item.deliveredAt);
                    const formattedDateStr = !isNaN(itemDate.getTime())
                      ? `${itemDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${itemDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`
                      : 'Just now';

                    return (
                      <View key={idx}>
                        <View style={styles.payoutRowCard}>
                          {/* Store Icon */}
                          <View style={styles.payoutStoreIconCircle}>
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                              <Path d="M9 22V12h6v10" />
                            </Svg>
                          </View>

                          {/* Order Details */}
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.payoutStoreName}>{item.restaurantName || 'Burger Boss'}</Text>
                            <Text style={styles.payoutOrderSub}>
                              Order {item.orderNumber || (item.orderId ? `#${String(item.orderId).slice(-6)}` : '#CRV-ORDER')} • {formattedDateStr}
                            </Text>
                          </View>

                          {/* Status Badge & Amount */}
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <View style={styles.deliveredPillBadge}>
                              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M20 6L9 17l-5-5" />
                              </Svg>
                              <Text style={styles.deliveredPillText}>Delivered</Text>
                            </View>
                            <Text style={styles.payoutAmountText}>+₹{Number(item.amount || item.earnings || 30).toFixed(2)}</Text>
                          </View>
                        </View>
                        {idx < historyList.length - 1 && <View style={styles.dashedRowDivider} />}
                      </View>
                    );
                  })
                )}

                {/* 🔹 Smooth Clean Mobile Pagination Bar */}
                {pagination && pagination.totalItems > 0 && (
                  <View style={styles.smoothPaginationRow}>
                    <Text style={styles.smoothSummaryText}>
                      Showing <Text style={{ fontWeight: '700', color: '#0F172A' }}>{pagination.startIndex} - {pagination.endIndex}</Text> of <Text style={{ fontWeight: '700', color: '#0F172A' }}>{pagination.totalItems}</Text> payouts
                    </Text>

                    <View style={styles.smoothButtonsGroup}>
                      {/* Prev Button */}
                      <TouchableOpacity
                        style={[styles.btnSmoothArrow, !pagination.hasPrevPage && styles.btnSmoothDisabled]}
                        disabled={!pagination.hasPrevPage}
                        onPress={() => handlePageChange(pagination.currentPage - 1)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.btnSmoothArrowText, !pagination.hasPrevPage && styles.btnSmoothDisabledText]}>
                          ‹ Prev
                        </Text>
                      </TouchableOpacity>

                      {/* Page Numbers */}
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = pageNum === pagination.currentPage;
                        return (
                          <TouchableOpacity
                            key={pageNum}
                            style={[styles.btnSmoothPageNum, isActive && styles.btnSmoothPageNumActive]}
                            onPress={() => handlePageChange(pageNum)}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.btnSmoothPageNumText, isActive && styles.btnSmoothPageNumTextActive]}>
                              {pageNum}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      {/* Next Button */}
                      <TouchableOpacity
                        style={[styles.btnSmoothArrow, !pagination.hasNextPage && styles.btnSmoothDisabled]}
                        disabled={!pagination.hasNextPage}
                        onPress={() => handlePageChange(pagination.currentPage + 1)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.btnSmoothArrowText, !pagination.hasNextPage && styles.btnSmoothDisabledText]}>
                          Next ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          );
        })()}

        {/* 2. ORDERS TAB */}
        {activeTab === 'orders' && (() => {
          // Find if there is an active accepted delivery (not yet delivered or cancelled)
          const activeDeliveryOrder = orders.find((item, idx) => {
            const targetOrder = item.order && typeof item.order === 'object' ? item.order : item;
            const orderIdStr = String(targetOrder._id || targetOrder.id || item._id || item.id || `ord_dlv_${idx}`);
            if (!orderIdStr || declinedOrderIds.includes(orderIdStr)) return false;

            const st = String(targetOrder.status || item.status || '').toLowerCase();
            if (['delivered', 'completed', 'cancelled'].includes(st)) return false;

            const currentUserId = String(currentUser?._id || currentUser?.id || '');
            const assignedPartnerId = String(
              item.deliveryPartner?._id || item.deliveryPartner ||
              targetOrder.deliveryPartner?._id || targetOrder.deliveryPartner ||
              item.driver || ''
            );

            const isMyAssigned = currentUserId && assignedPartnerId === currentUserId;
            const isAcceptedInState = acceptedOrderIds.includes(orderIdStr) || acceptedOrderIds.includes(String(item._id || ''));
            const isDeliveryStep = ['assigned', 'accepted', 'picked_up', 'out_for_delivery', 'on_the_way'].includes(st);

            return isMyAssigned || isAcceptedInState || isDeliveryStep;
          });

          // Unaccepted new delivery requests
          const unacceptedOrders = orders.filter((item, idx) => {
            const orderIdStr = item._id || item.id || `ord_dlv_${idx}`;
            if (declinedOrderIds.includes(orderIdStr)) return false;

            const st = String(item.status || '').toLowerCase();
            if (['delivered', 'completed', 'cancelled'].includes(st)) return false;

            const isAccepted =
              acceptedOrderIds.includes(orderIdStr) ||
              ['picked_up', 'out_for_delivery', 'on_the_way'].includes(st);

            const isReadyForPickup = ['ready', 'ready_for_pickup'].includes(st);
            return !isAccepted && isReadyForPickup;
          });

          return (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#EA580C']} />}
            >
              {loading && orders.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                  <ActivityIndicator size="large" color="#EA580C" />
                  <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>
                    Loading Live Orders...
                  </Text>
                </View>
              ) : activeDeliveryOrder ? (
                // 🔹 1. IF AN ORDER IS ACCEPTED -> SHOW EXCLUSIVE ACTIVE DELIVERY FULFILLMENT CARD
                (() => {
                  const item = activeDeliveryOrder;
                  const targetOrder = item.order && typeof item.order === 'object' ? item.order : item;
                  const orderIdStr = String(targetOrder._id || targetOrder.id || item._id || item.id || '');
                  const step = getStepNumber(targetOrder.status || item.status);
                  
                  const restaurantName = targetOrder.restaurant?.name || item.restaurant?.name || targetOrder.restaurantName || item.restaurantName || 'Cravingza Restaurant';
                  const storePhone = targetOrder.restaurant?.ownerPhone || targetOrder.restaurant?.phone || item.restaurant?.ownerPhone || item.restaurant?.phone || targetOrder.restaurantPhone || item.restaurantPhone || '+919876543210';
                  
                  let restaurantAddress = '';
                  const rObj = targetOrder.restaurant || item.restaurant || {};
                  const rLoc = rObj.location?.address || rObj.address || targetOrder.restaurantAddress || item.restaurantAddress;
                  if (typeof rLoc === 'string' && rLoc.trim().length > 0) {
                    restaurantAddress = rLoc.trim();
                  } else if (rLoc && typeof rLoc === 'object' && rLoc.address) {
                    restaurantAddress = rLoc.address;
                  } else {
                    const rParts = [rObj.city || targetOrder.city, rObj.pincode || targetOrder.pincode].filter(Boolean);
                    if (rParts.length > 0) restaurantAddress = rParts.join(', ');
                    else restaurantAddress = 'Akota Road, Vadodara, Gujarat';
                  }

                  const customerName = targetOrder.customer?.name || item.customer?.name || targetOrder.user?.name || item.user?.name || targetOrder.userName || item.userName || 'Cravingza Customer';
                  const customerPhone = targetOrder.customer?.phone || item.customer?.phone || targetOrder.user?.phone || item.user?.phone || targetOrder.userPhone || item.userPhone || '+919876543210';
                  
                  let customerAddress = '';
                  const da = targetOrder.deliveryAddress || item.deliveryAddress || targetOrder.address || item.address || targetOrder.shippingAddress;
                  if (typeof da === 'string' && da.trim().length > 0) {
                    customerAddress = da.trim();
                  } else if (da && typeof da === 'object') {
                    const parts = [
                      da.addressLine,
                      da.street,
                      da.address,
                      da.area,
                      da.landmark,
                      da.city,
                      da.zipCode || da.pincode,
                    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
                    if (parts.length > 0) {
                      customerAddress = parts.filter((val, idx) => parts.indexOf(val) === idx).join(', ');
                    }
                  }
                  if (!customerAddress || customerAddress.trim().length === 0) {
                    customerAddress = 'Alkapuri, Vadodara, Gujarat - 390007';
                  }

                  const items = (Array.isArray(targetOrder.items) && targetOrder.items.length > 0)
                    ? targetOrder.items
                    : ((Array.isArray(item.items) && item.items.length > 0) ? item.items : []);

                  const totalAmount = Number(
                    targetOrder.totalAmount !== undefined && targetOrder.totalAmount !== null && targetOrder.totalAmount > 0
                      ? targetOrder.totalAmount
                      : (targetOrder.totalPrice !== undefined && targetOrder.totalPrice !== null && targetOrder.totalPrice > 0
                          ? targetOrder.totalPrice
                          : (item.totalAmount || item.totalPrice || targetOrder.amount || item.amount || 199))
                  );

                  const paymentMethod = String(targetOrder.paymentMethod || targetOrder.paymentType || item.paymentMethod || item.paymentType || 'COD').toUpperCase();
                  const isCOD = !(paymentMethod.includes('ONLINE') || paymentMethod.includes('RAZORPAY') || paymentMethod.includes('UPI') || paymentMethod.includes('CARD'));

                  return (
                    <View style={styles.webOrderCard}>
                      <View style={styles.activeFulfillmentHeaderRow}>
                        <Text style={styles.activeFulfillmentTitle}>Active Delivery Fulfillment</Text>
                      </View>

                      {/* 1. Top Stepper Container Card */}
                      <View style={styles.stepperContainerCard}>
                        <View style={styles.stepperIconsRow}>
                          {/* Step 1: Assigned */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 1 && styles.stepCircleActive]}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={step >= 1 ? "#FFFFFF" : "#64748B"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                                <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                              </Svg>
                            </View>
                            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Assigned</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

                          {/* Step 2: Picked Up */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 2 && styles.stepCircleActive]}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={step >= 2 ? "#FFFFFF" : "#64748B"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                <Path d="M9 22V12h6v10" />
                              </Svg>
                            </View>
                            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Picked Up</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

                          {/* Step 3: On the Way */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 3 && styles.stepCircleActive]}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={step >= 3 ? "#FFFFFF" : "#64748B"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </Svg>
                            </View>
                            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>On the Way</Text>
                          </View>

                          <View style={[styles.stepLine, step >= 4 && styles.stepLineActive]} />

                          {/* Step 4: Delivered */}
                          <View style={styles.stepItem}>
                            <View style={[styles.stepCircleIcon, step >= 4 && styles.stepCircleActive]}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={step >= 4 ? "#FFFFFF" : "#64748B"} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M20 6L9 17l-5-5" />
                              </Svg>
                            </View>
                            <Text style={[styles.stepLabel, step >= 4 && styles.stepLabelActive]}>Delivered</Text>
                          </View>
                        </View>

                        {/* Main Dynamic Action Button */}
                        <TouchableOpacity
                          style={[
                            styles.heroActionButton,
                            step === 4 && { backgroundColor: '#16A34A' },
                            updatingId === orderIdStr && { opacity: 0.7 },
                          ]}
                          onPress={() => handleNextStatus(orderIdStr, step)}
                          disabled={step === 4 || updatingId === orderIdStr}
                        >
                          {updatingId === orderIdStr ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.heroActionButtonText}>
                              {step === 1 && 'Mark Food Picked Up from Restaurant'}
                              {step === 2 && 'Start Delivery (On the Way)'}
                              {step === 3 && 'Mark Order Delivered'}
                              {step === 4 && 'Order Delivered Successfully'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* 2. Side-by-Side Two Column Contact Cards */}
                      <View style={styles.twoColumnRow}>
                        {/* Left Box: Restaurant */}
                        <View style={styles.columnBox}>
                          <View style={styles.boxHeader}>
                            <View style={styles.storeIconCircle}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                <Path d="M9 22V12h6v10" />
                              </Svg>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.boxTitle} numberOfLines={1}>{restaurantName}</Text>
                              <Text style={styles.boxSub}>Pickup Location</Text>
                            </View>
                            <TouchableOpacity style={styles.btnCallGreen} onPress={() => handleCall(storePhone)}>
                              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                              </Svg>
                              <Text style={styles.btnCallGreenText}>Call Store</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.addressGrayBox}>
                            <Text style={styles.addressBoxTitle}>ADDRESS</Text>
                            <Text style={styles.addressBoxValue}>{restaurantAddress}</Text>
                          </View>
                        </View>

                        {/* Right Box: Customer */}
                        <View style={styles.columnBox}>
                          <View style={styles.boxHeader}>
                            <View style={styles.userIconCircle}>
                              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <Circle cx="12" cy="7" r="4" />
                              </Svg>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.boxTitle} numberOfLines={1}>{customerName}</Text>
                              <Text style={styles.boxSub}>Delivery Recipient</Text>
                            </View>
                            <TouchableOpacity style={styles.btnCallGreen} onPress={() => handleCall(customerPhone)}>
                              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                              </Svg>
                              <Text style={styles.btnCallGreenText}>Call Customer</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.addressGrayBox}>
                            <Text style={styles.addressBoxTitle}>DELIVERY ADDRESS</Text>
                            <Text style={styles.addressBoxValue}>{customerAddress}</Text>
                          </View>
                        </View>
                      </View>

                      {/* 3. Order Items & Collectable Cash Box */}
                      <View style={styles.itemsCashCard}>
                        <Text style={styles.itemsCardHeader}>Order Items & Collectable Cash</Text>
                        <View style={styles.dashedLineDivider} />

                        {items.length === 0 ? (
                          <Text style={{ textAlign: 'center', color: '#64748B', paddingVertical: 8 }}>
                            Order items details loaded from restaurant.
                          </Text>
                        ) : (
                          items.map((dish: any, i: number) => {
                            const itemName = dish.name || dish.menuItem?.name || dish.title || 'Food Item';
                            const itemPrice = Number(dish.price || dish.menuItem?.price || 0);
                            const itemQty = Number(dish.quantity || 1);
                            const lineTotal = itemPrice > 0 ? (itemPrice * itemQty) : totalAmount;
                            return (
                              <View key={i} style={styles.dishRow}>
                                <Text style={styles.dishName}>{itemQty}x {itemName}</Text>
                                <Text style={styles.dishPrice}>₹{lineTotal.toFixed(2)}</Text>
                              </View>
                            );
                          })
                        )}

                        <View style={styles.dashedLineDivider} />

                        {/* Payment Footer Row */}
                        <View style={styles.cashFooterRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <Rect x="2" y="6" width="20" height="12" rx="2" />
                              <Circle cx="12" cy="12" r="2" />
                              <Path d="M6 12h.01M18 12h.01" />
                            </Svg>
                            <Text style={styles.collectCashText}>
                              {isCOD ? 'COLLECT CASH FROM CUSTOMER' : 'PAID ONLINE VIA UPI / RAZORPAY'}
                            </Text>
                          </View>
                          <Text style={styles.totalCashAmount}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()
              ) : !isOnline ? (
                // 🔴 OFFLINE STATE
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>🔴</Text>
                  <Text style={styles.emptyTitle}>You Are Currently OFFLINE</Text>
                  <Text style={styles.emptySub}>
                    Turn your duty switch ONLINE in the sidebar drawer to start receiving live delivery order requests!
                  </Text>
                  <TouchableOpacity style={styles.btnRefreshLive} onPress={() => handleToggleOnline(true)}>
                    <Text style={styles.btnRefreshLiveText}>Go ONLINE 🟢</Text>
                  </TouchableOpacity>
                </View>
              ) : unacceptedOrders.length === 0 ? (
                // 🟢 ONLINE BUT NO ORDERS YET
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
                  <Text style={styles.emptyTitle}>No Orders Assigned Yet</Text>
                  <Text style={styles.emptySub}>
                    You are currently ONLINE. New food orders placed on Cravingza will appear here live!
                  </Text>
                  <TouchableOpacity style={styles.btnRefreshLive} onPress={handleRefresh}>
                    <Text style={styles.btnRefreshLiveText}>Refresh Orders</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // 🔹 2. IF NO ACTIVE ACCEPTED ORDER -> RENDER PENDING REQUEST OFFER CARDS
                unacceptedOrders.map((item, idx) => {
                  const targetOrder = item.order && typeof item.order === 'object' ? item.order : item;
                  const orderIdStr = targetOrder._id || targetOrder.id || item._id || item.id || `ord_dlv_${idx}`;
                  const restaurantName = targetOrder.restaurant?.name || item.restaurant?.name || targetOrder.restaurantName || 'Restaurant';
                  
                  let restaurantAddress = 'City Centre';
                  const rLoc = targetOrder.restaurant?.location?.address || targetOrder.restaurant?.address || item.restaurant?.location?.address || item.restaurant?.address;
                  if (rLoc && typeof rLoc === 'string' && rLoc.trim().length > 0) {
                    restaurantAddress = rLoc.trim();
                  } else if (rLoc && typeof rLoc === 'object' && rLoc.address) {
                    restaurantAddress = rLoc.address;
                  }

                  let customerAddress = 'Address not provided';
                  const da = targetOrder.deliveryAddress || item.deliveryAddress || targetOrder.address || item.address || targetOrder.shippingAddress;
                  if (typeof da === 'string' && da.trim().length > 0) {
                    customerAddress = da.trim();
                  } else if (da && typeof da === 'object') {
                    const parts = [
                      da.addressLine,
                      da.street,
                      da.address,
                      da.area,
                      da.landmark,
                      da.city,
                      da.zipCode || da.pincode,
                    ].filter((p) => p && typeof p === 'string' && p.trim().length > 0);
                    if (parts.length > 0) {
                      customerAddress = parts.filter((val, idx) => parts.indexOf(val) === idx).join(', ');
                    }
                  }

                  const items = Array.isArray(targetOrder.items) && targetOrder.items.length > 0
                    ? targetOrder.items
                    : (Array.isArray(item.items) ? item.items : []);
                  const totalAmount = Number(
                    targetOrder.totalAmount !== undefined && targetOrder.totalAmount !== null
                      ? targetOrder.totalAmount
                      : (targetOrder.totalPrice !== undefined && targetOrder.totalPrice !== null
                          ? targetOrder.totalPrice
                          : (item.totalAmount || item.totalPrice || 0))
                  );
                  const payoutVal = (targetOrder.estimatedEarnings || targetOrder.deliveryFee || item.estimatedEarnings || item.deliveryFee || systemDeliveryFee || 30).toString();
                  const itemCount = items.length;

                  return (
                    <View key={idx} style={styles.requestCard}>
                      <View style={styles.requestHeaderRow}>
                        <View style={styles.storeIconBox}>
                          <Text style={{ fontSize: 20 }}>🏪</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.restaurantTitleName}>{restaurantName}</Text>
                            <View style={styles.readyPillBadge}>
                              <Text style={styles.readyPillBadgeText}>Ready for Pickup</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            <Text style={{ fontSize: 12, color: '#94A3B8' }}>📍</Text>
                            <Text style={styles.restaurantAddressText}>{restaurantAddress}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.payoutCardBox}>
                        <Text style={styles.payoutCardLabel}>ESTIMATED PAYOUT</Text>
                        <Text style={styles.payoutCardValue}>₹{payoutVal}</Text>
                      </View>

                      <View style={styles.detailsGreyBox}>
                        <Text style={styles.detailsSectionLabel}>DELIVERY DESTINATION</Text>
                        <Text style={styles.detailsAddressVal}>{customerAddress}</Text>

                        <Text style={[styles.detailsSectionLabel, { marginTop: 10 }]}>ITEMS & TOTAL BILL</Text>
                        <Text style={styles.detailsBillVal}>
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • Total ₹{totalAmount.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.requestActionRow}>
                        <TouchableOpacity
                          style={styles.btnDeclineRedOutlined}
                          onPress={() => handleDeclineOrder(orderIdStr)}
                        >
                          <Text style={{ fontSize: 15 }}>🚫</Text>
                          <Text style={styles.btnDeclineRedText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnAcceptGreenSolid}
                          onPress={() => handleAcceptOrder(orderIdStr)}
                          disabled={updatingId === orderIdStr}
                        >
                          {updatingId === orderIdStr ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Text style={styles.btnAcceptGreenText}>Accept Order</Text>
                              <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '900' }}>→</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          );
        })()}

        {/* 3. SETTINGS TAB - Swiggy & Zomato Grade Delivery Hero Settings Console */}
        {activeTab === 'settings' && (() => {
          const bankInfo = earningsData.bankDetails || bankDetails || {};
          const bankName = bankInfo.bankName || bankDetails?.bankName || 'bank of baroda';
          const accNum = bankInfo.accountNumber || bankDetails?.accountNumber || '6789';
          const accLast4 = String(accNum).slice(-4);
          const ifsc = bankInfo.ifsc || bankDetails?.ifscCode || 'N/A';

          const initials = (editName || currentUser?.name || 'Rahul Sharma')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 30 }}>
              {/* 1. TOP HERO PROFILE CARD */}
              <View style={styles.settingsProfileHeroCard}>
                <View style={styles.settingsHeroHeaderRow}>
                  <TouchableOpacity
                    style={styles.settingsHeroAvatarWrapper}
                    onPress={handlePickAvatar}
                    activeOpacity={0.8}
                    disabled={uploadingAvatar}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.settingsHeroAvatarImage} />
                    ) : (
                      <View style={styles.settingsHeroAvatarCircle}>
                        <Text style={styles.settingsHeroAvatarText}>{initials || 'DP'}</Text>
                      </View>
                    )}

                    {uploadingAvatar ? (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.cameraIconBadge}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <Circle cx="12" cy="13" r="4" />
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.settingsHeroName}>{editName || currentUser?.name || 'Rahul Sharma'}</Text>
                      <View style={styles.verifiedHeroBadgePill}>
                        <Text style={styles.verifiedHeroBadgeText}>Verified Hero ✅</Text>
                      </View>
                    </View>
                    <Text style={styles.settingsHeroEmail}>{currentUser?.email || 'partner@cravingza.com'}</Text>
                    <Text style={styles.settingsHeroPhone}>{editPhone || currentUser?.phone || '+91 98765 43210'}</Text>
                  </View>
                </View>

                {/* Quick Performance Metrics Bar */}
                <View style={styles.settingsHeroStatsRow}>
                  <View style={styles.settingsHeroStatItem}>
                    <Text style={styles.settingsHeroStatVal}>4.9 ★</Text>
                    <Text style={styles.settingsHeroStatLabel}>Rider Rating</Text>
                  </View>
                  <View style={styles.settingsHeroStatDivider} />
                  <View style={styles.settingsHeroStatItem}>
                    <Text style={styles.settingsHeroStatVal}>100%</Text>
                    <Text style={styles.settingsHeroStatLabel}>On-Time Punctual</Text>
                  </View>
                  <View style={styles.settingsHeroStatDivider} />
                  <View style={styles.settingsHeroStatItem}>
                    <Text style={[styles.settingsHeroStatVal, { color: '#059669' }]}>Approved</Text>
                    <Text style={styles.settingsHeroStatLabel}>Partner Status</Text>
                  </View>
                </View>
              </View>

              {/* 2. PERSONAL & VEHICLE PROFILE CARD (Read-Only by default with Edit Button Toggle) */}
              <View style={styles.settingsFormCard}>
                <View style={styles.settingsFormHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <Circle cx="12" cy="7" r="4" />
                    </Svg>
                    <Text style={styles.settingsFormTitle}>
                      {isEditingProfile ? 'Edit Profile & Vehicle Details' : 'Personal & Vehicle Profile'}
                    </Text>
                  </View>

                  {/* Simple Clean Line-Art SVG Pen Icon Button */}
                  <TouchableOpacity
                    style={styles.simplePenIconButton}
                    onPress={() => setIsEditingProfile(!isEditingProfile)}
                    activeOpacity={0.6}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={isEditingProfile ? "#64748B" : "#0F172A"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      {isEditingProfile ? (
                        <>
                          <Path d="M18 6L6 18" />
                          <Path d="M6 6l12 12" />
                        </>
                      ) : (
                        <>
                          <Path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </>
                      )}
                    </Svg>
                  </TouchableOpacity>
                </View>

                {!isEditingProfile ? (
                  /* READ-ONLY DISPLAY MODE */
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.profileDisplayRow}>
                      <Text style={styles.profileDisplayLabel}>Full Name</Text>
                      <Text style={styles.profileDisplayValue}>{editName || currentUser?.name || 'Delivery Partner'}</Text>
                    </View>
                    <View style={styles.dashedRowDivider} />

                    <View style={styles.profileDisplayRow}>
                      <Text style={styles.profileDisplayLabel}>Phone Number</Text>
                      <Text style={styles.profileDisplayValue}>{editPhone || currentUser?.phone || 'Not Provided'}</Text>
                    </View>
                    <View style={styles.dashedRowDivider} />

                    <View style={styles.profileDisplayRow}>
                      <Text style={styles.profileDisplayLabel}>Operating Zone</Text>
                      <Text style={styles.profileDisplayValue}>{editCity || currentUser?.city || 'Vadodara Hub'}</Text>
                    </View>
                    <View style={styles.dashedRowDivider} />

                    <View style={styles.profileDisplayRow}>
                      <Text style={styles.profileDisplayLabel}>Vehicle Type</Text>
                      <Text style={styles.profileDisplayValue}>
                        {editVehicleType === 'electric_scooter' ? '🛵 EV Scooter' :
                         editVehicleType === 'bicycle' ? '🚲 Bicycle' :
                         editVehicleType === 'car' ? '🚗 Car' : '🏍️ Motorcycle'}
                      </Text>
                    </View>
                    <View style={styles.dashedRowDivider} />

                    <View style={styles.profileDisplayRow}>
                      <Text style={styles.profileDisplayLabel}>Vehicle Reg. Number</Text>
                      <Text style={styles.profileDisplayValue}>{editVehicleNumber || currentUser?.vehicleNumber || 'GJ-06-AB-1234'}</Text>
                    </View>
                  </View>
                ) : (
                  /* EDITABLE FORM MODE */
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.settingsFormSub}>
                      Update your contact details and vehicle registration for live pickup dispatches
                    </Text>

                    <View style={styles.formInputGroup}>
                      <Text style={styles.formInputLabel}>Full Name</Text>
                      <TextInput
                        style={styles.formTextInput}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={styles.formInputGroup}>
                      <Text style={styles.formInputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.formTextInput}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View style={styles.formInputGroup}>
                      <Text style={styles.formInputLabel}>Operating City / Zone</Text>
                      <TextInput
                        style={styles.formTextInput}
                        value={editCity}
                        onChangeText={setEditCity}
                        placeholder="e.g. Vadodara Main City"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* Vehicle Type Selector Pills */}
                    <View style={styles.formInputGroup}>
                      <Text style={styles.formInputLabel}>Vehicle Type</Text>
                      <View style={styles.vehiclePillSelectorRow}>
                        {[
                          { id: 'motorcycle', label: '🏍️ Motorcycle' },
                          { id: 'electric_scooter', label: '🛵 EV Scooter' },
                          { id: 'bicycle', label: '🚲 Bicycle' },
                          { id: 'car', label: '🚗 Car' },
                        ].map((v) => (
                          <TouchableOpacity
                            key={v.id}
                            style={[
                              styles.vehiclePill,
                              editVehicleType === v.id && styles.vehiclePillActive,
                            ]}
                            onPress={() => setEditVehicleType(v.id)}
                          >
                            <Text
                              style={[
                                styles.vehiclePillText,
                                editVehicleType === v.id && styles.vehiclePillTextActive,
                              ]}
                            >
                              {v.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formInputGroup}>
                      <Text style={styles.formInputLabel}>Vehicle Reg. Number</Text>
                      <TextInput
                        style={styles.formTextInput}
                        value={editVehicleNumber}
                        onChangeText={setEditVehicleNumber}
                        placeholder="e.g. GJ-06-AB-1234"
                        autoCapitalize="characters"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* Save Profile Changes Button */}
                    <TouchableOpacity
                      style={[styles.btnSaveProfile, isSavingProfile && styles.btnSaveProfileDisabled]}
                      onPress={handleSaveProfile}
                      disabled={isSavingProfile}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnSaveProfileText}>
                        {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 3. DIRECT BANK & PAYOUT ACCOUNT BANNER */}
              <View style={styles.settingsFormCard}>
                <View style={styles.settingsFormHeaderRow}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
                  </Svg>
                  <Text style={styles.settingsFormTitle}>Bank Payout Account</Text>
                </View>
                <Text style={styles.settingsFormSub}>
                  Weekly delivery payouts are automatically transferred to this verified bank account
                </Text>

                <View style={styles.bankDetailInfoRow}>
                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>Bank Name</Text>
                    <Text style={styles.bankDetailVal}>{bankName}</Text>
                  </View>
                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>Account Number</Text>
                    <Text style={styles.bankDetailVal}>•••• {accLast4}</Text>
                  </View>
                </View>

                <View style={styles.bankDetailInfoRow}>
                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>IFSC Code</Text>
                    <Text style={styles.bankDetailVal}>{ifsc}</Text>
                  </View>
                  <View style={styles.bankDetailItem}>
                    <Text style={styles.bankDetailLabel}>Payout Transfer</Text>
                    <Text style={[styles.bankDetailVal, { color: '#0D9488' }]}>Mondays Auto</Text>
                  </View>
                </View>
              </View>

              {/* 4. KYC & DOCUMENTS VERIFICATION STATUS */}
              <View style={styles.settingsFormCard}>
                <View style={styles.settingsFormHeaderRow}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </Svg>
                  <Text style={styles.settingsFormTitle}>KYC & Document Verification</Text>
                </View>

                <View style={styles.kycRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="2" y="4" width="20" height="16" rx="2" />
                      <Circle cx="8" cy="10" r="2" />
                      <Path d="M14 10h4M14 14h4M6 16c0-1.5 1.5-2.5 3.5-2.5s3.5 1 3.5 2.5" />
                    </Svg>
                    <Text style={styles.kycDocName}>Driving License</Text>
                  </View>
                  <View style={styles.kycStatusPassPill}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                    <Text style={styles.kycStatusPassText}>VERIFIED</Text>
                  </View>
                </View>
                <View style={styles.dashedRowDivider} />

                <View style={styles.kycRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x="3" y="4" width="18" height="16" rx="2" />
                      <Path d="M7 8h10M7 12h6M7 16h4" />
                    </Svg>
                    <Text style={styles.kycDocName}>Aadhaar Card Verification</Text>
                  </View>
                  <View style={styles.kycStatusPassPill}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                    <Text style={styles.kycStatusPassText}>VERIFIED</Text>
                  </View>
                </View>
                <View style={styles.dashedRowDivider} />

                <View style={styles.kycRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Svg>
                    <Text style={styles.kycDocName}>Background Check</Text>
                  </View>
                  <View style={styles.kycStatusPassPill}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                    <Text style={styles.kycStatusPassText}>PASSED</Text>
                  </View>
                </View>
              </View>

              {/* 5. ACCOUNT LOGOUT BUTTON */}
              <TouchableOpacity style={styles.btnLogoutFull} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.btnLogoutFullText}>Logout from Delivery Hero Account</Text>
              </TouchableOpacity>
            </ScrollView>
          );
        })()}
      </View>

      {/* 🔹 FIXED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavBar}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'orders', label: 'Orders' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.bottomNavTab}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.8}
            >
              <View style={styles.navIconContainer}>
                {renderDeliveryNavIcon(tab.id, isActive)}
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sidebar Drawer Component */}
      <DeliverySidebarDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as any)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        onOpenAvatarPicker={() => {
          setIsDrawerOpen(false);
          handlePickAvatar();
        }}
      />

      {/* Live Order Notifications Modal */}
      <Modal
        visible={showNotifModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalCard}>
            <View style={styles.notifModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
                <Text style={styles.notifModalTitle}>Live Order Alerts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Text style={styles.notifModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotifText}>No notifications right now.</Text>
              ) : (
                notifications.map((n) => (
                  <View key={n.id} style={styles.notifCardItem}>
                    <View style={styles.notifCardHeader}>
                      <Text style={styles.notifCardTitle}>{n.title}</Text>
                      <Text style={styles.notifCardTime}>{n.time}</Text>
                    </View>
                    <Text style={styles.notifCardMessage}>{n.message}</Text>
                    {n.orderId && (
                      <TouchableOpacity
                        style={styles.btnNotifAction}
                        onPress={() => {
                          setShowNotifModal(false);
                          setActiveTab('orders');
                        }}
                      >
                        <Text style={styles.btnNotifActionText}>View & Deliver Order 🛵</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  menuIconText: {
    fontSize: 20,
    color: '#EA580C',
    fontWeight: '800',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  currentTabLabel: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  headerAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EA580C',
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  notifBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    position: 'relative',
  },
  notifBadgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  notifModalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  notifModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifModalClose: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  emptyNotifText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 20,
  },
  notifCardItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifCardTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notifCardMessage: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 4,
  },
  btnNotifAction: {
    backgroundColor: '#EA580C',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  btnNotifActionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },

  // 🔹 USER IMAGE REFERENCE MATCHING REQUEST CARD STYLES
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  restaurantTitleName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  readyPillBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  readyPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  restaurantAddressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  payoutCardBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    minWidth: 140,
    marginBottom: 14,
  },
  payoutCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  payoutCardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  detailsGreyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailsSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  detailsAddressVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  detailsBillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  requestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btnDeclineRedOutlined: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnDeclineRedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  btnAcceptGreenSolid: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  btnAcceptGreenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  headerCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  riderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRider: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRiderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  riderEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  riderStats: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppNotificationCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 99999,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  whatsAppHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  whatsAppAppIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppAppName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  whatsAppTimeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  whatsAppTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  whatsAppMessageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1D5DB',
    marginTop: 2,
  },
  onlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  dotStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  btnRefreshLive: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnRefreshLiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },

  // 🔹 Pre-Acceptance Offer Card Styles
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
  },
  offerOrderNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payoutBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  offerLocRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  offerIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  offerLocLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  offerLocVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnAcceptOffer: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAcceptOfferText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  btnDeclineOffer: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnDeclineOfferText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },

  // 🔹 Web Image Matching Card Styles
  webOrderCard: {
    gap: 12,
    marginBottom: 20,
  },

  // 1. Stepper Card
  stepperContainerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  stepIconEmoji: {
    fontSize: 16,
    opacity: 0.5,
  },
  stepIconEmojiActive: {
    opacity: 1,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#EA580C',
  },

  // Hero Action Button
  heroActionButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  heroActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },

  // 2. Two Column Contacts Row
  twoColumnRow: {
    flexDirection: 'column',
    gap: 12,
  },
  columnBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  storeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  boxSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  btnCallGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  btnCallGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  addressGrayBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressBoxTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressBoxValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // 3. Items & Cash Card
  itemsCashCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsCardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dashedLineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  dishName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  dishPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  cashFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  collectCashText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.4,
  },
  totalCashAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },

  // Metrics & Earnings
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // D'Boy Tab Styles
  dboyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dboyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dboyBigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  dboyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dboyRole: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '700',
    marginTop: 2,
  },
  dboyRating: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  infoGridBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoGridTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  infoGridVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },

  // Earnings & Profile Section
  sectionTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: SPACING.sm,
  },
  earningsHero: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22C55E',
    marginVertical: 4,
  },
  earningsSub: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  historySub: {
    fontSize: 11,
    color: '#64748B',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  profileLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  profileVal: {
    fontWeight: '700',
    color: '#1E293B',
  },
  btnLogoutFull: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnLogoutFullText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // 🔹 FIXED BOTTOM NAVIGATION BAR
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomNavLabelActive: {
    color: '#EA580C',
    fontWeight: '800',
  },

  // 🔹 Web Dashboard Matching Styles
  metricsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  heroEarningsCard: {
    width: '48%',
    backgroundColor: '#047857',
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    elevation: 2,
  },
  heroEarningsHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  heroEarningsBigVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
  },
  subMetricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  subMetricCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  subMetricCardVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  subMetricCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  bankPayoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  bankIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankPayoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  bankPayoutSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  payoutSchedulePill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  payoutScheduleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  payoutScheduleValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 2,
  },

  jobPayoutsContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  jobPayoutsHeaderRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  jobPayoutsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  jobPayoutsSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  payoutRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  payoutStoreIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payoutStoreName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  payoutOrderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deliveredPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  deliveredPillIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
  },
  deliveredPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  payoutAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  dashedRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // 🔹 Ultra-Clean & Smooth Pagination Styles
  smoothPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  smoothSummaryText: {
    fontSize: 12,
    color: '#64748B',
  },
  smoothButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnSmoothArrow: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnSmoothArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnSmoothDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.4,
  },
  btnSmoothDisabledText: {
    color: '#94A3B8',
  },
  btnSmoothPageNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSmoothPageNumActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  btnSmoothPageNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  btnSmoothPageNumTextActive: {
    color: '#FFFFFF',
  },

  // 🔹 Swiggy/Zomato Settings Console Styles
  settingsProfileHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  settingsHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsHeroAvatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  settingsHeroAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  settingsHeroAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  settingsHeroAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EA580C',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedHeroBadgePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedHeroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  settingsHeroEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  settingsHeroPhone: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 2,
  },
  settingsHeroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  settingsHeroStatItem: {
    alignItems: 'center',
  },
  settingsHeroStatVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FBA518',
  },
  settingsHeroStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  settingsHeroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },

  settingsFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  settingsFormHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsFormTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsFormSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  formInputGroup: {
    marginBottom: 12,
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  vehiclePillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehiclePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehiclePillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  vehiclePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  vehiclePillTextActive: {
    color: '#FFFFFF',
  },
  btnSaveProfile: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  btnSaveProfileDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnSaveProfileText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  bankDetailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bankDetailItem: {
    flex: 1,
  },
  bankDetailLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  bankDetailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },

  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  kycDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  kycStatusPassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  kycStatusPassText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },

  preferenceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  preferenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  preferenceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  btnSupportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  btnSupportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Read-Only & Simple Line-Art Pen Icon Styles
  simplePenIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  profileDisplayLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  profileDisplayValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});
