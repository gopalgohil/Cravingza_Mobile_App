// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';
import { ContainerCard } from './ContainerCard';

export interface RestaurantItemData {
  id?: string;
  _id?: string;
  name: string;
  image?: string;
  coverImageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  deliveryTime?: string;
  deliveryFee?: number | string;
  cuisineTags?: string[];
  offerText?: string;
  isPromoted?: boolean;
}

export interface RestaurantCardProps {
  restaurant: RestaurantItemData;
  onPress: (restaurant: RestaurantItemData) => void;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = React.memo(({
  restaurant,
  onPress,
  onFavoriteToggle,
  isFavorite = false,
  style,
}) => {
  const restaurantId = restaurant._id || restaurant.id || '';
  const imageUrl = restaurant.coverImageUrl || restaurant.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
  const rating = restaurant.rating || 4.5;
  const deliveryTime = restaurant.deliveryTime || '25-35 min';
  const feeDisplay = typeof restaurant.deliveryFee === 'number' ? (restaurant.deliveryFee === 0 ? 'Free Delivery' : `₹${restaurant.deliveryFee} delivery`) : (restaurant.deliveryFee || 'Free Delivery');
  const cuisines = Array.isArray(restaurant.cuisineTags) && restaurant.cuisineTags.length > 0 ? restaurant.cuisineTags.slice(0, 3).join(' • ') : 'North Indian • Fast Food';

  return (
    <ContainerCard
      variant="elevated"
      padding="none"
      style={[styles.card, style]}
      onPress={() => onPress(restaurant)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {!!restaurant.offerText && (
          <View style={styles.offerTag}>
            <Text style={styles.offerText}>🏷️ {restaurant.offerText}</Text>
          </View>
        )}

        {!!onFavoriteToggle && (
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => onFavoriteToggle(restaurantId)}
            activeOpacity={0.8}
          >
            <Text style={styles.heartIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <Text style={styles.cuisines} numberOfLines={1} ellipsizeMode="tail">
          {cuisines}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⏱️ {deliveryTime}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>🛵 {feeDisplay}</Text>
        </View>
      </View>
    </ContainerCard>
  );
});

RestaurantCard.displayName = 'RestaurantCard';

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  offerTag: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(225, 29, 72, 0.95)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  heartButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 16,
  },
  content: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '800',
    color: COLORS.textDark,
    flex: 1,
    marginRight: SPACING.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  starIcon: {
    fontSize: 11,
    marginRight: 2,
  },
  ratingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    color: '#15803D',
  },
  cuisines: {
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#64748B',
  },
  metaDot: {
    marginHorizontal: 6,
    color: '#94A3B8',
  },
});
