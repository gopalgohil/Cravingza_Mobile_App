// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/theme';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: string;
  headerActionText?: string;
  onHeaderActionPress?: () => void;
  isPassword?: boolean;
}

// Clean Vector SVG Eye Icon (Password Hidden / Visible)
const EyeIcon = ({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

// 🎨 SVG Vector Input Icons matching Home Tab Navigation Style
const renderInputLeftSvgIcon = (iconName?: string) => {
  if (!iconName) return null;
  const iconStr = String(iconName).toLowerCase();
  const color = '#EA580C'; // Primary Cravingza Accent
  const size = 18;

  // 1. User / Name Icon
  if (iconStr.includes('user') || iconStr.includes('name') || iconStr.includes('👤')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      </View>
    );
  }

  // 2. Email Address Icon
  if (iconStr.includes('email') || iconStr.includes('mail') || iconStr.includes('✉️')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <Polyline points="22,6 12,13 2,6" />
        </Svg>
      </View>
    );
  }

  // 3. Phone Number Icon
  if (iconStr.includes('phone') || iconStr.includes('call') || iconStr.includes('📞')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
      </View>
    );
  }

  // 4. Lock / Password Icon
  if (iconStr.includes('lock') || iconStr.includes('pass') || iconStr.includes('🔒')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      </View>
    );
  }

  // 5. Store Front Icon
  if (iconStr.includes('store') || iconStr.includes('restaurant') || iconStr.includes('🏪')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </Svg>
      </View>
    );
  }

  // 6. Pin Location Icon
  if (iconStr.includes('location') || iconStr.includes('pin') || iconStr.includes('address') || iconStr.includes('📍')) {
    return (
      <View style={styles.svgIconBox}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <Circle cx="12" cy="10" r="3" />
        </Svg>
      </View>
    );
  }

  return <Text style={styles.leftIcon}>{iconName}</Text>;
};

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  leftIcon,
  headerActionText,
  onHeaderActionPress,
  isPassword = false,
  secureTextEntry,
  ...props
}) => {
  const [hidePassword, setHidePassword] = useState(isPassword);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {headerActionText && onHeaderActionPress ? (
          <TouchableOpacity onPress={onHeaderActionPress}>
            <Text style={styles.headerActionText}>{headerActionText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {renderInputLeftSvgIcon(leftIcon)}
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPassword ? hidePassword : secureTextEntry}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.rightIconBtn}
            activeOpacity={0.7}
          >
            {hidePassword ? (
              <EyeOffIcon size={20} color={COLORS.primary} />
            ) : (
              <EyeIcon size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  headerActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  svgIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 10,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textDark,
    height: '100%',
  },
  rightIconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
});
