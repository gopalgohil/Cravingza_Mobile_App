import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignupScreen } from '../features/auth/screens/SignupScreen';
import { VerifyOtpScreen } from '../features/auth/screens/VerifyOtpScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';
import { HomeScreen } from '../features/customer/screens/HomeScreen';
import { RestaurantDetailScreen } from '../features/customer/screens/RestaurantDetailScreen';
import { OrdersScreen } from '../features/customer/screens/OrdersScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { OffersScreen } from '../features/customer/screens/OffersScreen';
import { NotificationsScreen } from '../features/customer/screens/NotificationsScreen';
import { TrackOrderScreen } from '../features/orders/screens/TrackOrderScreen';
import { CheckoutScreen } from '../features/orders/screens/CheckoutScreen';
import { PartnerOnboardingScreen } from '../features/partner/screens/PartnerOnboardingScreen';
import { AdminApprovalsScreen } from '../features/admin/screens/AdminApprovalsScreen';
import { AdminDashboardScreen } from '../features/admin/screens/AdminDashboardScreen';
import { AdminUsersScreen } from '../features/admin/screens/AdminUsersScreen';
import { AdminSettingsScreen } from '../features/admin/screens/AdminSettingsScreen';
import { AdminLayoutScreen } from '../features/admin/screens/AdminLayoutScreen';
import { RestaurantOwnerLayoutScreen } from '../features/restaurant/screens/RestaurantOwnerLayoutScreen';
import { DeliveryPartnerLayoutScreen } from '../features/delivery/screens/DeliveryPartnerLayoutScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  VerifyOtp: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  Home: undefined;
  RestaurantDetail: { restaurantId?: string; restaurantName?: string; coverImage?: string };
  Orders: undefined;
  Profile: undefined;
  Offers: undefined;
  Notifications: undefined;
  TrackOrder: { orderId?: string; orderNumber?: string };
  Checkout: { restaurantId?: string; restaurantName?: string; cartItems?: any[] };
  PartnerOnboarding: { initialMode?: 'restaurant' | 'delivery' };
  AdminApprovals: undefined;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminSettings: undefined;
  AdminLayout: undefined;
  RestaurantOwnerLayout: undefined;
  DeliveryPartnerLayout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { AddressProvider } from '../context/AddressContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export const AppNavigator = () => {
  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Offers" component={OffersScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="PartnerOnboarding" component={PartnerOnboardingScreen} />
              <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
              <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
              <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
              <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
              <Stack.Screen name="AdminLayout" component={AdminLayoutScreen} />
              <Stack.Screen name="RestaurantOwnerLayout" component={RestaurantOwnerLayoutScreen} />
              <Stack.Screen name="DeliveryPartnerLayout" component={DeliveryPartnerLayoutScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  );
};
