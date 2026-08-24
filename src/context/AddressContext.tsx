import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAddressesApi, addAddressApi, UserAddressPayload } from '../features/customer/services/customerApi';
import { getAuthToken } from '../services/apiClient';

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

export const setAddressesFromLogin = (rawAddresses: any[]) => {
  if (Array.isArray(rawAddresses) && rawAddresses.length > 0) {
    const formatted: AddressItem[] = rawAddresses.map((a: any) => ({
      id: a._id || a.id,
      label: a.label || 'Home',
      addressLine: a.addressLine || a.street || '',
      city: a.city || 'Noida',
      pincode: a.pincode || a.zipCode || '201301',
      isDefault: !!a.isDefault,
    }));
    memoryAddresses = formatted;
    memorySelectedAddress = formatted.find((a) => a.isDefault) || formatted[0];
  }
};

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAddress, setSelectedAddressState] = useState<AddressItem | null>(memorySelectedAddress);
  const [savedAddresses, setSavedAddressesState] = useState<AddressItem[]>(memoryAddresses);

  const setSelectedAddress = (addr: AddressItem | null) => {
    memorySelectedAddress = addr;
    setSelectedAddressState(addr);
  };

  const setSavedAddresses = (addrs: AddressItem[]) => {
    memoryAddresses = addrs;
    setSavedAddressesState(addrs);
  };

  const fetchUserAddresses = async () => {
    if (!getAuthToken()) {
      return;
    }
    try {
      const res = await getAddressesApi();
      console.log('Fetched User Addresses API Response:', res);
      const apiAddresses = res?.data || res;
      if (Array.isArray(apiAddresses) && apiAddresses.length > 0) {
        const formatted: AddressItem[] = apiAddresses.map((a: any) => ({
          id: a._id || a.id,
          label: a.label || 'Home',
          addressLine: a.addressLine || a.street || '',
          city: a.city || 'Noida',
          pincode: a.pincode || a.zipCode || '201301',
          isDefault: !!a.isDefault,
        }));
        setSavedAddresses(formatted);

        const defaultAddr = formatted.find((a) => a.isDefault) || formatted[0];
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (err: any) {
      console.log('Fetch Addresses API Note:', err.message);
    }
  };

  useEffect(() => {
    if (getAuthToken()) {
      fetchUserAddresses();
    }
  }, []);

  const saveNewAddress = async (newAddr: UserAddressPayload) => {
    try {
      const res = await addAddressApi(newAddr);
      console.log('Add Address API Response:', res);
      const updated = res?.data || res;
      if (Array.isArray(updated) && updated.length > 0) {
        const formatted: AddressItem[] = updated.map((a: any) => ({
          id: a._id || a.id,
          label: a.label || 'Home',
          addressLine: a.addressLine || a.street || '',
          city: a.city || 'Noida',
          pincode: a.pincode || a.zipCode || '201301',
          isDefault: !!a.isDefault,
        }));
        setSavedAddresses(formatted);
        const lastAdded = formatted[formatted.length - 1];
        if (lastAdded) setSelectedAddress(lastAdded);
      } else {
        const created: AddressItem = {
          id: `addr_${Date.now()}`,
          label: newAddr.label || 'Home',
          addressLine: newAddr.addressLine,
          city: newAddr.city,
          pincode: newAddr.pincode || '201301',
          isDefault: !!newAddr.isDefault,
        };
        setSavedAddresses((prev) => [...prev, created]);
        setSelectedAddress(created);
      }
    } catch (err: any) {
      console.log('Save Address Error, adding locally:', err.message);
      const created: AddressItem = {
        id: `addr_${Date.now()}`,
        label: newAddr.label || 'Home',
        addressLine: newAddr.addressLine,
        city: newAddr.city,
        pincode: newAddr.pincode || '201301',
        isDefault: !!newAddr.isDefault,
      };
      setSavedAddresses((prev) => [...prev, created]);
      setSelectedAddress(created);
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
