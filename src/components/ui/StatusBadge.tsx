// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONT_SIZE } from '../../utils/theme';

export type StatusType =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'veg'
  | 'non_veg'
  | 'discount'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  variant?: 'pill' | 'chip' | 'card' | 'dot';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

interface StatusConfig {
  bgColor: string;
  textColor: string;
  borderColor?: string;
  defaultLabel: string;
  defaultIcon?: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  placed: { bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#BFDBFE', defaultLabel: 'Placed', defaultIcon: '📋' },
  accepted: { bgColor: '#EFF6FF', textColor: '#1D4ED8', borderColor: '#93C5FD', defaultLabel: 'Accepted', defaultIcon: '👍' },
  preparing: { bgColor: '#FFFBEB', textColor: '#D97706', borderColor: '#FDE68A', defaultLabel: 'Preparing', defaultIcon: '👨‍🍳' },
  ready_for_pickup: { bgColor: '#F0FDF4', textColor: '#16A34A', borderColor: '#BBF7D0', defaultLabel: 'Ready', defaultIcon: '📦' },
  picked_up: { bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#BFDBFE', defaultLabel: 'Picked Up', defaultIcon: '🛵' },
  out_for_delivery: { bgColor: '#FAF5FF', textColor: '#9333EA', borderColor: '#E9D5FF', defaultLabel: 'Out for Delivery', defaultIcon: '🛵' },
  delivered: { bgColor: '#F0FDF4', textColor: '#15803D', borderColor: '#86EFAC', defaultLabel: 'Delivered', defaultIcon: '✅' },
  cancelled: { bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5', defaultLabel: 'Cancelled', defaultIcon: '❌' },
  pending: { bgColor: '#FFFBEB', textColor: '#D97706', borderColor: '#FDE68A', defaultLabel: 'Pending', defaultIcon: '⏳' },
  approved: { bgColor: '#F0FDF4', textColor: '#16A34A', borderColor: '#86EFAC', defaultLabel: 'Approved', defaultIcon: '✓' },
  rejected: { bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5', defaultLabel: 'Rejected', defaultIcon: '✕' },
  active: { bgColor: '#F0FDF4', textColor: '#16A34A', borderColor: '#86EFAC', defaultLabel: 'Active', defaultIcon: '🟢' },
  inactive: { bgColor: '#F1F5F9', textColor: '#64748B', borderColor: '#CBD5E1', defaultLabel: 'Inactive', defaultIcon: '⚪' },
  veg: { bgColor: '#F0FDF4', textColor: '#16A34A', borderColor: '#16A34A', defaultLabel: 'VEG', defaultIcon: '🟢' },
  non_veg: { bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#DC2626', defaultLabel: 'NON-VEG', defaultIcon: '🔴' },
  discount: { bgColor: '#FEF2F2', textColor: '#E11D48', borderColor: '#FECDD3', defaultLabel: 'OFFER', defaultIcon: '🏷️' },
  success: { bgColor: '#F0FDF4', textColor: '#15803D', borderColor: '#86EFAC', defaultLabel: 'Success' },
  danger: { bgColor: '#FEF2F2', textColor: '#DC2626', borderColor: '#FCA5A5', defaultLabel: 'Danger' },
  warning: { bgColor: '#FFFBEB', textColor: '#D97706', borderColor: '#FDE68A', defaultLabel: 'Warning' },
  info: { bgColor: '#EFF6FF', textColor: '#2563EB', borderColor: '#BFDBFE', defaultLabel: 'Info' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({
  status,
  label,
  variant = 'pill',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const normalizedKey = String(status).toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG_MAP[normalizedKey] || {
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#E2E8F0',
    defaultLabel: String(status),
  };

  const displayLabel = label || config.defaultLabel;
  const displayIcon = icon !== undefined ? icon : config.defaultIcon;

  const sizeStyles = {
    sm: { paddingVertical: 2, paddingHorizontal: 6, fontSize: FONT_SIZE.xs - 2, borderRadius: 6 },
    md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: FONT_SIZE.xs, borderRadius: 10 },
    lg: { paddingVertical: 6, paddingHorizontal: 14, fontSize: FONT_SIZE.sm, borderRadius: 12 },
  }[size];

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor || config.bgColor,
          borderWidth: variant === 'chip' || status === 'veg' || status === 'non_veg' ? 1 : 0,
        },
        sizeStyles,
        variant === 'dot' && styles.dotContainer,
        style,
      ]}
    >
      {!!displayIcon && <Text style={styles.iconText}>{displayIcon} </Text>}
      <Text
        style={[
          styles.labelText,
          { color: config.textColor, fontSize: sizeStyles.fontSize },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayLabel}
      </Text>
    </View>
  );
});

StatusBadge.displayName = 'StatusBadge';

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dotContainer: {
    borderRadius: 999,
  },
  iconText: {
    fontSize: FONT_SIZE.xs,
  },
  labelText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
