// @ts-nocheck
// Cravingza Real-Time Order Sync Store
// Bridges Restaurant Admin status changes (e.g. "out_for_delivery", "preparing")
// with Delivery Partner layout & push notifications.

type OrderSyncListener = () => void;

let listeners: OrderSyncListener[] = [];
let customerNotifListeners: ((notif: any) => void)[] = [];
let sharedCustomerNotifs: any[] = [];

// Shared fallback cache for seamless local testing & live API sync
let sharedOrders: any[] = [];
let sharedDeclinedOrderIds: string[] = [];

export const getSharedOrders = () => sharedOrders;

export const getSharedCustomerNotifs = () => sharedCustomerNotifs;

export const getSharedDeclinedOrderIds = () => sharedDeclinedOrderIds;

export const addSharedDeclinedOrderId = (orderId: string) => {
  if (orderId && !sharedDeclinedOrderIds.includes(String(orderId))) {
    sharedDeclinedOrderIds.push(String(orderId));
  }
};

export const setSharedOrders = (orders: any[], notify = false) => {
  if (Array.isArray(orders) && orders.length > 0) {
    // Merge new API orders with shared memory
    orders.forEach((newOrd) => {
      const newId = newOrd._id || newOrd.id;
      const idx = sharedOrders.findIndex((o) => (o._id || o.id) === newId);
      if (idx !== -1) {
        sharedOrders[idx] = { ...sharedOrders[idx], ...newOrd };
      } else {
        sharedOrders.unshift(newOrd);
      }
    });
    if (notify) {
      notifyOrderSyncListeners();
    }
  }
};

export const updateSharedOrderStatus = (orderId: string, status: string) => {
  if (!orderId) return;
  const idx = sharedOrders.findIndex((o) => (o._id || o.id) === orderId);
  let ordNum = orderId;
  let restName = 'Burger Boss';

  if (idx !== -1) {
    sharedOrders[idx] = {
      ...sharedOrders[idx],
      status: status,
      updatedAt: new Date().toISOString(),
    };
    ordNum = sharedOrders[idx].orderNumber || `#CRV-${String(orderId).slice(-4).toUpperCase()}`;
    restName = sharedOrders[idx].restaurant?.name || sharedOrders[idx].restaurantName || 'italian';
  } else {
    sharedOrders.unshift({
      _id: orderId,
      status: status,
      updatedAt: new Date().toISOString(),
    });
  }

  // 🔹 Trigger Live Customer Notification when Restaurant Admin accepts / updates order
  const stLower = status.toLowerCase();
  let notifTitle = '';
  let notifMsg = '';

  if (stLower === 'preparing') {
    notifTitle = `👨‍🍳 Order Accepted by ${restName}!`;
    notifMsg = `Order ${ordNum} has been accepted & is now being freshly prepared!`;
  } else if (stLower === 'ready') {
    notifTitle = `📦 Order Ready at ${restName}!`;
    notifMsg = `Order ${ordNum} is ready! Delivery partner has been assigned for pickup.`;
  } else if (stLower === 'out_for_delivery') {
    notifTitle = `🛵 Order Out for Delivery!`;
    notifMsg = `Delivery partner is on the way with your delicious meal for Order ${ordNum}.`;
  } else if (stLower === 'cancelled' || stLower === 'rejected') {
    notifTitle = `❌ Order Declined by ${restName}`;
    notifMsg = `We're sorry, your order ${ordNum} was declined by ${restName}.`;
  }

  if (notifTitle) {
    const notifObj = {
      id: `c_notif_${Date.now()}`,
      orderId,
      status,
      title: notifTitle,
      message: notifMsg,
      time: 'Just now',
    };
    sharedCustomerNotifs.unshift(notifObj);
    customerNotifListeners.forEach((fn) => fn(notifObj));
  }

  notifyOrderSyncListeners();
};

export const subscribeOrderSync = (listener: OrderSyncListener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

export const subscribeCustomerNotif = (listener: (notif: any) => void) => {
  customerNotifListeners.push(listener);
  return () => {
    customerNotifListeners = customerNotifListeners.filter((l) => l !== listener);
  };
};

const notifyOrderSyncListeners = () => {
  listeners.forEach((l) => l());
};
