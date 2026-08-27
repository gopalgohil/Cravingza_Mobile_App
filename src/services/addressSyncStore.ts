// @ts-nocheck
// Cravingza Persistent Address Sync Store
// Keyed by User ID or Email to keep addresses permanent across Logout & Login (including Google Auth)

import { AddressItem } from '../context/AddressContext';

const userAddressesMap: Record<string, AddressItem[]> = {};
const userSelectedAddressMap: Record<string, AddressItem | null> = {};

export const getUserStoredAddresses = (userKey: string): AddressItem[] => {
  if (!userKey) return [];
  const normalizedKey = userKey.trim().toLowerCase();
  return userAddressesMap[normalizedKey] || [];
};

export const setUserStoredAddresses = (userKey: string, addrs: AddressItem[]) => {
  if (!userKey || !Array.isArray(addrs)) return;
  const normalizedKey = userKey.trim().toLowerCase();
  userAddressesMap[normalizedKey] = addrs;

  const defaultAddr = addrs.find((a) => a.isDefault) || addrs[addrs.length - 1] || null;
  if (defaultAddr) {
    userSelectedAddressMap[normalizedKey] = defaultAddr;
  }
};

export const addStoredAddressForUser = (userKey: string, newAddr: AddressItem): AddressItem[] => {
  if (!userKey) return [newAddr];
  const normalizedKey = userKey.trim().toLowerCase();
  const existing = userAddressesMap[normalizedKey] || [];

  const idx = existing.findIndex((a) => (a.id && a.id === newAddr.id) || (a._id && a._id === newAddr._id));
  let updated: AddressItem[];
  if (idx !== -1) {
    updated = [...existing];
    updated[idx] = { ...updated[idx], ...newAddr };
  } else {
    updated = [...existing, newAddr];
  }

  userAddressesMap[normalizedKey] = updated;
  userSelectedAddressMap[normalizedKey] = newAddr;
  return updated;
};

export const getUserSelectedAddress = (userKey: string): AddressItem | null => {
  if (!userKey) return null;
  const normalizedKey = userKey.trim().toLowerCase();
  return userSelectedAddressMap[normalizedKey] || null;
};
