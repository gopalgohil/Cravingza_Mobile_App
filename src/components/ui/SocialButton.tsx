// @ts-nocheck
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONT_SIZE } from '../../utils/theme';
import { GoogleIcon, AppleIcon } from './BrandIcons';

interface SocialButtonProps {
  type: 'google' | 'apple';
  onPress?: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ type, onPress }) => {
  const isGoogle = type === 'google';

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isGoogle ? <GoogleIcon size={20} /> : <AppleIcon size={20} color="#0F172A" />}
        </View>
        <Text style={styles.text}>{isGoogle ? 'Google' : 'Apple'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#1E293B',
  },
});
