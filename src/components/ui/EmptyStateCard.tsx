// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';
import { CustomButton } from './CustomButton';

export interface EmptyStateCardProps {
  icon?: string | React.ReactNode;
  title: string;
  message: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = React.memo(({
  icon = '🔔',
  title,
  message,
  buttonTitle,
  onButtonPress,
  style,
  titleStyle,
  messageStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {typeof icon === 'string' ? (
          <Text style={styles.iconText}>{icon}</Text>
        ) : (
          icon
        )}
      </View>

      <Text style={[styles.title, titleStyle]} numberOfLines={2}>
        {title}
      </Text>

      <Text style={[styles.message, messageStyle]} numberOfLines={3}>
        {message}
      </Text>

      {!!buttonTitle && onButtonPress && (
        <CustomButton
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.actionBtn}
          showArrow={false}
        />
      )}
    </View>
  );
});

EmptyStateCard.displayName = 'EmptyStateCard';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  actionBtn: {
    minWidth: 160,
    height: 46,
    borderRadius: 12,
  },
});
