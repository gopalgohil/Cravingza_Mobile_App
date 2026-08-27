// @ts-nocheck
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryChipProps {
  item: CategoryItem;
  isSelected: boolean;
  onSelect: (categoryName: string) => void;
  style?: ViewStyle;
}

export const CategoryChip: React.FC<CategoryChipProps> = React.memo(({
  item,
  isSelected,
  onSelect,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isSelected && styles.chipSelected,
        style,
      ]}
      onPress={() => onSelect(item.name)}
      activeOpacity={0.8}
    >
      <Text style={styles.iconText}>{item.icon}</Text>
      <Text style={[styles.labelText, isSelected && styles.labelTextSelected]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
});

CategoryChip.displayName = 'CategoryChip';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 20,
    marginRight: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  iconText: {
    fontSize: 16,
    marginRight: 6,
  },
  labelText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  labelTextSelected: {
    color: COLORS.white,
  },
});
