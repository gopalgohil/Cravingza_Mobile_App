// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../../components/ui/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { resetPasswordApi } from '../services/authApi';

export const ResetPasswordScreen = ({ route, navigation }: any) => {
  const email = route?.params?.email || 'user@example.com';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const fullOtp = otp.join('');

    if (fullOtp.length < 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP received on your email.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please enter and confirm your new password.');
      return;
    }

    // Password Complexity Check (Zod Backend Requirement)
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      Alert.alert(
        'Password Requirements',
        'Password must contain at least:\n• One Uppercase letter (A-Z)\n• One Lowercase letter (a-z)\n• One Number (0-9)\n• One Special character (!@#$%^&*)\n\nExample: Pass@1234'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending Reset Password Request for email:', email);
      const res = await resetPasswordApi({
        email,
        otp: fullOtp,
        password: newPassword,
        confirmPassword,
      });

      console.log('Reset Password Success:', res);
      Alert.alert(
        'Password Reset Successful 🎉',
        res.message || 'Your password has been reset! Please log in with your new password.'
      );
      navigation.replace('Login');
    } catch (error: any) {
      console.log('Reset Password Error:', error.message);
      Alert.alert('Reset Failed', error.message || 'Invalid OTP or failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Curved Hero Banner Header */}
          <View style={styles.curvedHeroHeader}>
            <Text style={styles.heroBrandName}>Cravingza</Text>
            <Text style={styles.heroSubtitle}>Set your new account password</Text>
          </View>

          {/* Elevated Card Container */}
          <View style={styles.cardContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP code sent to {'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            {/* 6 Digit OTP Inputs */}
            <Text style={styles.otpLabel}>Enter 6-Digit OTP Code:</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* New Password & Confirm Password */}
            <CustomInput
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              isPassword
              leftIcon="🔒"
            />

            <CustomInput
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              leftIcon="🔒"
            />

            {/* Reset Password CTA Button */}
            <CustomButton
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              showArrow
              style={styles.resetBtn}
            />
          </View>

          {/* Footer Back to Login Link */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backBtnText}>← Cancel & Back to Log In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  curvedHeroHeader: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 10,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBrandName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md + 4,
    marginTop: -24,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '800',
    color: '#431407',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: '#78350F',
    marginTop: 6,
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  otpLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 6,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  otpBox: {
    width: 42,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#431407',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  resetBtn: {
    marginTop: SPACING.sm,
    borderRadius: 14,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
