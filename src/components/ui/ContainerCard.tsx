// @ts-nocheck
import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../utils/theme';

export interface ContainerCardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  activeOpacity?: number;
}

export const ContainerCard: React.FC<ContainerCardProps> = React.memo(({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
  onPress,
  activeOpacity = 0.85,
}) => {
  const paddingStyles = {
    none: { padding: 0 },
    sm: { padding: SPACING.xs + 4 },
    md: { padding: SPACING.md },
    lg: { padding: SPACING.lg },
  }[padding];

  const variantStyles = {
    flat: styles.cardFlat,
    elevated: styles.cardElevated,
    outlined: styles.cardOutlined,
  }[variant];

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.cardBase, variantStyles, paddingStyles, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardBase, variantStyles, paddingStyles, style]}>
      {children}
    </View>
  );
});

ContainerCard.displayName = 'ContainerCard';

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardFlat: {
    backgroundColor: '#F8FAFC',
  },
  cardElevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
