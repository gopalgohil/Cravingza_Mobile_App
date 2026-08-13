// @ts-nocheck
import { apiClient } from '../../../services/apiClient';

// 1. Fetch Owner Dashboard Overview & Live Stats -> GET /api/orders/restaurant-owner/dashboard
export const getOwnerDashboardStatsApi = async () => {
  return await apiClient('/orders/restaurant-owner/dashboard');
};

// 2. Fetch Live Restaurant Orders -> GET /api/orders/restaurant-owner/orders
export const getOwnerOrdersApi = async (status?: string) => {
  const query = status && status !== 'all' ? `?status=${status}` : '';
  return await apiClient(`/orders/restaurant-owner/orders${query}`);
};

// 3. Update Order Status (PREPARING, READY, CANCELLED) -> PATCH /api/orders/:orderId/status
export const updateOrderStatusApi = async (orderId: string, status: string) => {
  return await apiClient(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// 4. Fetch Restaurant Menu Items -> GET /api/restaurants/my-restaurant/menu
export const getOwnerMenuApi = async () => {
  return await apiClient('/restaurants/my-restaurant/menu');
};

// 5. Add New Menu Item -> POST /api/restaurants/my-restaurant/menu
export const addMenuItemApi = async (itemData: {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  isVeg?: boolean;
}) => {
  return await apiClient('/restaurants/my-restaurant/menu', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

// 6. Update Existing Menu Item -> PUT /api/restaurants/my-restaurant/menu/:id
export const updateMenuItemApi = async (id: string, itemData: any) => {
  return await apiClient(`/restaurants/my-restaurant/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
};

// 7. Delete Menu Item -> DELETE /api/restaurants/my-restaurant/menu/:id
export const deleteMenuItemApi = async (id: string) => {
  return await apiClient(`/restaurants/my-restaurant/menu/${id}`, {
    method: 'DELETE',
  });
};

// 8. Toggle Restaurant Online/Offline Status -> PATCH /api/restaurant/status
export const toggleRestaurantStatusApi = async (isOpen: boolean) => {
  return await apiClient('/restaurant/status', {
    method: 'PATCH',
    body: JSON.stringify({ isOpen }),
  });
};
