import { apiClient } from '../../../services/apiClient';

// 1. Get Super Admin Dashboard Analytics -> GET /api/admin/dashboard
export const getAdminDashboardApi = async () => {
  return await apiClient('/admin/dashboard');
};

// 2. Get All Restaurant Applications -> GET /api/admin/restaurants?status=all
export const getAdminRestaurantsApi = async (status: string = 'all') => {
  return await apiClient(`/admin/restaurants?status=${status}`);
};

// 3. Approve Restaurant Application -> PATCH /api/admin/restaurants/:id/approve
export const approveRestaurantApi = async (id: string) => {
  return await apiClient(`/admin/restaurants/${id}/approve`, {
    method: 'PATCH',
  });
};

// 4. Reject Restaurant Application -> PATCH /api/admin/restaurants/:id/reject
export const rejectRestaurantApi = async (id: string, reason?: string) => {
  return await apiClient(`/admin/restaurants/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason: reason || 'Documents invalid or incomplete' }),
  });
};

// 5. Get Delivery Partner Applications -> GET /api/admin/delivery?status=all
export const getAdminDeliveryProfilesApi = async (status: string = 'all') => {
  return await apiClient(`/admin/delivery?status=${status}`);
};

// 6. Approve Delivery Partner Application -> PATCH /api/admin/delivery/:id/approve
export const approveDeliveryPartnerApi = async (id: string) => {
  return await apiClient(`/admin/delivery/${id}/approve`, {
    method: 'PATCH',
  });
};

// 7. Reject Delivery Partner Application -> PATCH /api/admin/delivery/:id/reject
export const rejectDeliveryPartnerApi = async (id: string, reason?: string) => {
  return await apiClient(`/admin/delivery/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejectionReason: reason || 'KYC documents unverified' }),
  });
};

// 8. Get Platform Users by Role -> GET /api/admin/users?role=customer|owner|delivery
export const getAdminUsersApi = async (role: string = 'customer') => {
  return await apiClient(`/admin/users?role=${role}`);
};

// 9. Update User Account Status (Block/Unblock) -> PATCH /api/admin/users/:id/status
export const updateUserStatusApi = async (id: string, status: 'active' | 'blocked') => {
  return await apiClient(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// 10. Get Platform Settings -> GET /api/admin/settings
export const getAdminSettingsApi = async () => {
  return await apiClient('/admin/settings');
};

// 11. Update Platform Settings -> PATCH /api/admin/settings
export const updateAdminSettingsApi = async (settingsPayload: any) => {
  return await apiClient('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(settingsPayload),
  });
};

// 12. Get Live Admin Analytics Stats -> GET /api/admin/analytics-stats?range=...
export const getAdminAnalyticsStatsApi = async (range: string = 'Last 30 Days') => {
  return await apiClient(`/admin/analytics-stats?range=${encodeURIComponent(range)}`);
};

// 13. Update Admin Password -> PATCH /api/user/password
export const updateAdminPasswordApi = async (payload: { currentPassword: string; newPassword: string }) => {
  return await apiClient('/user/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
