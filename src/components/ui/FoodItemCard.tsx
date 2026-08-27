// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';
import { StatusBadge } from './StatusBadge';
import { ContainerCard } from './ContainerCard';

export interface FoodItemData {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  isVeg?: boolean;
  category?: string;
}

export interface FoodItemCardProps {
  item: FoodItemData;
  quantity?: number;
  onAdd: (item: FoodItemData) => void;
  onIncrement?: (item: FoodItemData) => void;
  onDecrement?: (item: FoodItemData) => void;
  onPress?: (item: FoodItemData) => void;
  style?: StyleProp<ViewStyle>;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = React.memo(({
  item,
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  onPress,
  style,
}) => {
  const imageUrl = item.imageUrl || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  const isVeg = item.isVeg !== undefined ? item.isVeg : true;

  return (
    <ContainerCard
      variant="elevated"
      padding="md"
      style={[styles.container, style]}
      onPress={onPress ? () => onPress(item) : undefined}
    >
      <View style={styles.leftContent}>
        <StatusBadge status={isVeg ? 'veg' : 'non_veg'} size="sm" style={styles.vegBadge} />

        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.price}>
          ₹{item.price}
        </Text>

        {!!item.description && (
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.rightContent}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

        <View style={styles.actionWrapper}>
          {quantity > 0 ? (
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => onDecrement ? onDecrement(item) : undefined}
                activeOpacity={0.8}
              >
                <Text style={styles.counterText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => onIncrement ? onIncrement(item) : onAdd(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.counterText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAdd(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>ADD +</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ContainerCard>
  );
});

FoodItemCard.displayName = 'FoodItemCard';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  leftContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  vegBadge: {
    marginBottom: 4,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  price: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  description: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    lineHeight: 16,
  },
  rightContent: {
    width: 110,
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 110,
    height: 95,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  actionWrapper: {
    position: 'absolute',
    bottom: -10,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: COLORS.primary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    elevation: 3,
  },
  counterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  counterText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.white,
  },
  quantityNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.white,
    paddingHorizontal: 6,
  },
});
