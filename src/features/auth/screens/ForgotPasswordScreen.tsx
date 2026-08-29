// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput } from '../../../components/ui/CustomInput';
import { CustomButton } from '../../../components/ui/CustomButton';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { validateEmail } from '../../../utils/validation';
import { forgotPasswordApi } from '../services/authApi';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setEmailError(null);
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.message || 'Please enter a valid registered email address.');
      return;
    }
    const trimmedEmail = emailCheck.normalizedEmail || email.trim();

    setLoading(true);
    try {
      console.log('Sending Forgot Password OTP Request...', { email: trimmedEmail });
      const res = await forgotPasswordApi({ email: trimmedEmail });
      console.log('Forgot Password Response:', res);

      if (res && (res.success === false || res.error || res.statusCode === 404 || res.status === 404)) {
        throw new Error(res.message || res.error || 'No account registered with this email address.');
      }

      navigation.navigate('ResetPassword', { email: trimmedEmail });
    } catch (error: any) {
      console.log('Forgot Password Error:', error.message);
      setEmailError('No account registered with this email address.');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Curved Hero Banner Header */}
          <View style={styles.curvedHeroHeader}>
            <Text style={styles.heroBrandName}>Cravingza</Text>
            <Text style={styles.heroSubtitle}>Recover your account password</Text>
          </View>

          {/* Centered & Perfectly Balanced Card Container */}
          <View style={styles.cardContainer}>
            {/* Lock Icon Badge */}
            <View style={styles.lockBadge}>
              <Text style={styles.lockIcon}>🔐</Text>
            </View>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address below to receive a 6-digit OTP code to reset your password.
            </Text>

            {/* Email Input */}
            <CustomInput
              label="Email Address"
              placeholder="e.g., alex@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="✉️"
            />

            {/* Inline Red Error Box */}
            {emailError && (
              <View style={styles.inlineErrorBox}>
                <Text style={styles.inlineErrorText}>{emailError}</Text>
              </View>
            )}

            {/* Send OTP CTA Button */}
            <CustomButton
              title="Send Reset OTP"
              onPress={handleSendOtp}
              loading={loading}
              showArrow
              style={styles.sendBtn}
            />

            {/* Security Guarantee Badge Card */}
            <View style={styles.securityBadgeCard}>
              <Text style={styles.securityText}>🛡️ 100% Encrypted & Secure Password Recovery</Text>
            </View>

            {/* Footer Back to Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remembered your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF7ED', // Warm Cream Background
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  curvedHeroHeader: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 16,
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
    marginTop: -28,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  lockIcon: {
    fontSize: 28,
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
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  sendBtn: {
    marginTop: SPACING.sm,
    width: '100%',
    borderRadius: 14,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: SPACING.sm,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    width: '100%',
  },
  inlineErrorText: {
    fontSize: FONT_SIZE.xs,
    color: '#DC2626',
    fontWeight: '600',
  },
  inlineSignUpLink: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  securityBadgeCard: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: SPACING.lg,
    width: '100%',
    alignItems: 'center',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9A3412',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: '#78350F',
    fontSize: FONT_SIZE.md,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
