// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

export interface NotificationItem {
  id: string;
  _id?: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  read: boolean;
  type?: 'order_update' | 'promo' | 'system' | 'application' | string;
  orderId?: string;
  link?: string;
}

export interface NotificationCardProps {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = React.memo(({
  item,
  onPress,
}) => {
  const isOrder = item.type === 'order_update' || item.type === 'order' || item.orderId;
  const isPromo = item.type === 'promo';

  let iconEmoji = '🔔';
  let badgeBg = '#FFEDD5';

  if (isOrder) {
    iconEmoji = '🛵';
    badgeBg = '#DCFCE7';
  } else if (isPromo) {
    iconEmoji = '🎉';
    badgeBg = '#FEF3C7';
  }

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.unreadNotifCard]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: badgeBg }]}>
        <Text style={styles.iconEmoji}>{iconEmoji}</Text>
      </View>

      <View style={styles.notifContentBox}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, !item.read && styles.unreadTitleText]}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.notifMessage}>{item.message}</Text>

        <View style={styles.notifFooterRow}>
          <Text style={styles.timeText}>{item.time || 'Recently'}</Text>

          {isOrder && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => onPress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionChipText}>Track Order →</Text>
            </TouchableOpacity>
          )}
          {isPromo && (
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: '#FFFBEB' }]}
              onPress={() => onPress(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionChipText, { color: '#D97706' }]}>View Offers →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

NotificationCard.displayName = 'NotificationCard';

const styles = StyleSheet.create({
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  unreadNotifCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  iconEmoji: {
    fontSize: 20,
  },
  notifContentBox: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: FONT_SIZE.md - 1,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  unreadTitleText: {
    fontWeight: '800',
    color: COLORS.textDark,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: FONT_SIZE.xs - 1,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionChip: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionChipText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '700',
    color: '#16A34A',
  },
});
