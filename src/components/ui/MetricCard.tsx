// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';

export interface MetricCardProps {
  icon: string;
  value: string | number;
  label: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(({
  icon,
  value,
  label,
  backgroundColor = '#FFF7ED',
  borderColor = '#FFEDD5',
  style,
  valueStyle,
  labelStyle,
}) => {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

MetricCard.displayName = 'MetricCard';

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  value: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '900',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  label: {
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.textLight,
    fontWeight: '600',
  },
});
