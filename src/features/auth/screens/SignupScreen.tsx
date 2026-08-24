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
import { SocialButton } from '../../../components/ui/SocialButton';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { signupApi, googleLoginApi } from '../services/authApi';
import { getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const SignupScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [role, setRole] = useState<'customer' | 'restaurant' | 'delivery'>('customer');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('Initiating Google / Firebase Sign-In...');

      GoogleSignin.configure({
        webClientId: '251093525293-csm7eq0sv1848r985pieba3o9hmk0bre.apps.googleusercontent.com',
        offlineAccess: true,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear previous cached Google session so account selection popup opens
      await GoogleSignin.signOut().catch(() => {});
      const signInResult = await GoogleSignin.signIn();
      const googleIdToken = signInResult.data?.idToken || signInResult.idToken;

      if (!googleIdToken) {
        throw new Error('Google Sign-In failed to return an ID Token');
      }

      console.log('Exchanging Google Token with Firebase Auth...');
      const googleCredential = GoogleAuthProvider.credential(googleIdToken);
      const authInstance = getAuth();
      const userCredential = await signInWithCredential(authInstance, googleCredential);
      console.log('Successfully signed in to Firebase Auth!');

      const firebaseToken = await userCredential.user.getIdToken();
      console.log('Firebase ID Token obtained successfully!');

      console.log('Verifying Google Token with Backend...');
      const res = await googleLoginApi(firebaseToken);
      Alert.alert('Welcome 🎉', res.message || 'Google signup successful!');
      navigation.replace('Home');
    } catch (error: any) {
      console.log('Google Sign-In Error:', error.message);
      Alert.alert('Google Auth Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone ? phone.trim().replace(/\D/g, '') : '';

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all required fields including Confirm Password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      Alert.alert(
        'Password Requirements',
        'Password must contain at least:\n• One uppercase letter (A-Z)\n• One lowercase letter (a-z)\n• One number (0-9)\n• One special character (e.g. @, #, $, !)'
      );
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Terms Error', 'Please accept the Terms & Privacy Policy.');
      return;
    }

    const backendRole =
      role === 'restaurant'
        ? 'restaurant_owner'
        : role === 'delivery'
        ? 'delivery_partner'
        : 'customer';

    setLoading(true);
    try {
      console.log('Sending Signup Request to Cravingza Backend...', {
        name: trimmedName,
        email: trimmedEmail,
        role: backendRole,
      });

      const res = await signupApi({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password,
        confirmPassword,
        role: backendRole,
      });

      console.log('Cravingza Backend Signup Success:', res);
      Alert.alert(
        'Account Created 🎉',
        res.message || 'OTP Sent to your Email for Verification!'
      );
      navigation.replace('VerifyOtp', { email, name: fullName, phone });
    } catch (error: any) {
      console.log('Cravingza Backend Connection Error:', error.message);
      Alert.alert(
        'Registration Failed',
        `Cravingza Server Responded:\n${error.message || 'Failed to create account'}`
      );
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
          {/* Compact Top Curved Hero Banner Header */}
          <View style={styles.curvedHeroHeader}>
            <Text style={styles.heroBrandName}>Cravingza</Text>
          </View>

          {/* Single-Screen Fit Elevated Card Container */}
          <View style={styles.cardContainer}>
            <Text style={styles.title}>Create Account</Text>

            {/* Compact Inputs */}
            <View style={styles.compactInputWrapper}>
              <CustomInput
                label="Full Name"
                placeholder="e.g., John Doe"
                value={fullName}
                onChangeText={setFullName}
                leftIcon="👤"
              />
            </View>

            <View style={styles.compactInputWrapper}>
              <CustomInput
                label="Email Address"
                placeholder="e.g., user@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="✉️"
              />
            </View>

            <View style={styles.compactInputWrapper}>
              <CustomInput
                label="Phone Number"
                placeholder="9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon="📞"
              />
            </View>

            <View style={styles.compactInputWrapper}>
              <CustomInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon="🔒"
              />
            </View>

            <View style={styles.compactInputWrapper}>
              <CustomInput
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                leftIcon="🔒"
              />
            </View>

            {/* Terms & Conditions Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.linkText}>Terms & Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <CustomButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              showArrow
              style={styles.signupBtn}
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <SocialButton type="google" onPress={handleGoogleSignIn} />
            </View>
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 16,
  },
  curvedHeroHeader: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: SPACING.xs,
    paddingBottom: 28,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  heroIllustrationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroBrandName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: -16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '800',
    color: '#431407',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleContainer: {
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
  },
  roleTextActive: {
    color: COLORS.white,
  },
  compactInputWrapper: {
    marginBottom: -6,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 11,
    color: '#78350F',
    flex: 1,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  signupBtn: {
    marginTop: 4,
    borderRadius: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FDBA74',
  },
  dividerText: {
    marginHorizontal: SPACING.sm,
    fontSize: 11,
    color: '#9A3412',
    fontWeight: '600',
  },
  socialRow: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#78350F',
    fontSize: FONT_SIZE.sm,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});
