import { apiClient } from '../../../services/apiClient';

export const getRestaurantsApi = async (searchQuery?: string) => {
  const endpoint =
    searchQuery && searchQuery.trim().length > 0
      ? `/restaurants?search=${encodeURIComponent(searchQuery.trim())}`
      : '/restaurants';
  return apiClient(endpoint);
};

export const getRestaurantByIdApi = async (restaurantId: string) => {
  return apiClient(`/restaurants/${restaurantId}`);
};

export const getUserOrdersApi = async () => {
  return apiClient('/orders');
};

export const getOrderByIdApi = async (orderId: string) => {
  return apiClient(`/orders/${orderId}`);
};

export interface OrderItemPayload {
  menuItem: string;
  name?: string;
  price?: number;
  quantity: number;
}

export interface CreateOrderPayload {
  restaurant: string;
  items: OrderItemPayload[];
  deliveryAddress: {
    addressLine?: string;
    street: string;
    city: string;
    zipCode?: string;
  };
  paymentMethod?: 'COD' | 'ONLINE' | string;
}

// 5. Create Order API -> POST /api/orders
export const createOrderApi = async (payload: CreateOrderPayload) => {
  return apiClient('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 6. Get Offers & Promo Codes API -> GET /api/offers
export const getOffersApi = async () => {
  return apiClient('/offers');
};

export interface ApplyCouponPayload {
  code: string;
  cartTotal: number;
}

// 7. Apply Coupon API -> POST /api/coupons/apply
export const applyCouponApi = async (payload: ApplyCouponPayload) => {
  return apiClient('/coupons/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export interface CreateRazorpayOrderPayload {
  couponCode?: string;
  restaurant?: string;
  items?: OrderItemPayload[];
}

export interface VerifyRazorpayPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  deliveryAddress: {
    addressLine: string;
    city?: string;
    zipCode?: string;
  };
  couponCode?: string;
}

// 8. Create Razorpay Order API -> POST /api/payment/create-razorpay-order
export const createRazorpayOrderApi = async (payload?: CreateRazorpayOrderPayload) => {
  return apiClient('/payment/create-razorpay-order', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
};

// 9. Verify Razorpay Payment API -> POST /api/payment/verify
export const verifyRazorpayPaymentApi = async (payload: VerifyRazorpayPaymentPayload) => {
  return apiClient('/payment/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 10. Add To Cart API -> POST /api/cart/add
export const addToCartApi = async (menuItemId: string, quantity: number = 1) => {
  return apiClient('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ menuItemId, quantity }),
  });
};

export interface UserAddressPayload {
  id?: string;
  label?: 'Home' | 'Work' | 'Other' | string;
  addressLine: string;
  city: string;
  pincode?: string;
  isDefault?: boolean;
}

// 11. Get Saved User Addresses API -> GET /api/user/addresses
export const getAddressesApi = async () => {
  return apiClient('/user/addresses');
};

// 12. Add New Address API -> POST /api/user/addresses
export const addAddressApi = async (payload: UserAddressPayload) => {
  return apiClient('/user/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// 13. Update Address API -> PATCH /api/user/addresses/:id
export const updateAddressApi = async (addressId: string, payload: Partial<UserAddressPayload>) => {
  return apiClient(`/user/addresses/${addressId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

// 14. Delete Address API -> DELETE /api/user/addresses/:id
export const deleteAddressApi = async (addressId: string) => {
  return apiClient(`/user/addresses/${addressId}`, {
    method: 'DELETE',
  });
};




