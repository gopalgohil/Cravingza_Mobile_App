import React, { createContext, useContext, useState } from 'react';
import { setAuthToken } from '../services/apiClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth } from '@react-native-firebase/auth';
import { setAddressesFromLogin } from './AddressContext';

export interface UserProfileData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

interface AuthContextType {
  currentUser: UserProfileData | null;
  token: string | null;
  setAuthUser: (user: UserProfileData | null, token?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  setAuthUser: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const unsubscribe = getAuth().onAuthStateChanged((fbUser) => {
        if (fbUser && !currentUser) {
          console.log('[AuthContext] Auto-restored Firebase User:', fbUser.email);
          setCurrentUser({
            id: fbUser.uid,
            email: fbUser.email || 'customer@cravingza.com',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cravingza Customer',
            phone: fbUser.phoneNumber || '',
            role: 'customer',
          });
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.log('[AuthContext] Firebase listener note:', err);
    }
  }, []);

  const setAuthUser = (user: UserProfileData | null, userToken?: string | null) => {
    console.log('[AuthContext] Setting Auth User:', user?.email, 'Role:', user?.role);
    setCurrentUser(user);
    if (userToken) {
      setToken(userToken);
      setAuthToken(userToken);
    }
    if (user && Array.isArray((user as any).addresses)) {
      setAddressesFromLogin((user as any).addresses);
    }
  };

  const logout = () => {
    console.log('[AuthContext] Executing Full Logout & Clearing Session Credentials...');
    setCurrentUser(null);
    setToken(null);
    setAuthToken(null);

    // Clean Google Sign-In & Firebase Auth cached sessions
    try {
      GoogleSignin.signOut().catch(() => {});
    } catch (e) {}
    try {
      const fbAuth = getAuth();
      if (fbAuth && fbAuth.currentUser) {
        fbAuth.signOut().catch(() => {});
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, setAuthUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
