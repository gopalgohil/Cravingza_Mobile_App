// @ts-nocheck
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  showArrow?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  showArrow = true,
  disabled,
  style,
  ...props
}) => {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSecondary && styles.buttonSecondary,
        isOutline && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? COLORS.primary : COLORS.white} />
      ) : (
        <View style={styles.contentRow}>
          <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
          {showArrow && (
            <Text style={[styles.arrow, isOutline && styles.textOutline]}> →</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  arrow: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  textOutline: {
    color: COLORS.textDark,
  },
});
