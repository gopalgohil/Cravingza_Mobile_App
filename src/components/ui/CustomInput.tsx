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
import Svg, { Path, Circle, Line } from 'react-native-svg';
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
const EyeIcon = ({ size = 20, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

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
        {leftIcon ? <Text style={styles.leftIcon}>{leftIcon}</Text> : null}
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
