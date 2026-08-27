import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAddressesApi, addAddressApi, UserAddressPayload } from '../features/customer/services/customerApi';
import { getAuthToken } from '../services/apiClient';
import { getAuth } from '@react-native-firebase/auth';
import {
  getUserStoredAddresses,
  setUserStoredAddresses,
  addStoredAddressForUser,
  getUserSelectedAddress,
} from '../services/addressSyncStore';

export interface AddressItem {
  id?: string;
  _id?: string;
  label: 'Home' | 'Work' | 'Other' | string;
  addressLine: string;
  city: string;
  pincode?: string;
  isDefault?: boolean;
}

interface AddressContextType {
  selectedAddress: AddressItem | null;
  setSelectedAddress: (addr: AddressItem | null) => void;
  savedAddresses: AddressItem[];
  fetchUserAddresses: () => Promise<void>;
  saveNewAddress: (addr: UserAddressPayload) => Promise<void>;
}

const AddressContext = createContext<AddressContextType>({
  selectedAddress: null,
  setSelectedAddress: () => {},
  savedAddresses: [],
  fetchUserAddresses: async () => {},
  saveNewAddress: async () => {},
});

let memoryAddresses: AddressItem[] = [];
let memorySelectedAddress: AddressItem | null = null;
let setAddressContextStateClearer: (() => void) | null = null;
let setAddressContextStateSetter: ((addrs: AddressItem[], sel: AddressItem | null) => void) | null = null;

const getActiveUserKey = () => {
  try {
    const fbUser = getAuth().currentUser;
    if (fbUser && fbUser.email) return fbUser.email;
    if (fbUser && fbUser.uid) return fbUser.uid;
  } catch (e) {}
  return 'default_customer';
};

export const clearUserAddresses = () => {
  memoryAddresses = [];
  memorySelectedAddress = null;
  if (setAddressContextStateClearer) {
    setAddressContextStateClearer();
  }
};

export const setAddressesFromLogin = (rawAddresses: any[], userEmail?: string) => {
  const uKey = userEmail || getActiveUserKey();
  if (Array.isArray(rawAddresses) && rawAddresses.length > 0) {
    const formatted: AddressItem[] = rawAddresses.map((a: any) => ({
      id: a._id || a.id || `addr_${Date.now()}`,
      label: a.label || 'Home',
      addressLine: a.addressLine || a.street || '',
      city: a.city || 'Vadodara',
      pincode: a.pincode || a.zipCode || '390023',
      isDefault: !!a.isDefault,
    }));
    memoryAddresses = formatted;
    memorySelectedAddress = formatted.find((a) => a.isDefault) || formatted[0];
    setUserStoredAddresses(uKey, formatted);

    if (setAddressContextStateSetter) {
      setAddressContextStateSetter(memoryAddresses, memorySelectedAddress);
    }
  } else {
    const stored = getUserStoredAddresses(uKey);
    if (stored.length > 0) {
      memoryAddresses = stored;
      memorySelectedAddress = getUserSelectedAddress(uKey) || stored[0];
      if (setAddressContextStateSetter) {
        setAddressContextStateSetter(memoryAddresses, memorySelectedAddress);
      }
    }
  }
};

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAddress, setSelectedAddressState] = useState<AddressItem | null>(memorySelectedAddress);
  const [savedAddresses, setSavedAddressesState] = useState<AddressItem[]>(memoryAddresses);

  useEffect(() => {
    setAddressContextStateClearer = () => {
      setSelectedAddressState(null);
      setSavedAddressesState([]);
    };
    setAddressContextStateSetter = (addrs, sel) => {
      setSavedAddressesState(addrs);
      setSelectedAddressState(sel);
    };
    return () => {
      setAddressContextStateClearer = null;
      setAddressContextStateSetter = null;
    };
  }, []);

  const setSelectedAddress = (addr: AddressItem | null) => {
    memorySelectedAddress = addr;
    setSelectedAddressState(addr);
  };

  const setSavedAddresses = (addrs: AddressItem[]) => {
    memoryAddresses = addrs;
    setSavedAddressesState(addrs);
    const uKey = getActiveUserKey();
    setUserStoredAddresses(uKey, addrs);
  };

  const fetchUserAddresses = async () => {
    const uKey = getActiveUserKey();
    // 1. First restore from permanent store for this user
    const localStored = getUserStoredAddresses(uKey);
    if (localStored && localStored.length > 0) {
      setSavedAddressesState(localStored);
      const sel = getUserSelectedAddress(uKey) || localStored[0];
      setSelectedAddressState(sel);
    }

    // 2. Fetch from Live MongoDB API if token available
    try {
      if (getAuthToken()) {
        const res = await getAddressesApi();
        console.log('Fetched User Addresses API Response:', res);
        const apiAddresses = res?.data || res;
        if (Array.isArray(apiAddresses) && apiAddresses.length > 0) {
          const formatted: AddressItem[] = apiAddresses.map((a: any) => ({
            id: a._id || a.id,
            label: a.label || 'Home',
            addressLine: a.addressLine || a.street || '',
            city: a.city || 'Vadodara',
            pincode: a.pincode || a.zipCode || '390023',
            isDefault: !!a.isDefault,
          }));
          setSavedAddresses(formatted);

          const defaultAddr = formatted.find((a) => a.isDefault) || formatted[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
          }
        }
      }
    } catch (err: any) {
      console.log('Fetch Addresses API Note:', err.message);
    }
  };

  const saveNewAddress = async (newAddr: UserAddressPayload) => {
    const uKey = getActiveUserKey();
    const created: AddressItem = {
      id: `addr_${Date.now()}`,
      label: newAddr.label || 'Home',
      addressLine: newAddr.addressLine,
      city: newAddr.city,
      pincode: newAddr.pincode || '390023',
      isDefault: !!newAddr.isDefault,
    };

    // Save locally to permanent store immediately
    const updatedList = addStoredAddressForUser(uKey, created);
    setSavedAddressesState(updatedList);
    setSelectedAddressState(created);
    memoryAddresses = updatedList;
    memorySelectedAddress = created;

    try {
      const res = await addAddressApi(newAddr);
      console.log('Add Address API Response:', res);
      const updated = res?.data || res;
      if (Array.isArray(updated) && updated.length > 0) {
        const formatted: AddressItem[] = updated.map((a: any) => ({
          id: a._id || a.id,
          label: a.label || 'Home',
          addressLine: a.addressLine || a.street || '',
          city: a.city || 'Vadodara',
          pincode: a.pincode || a.zipCode || '390023',
          isDefault: !!a.isDefault,
        }));
        setSavedAddresses(formatted);
      }
    } catch (err: any) {
      console.log('Save Address API Note (saved locally to store):', err.message);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  return (
    <AddressContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        savedAddresses,
        fetchUserAddresses,
        saveNewAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);
