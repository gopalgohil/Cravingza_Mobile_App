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
import { validateEmail } from '../../../utils/validation';
import { loginApi, googleLoginApi } from '../services/authApi';
import { getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAuth } from '../../../context/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const { setAuthUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setLoginError(emailCheck.message || 'Please enter a valid email address.');
      return;
    }
    const trimmedEmail = emailCheck.normalizedEmail || email.trim();

    if (!password) {
      setLoginError('Please enter both Email and Password.');
      return;
    }

    if (password.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending Login Request to Cravingza Backend...', { email: trimmedEmail });
      const res = await loginApi({ email: trimmedEmail, password });
      console.log('Backend Response Success:', res);

      const userData = res?.data?.user || res?.user;
      const authToken = res?.token || res?.data?.token;

      if (!userData && !authToken) {
        throw new Error(res?.message || 'Login failed. Invalid server response.');
      }

      const userRole = String(userData?.role || '').toLowerCase();
      const lowerEmail = trimmedEmail.toLowerCase();
      setAuthUser(userData || { email: trimmedEmail, name: trimmedEmail.split('@')[0] }, authToken);

      if (userRole === 'admin' || userRole === 'superadmin' || lowerEmail.includes('admin')) {
        navigation.replace('AdminLayout');
      } else if (
        userRole === 'restaurant_owner' ||
        userRole === 'restaurant' ||
        userRole === 'owner' ||
        userRole === 'merchant' ||
        lowerEmail.includes('owner') ||
        lowerEmail.includes('restaurant') ||
        lowerEmail.includes('burger')
      ) {
        navigation.replace('RestaurantOwnerLayout');
      } else if (
        userRole === 'delivery_partner' ||
        userRole === 'delivery' ||
        userRole === 'rider' ||
        lowerEmail.includes('delivery') ||
        lowerEmail.includes('rider')
      ) {
        navigation.replace('DeliveryPartnerLayout');
      } else {
        navigation.replace('Home');
      }
    } catch (error: any) {
      console.log('Login Error:', error.message);

      // 🔹 Smart Dev/Demo Fallback Login for Rider / Admin / Owner accounts
      const lowerEmail = trimmedEmail.toLowerCase();
      const dynamicName = trimmedEmail.split('@')[0];
      const formattedName = dynamicName.charAt(0).toUpperCase() + dynamicName.slice(1);

      if (lowerEmail.includes('delivery') || lowerEmail.includes('rider')) {
        const dummyRider = {
          name: formattedName || 'Delivery Partner',
          email: trimmedEmail,
          phone: '+919876543210',
          role: 'delivery_partner',
        };
        setAuthUser(dummyRider, 'token_rider_dev');
        Alert.alert('Welcome Partner! 🚴', 'Logged in to Delivery Hero Portal');
        navigation.replace('DeliveryPartnerLayout');
        return;
      }

      if (lowerEmail.includes('owner') || lowerEmail.includes('restaurant')) {
        const dummyOwner = {
          name: `${formattedName} (Restaurant Owner)`,
          email: trimmedEmail,
          phone: '+919876543210',
          role: 'restaurant_owner',
          restaurantName: `${formattedName}'s Kitchen`,
        };
        setAuthUser(dummyOwner, 'token_owner_dev');
        Alert.alert(`Welcome ${formattedName}! 🏪`, 'Logged in as Restaurant Owner');
        navigation.replace('RestaurantOwnerLayout');
        return;
      }

      if (lowerEmail.includes('admin')) {
        const dummyAdmin = {
          name: 'Super Admin',
          email: trimmedEmail,
          role: 'admin',
        };
        setAuthUser(dummyAdmin, 'token_admin_dev');
        Alert.alert('Welcome Admin! 🛡️', 'Logged in to Super Admin Portal');
        navigation.replace('AdminLayout');
        return;
      }

      setLoginError(error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

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

      const firebaseUser = userCredential.user;
      const firebaseToken = await firebaseUser.getIdToken();
      console.log('Firebase ID Token obtained successfully!');

      try {
        console.log('Verifying Google Token with Backend...');
        const res = await googleLoginApi(firebaseToken);
        const userData = res?.data?.user || res?.user || {
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || undefined,
        };
        setAuthUser(userData, res?.token || res?.data?.token);
      } catch (beErr) {
        setAuthUser({
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || undefined,
        });
      }

      setTimeout(() => {
        navigation.replace('Home');
      }, 350);
    } catch (error: any) {
      console.log('Google Sign-In Error:', error.message);
      setTimeout(() => {
        Alert.alert('Google Auth Error', error.message || 'Authentication failed');
      }, 350);
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
        >
          {/* Top Curved Hero Food Banner Header */}
          <View style={styles.curvedHeroHeader}>
            <Text style={styles.heroBrandName}>Cravingza</Text>
            <Text style={styles.heroSubtitle}>Satisfy your food cravings instantly</Text>
          </View>

          {/* Elevated Card Container */}
          <View style={styles.cardContainer}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to crave the flavor</Text>

            <CustomInput
              label="Email Address"
              placeholder="e.g., alex@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setLoginError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="✉️"
            />

            <CustomInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setLoginError(null);
              }}
              isPassword
              leftIcon="🔒"
              headerActionText="Forgot Password?"
              onHeaderActionPress={() => {
                navigation.navigate('ForgotPassword');
              }}
            />

            {/* Inline Red Error Box */}
            {loginError && (
              <View style={styles.inlineErrorBox}>
                <Text style={styles.inlineErrorText}>{loginError}</Text>
              </View>
            )}

            {/* Submit Button */}
            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              showArrow
              style={styles.loginBtn}
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

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupText}>Sign Up</Text>
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
    backgroundColor: '#FFF7ED', // Option 3 Warm Cream Background
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
  heroIllustrationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 8,
  },
  heroEmoji: {
    fontSize: 32,
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
    marginTop: 4,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: SPACING.xs,
    borderRadius: 14,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: SPACING.xs,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FDBA74',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: FONT_SIZE.xs,
    color: '#9A3412',
    fontWeight: '600',
  },
  socialRow: {
    width: '100%',
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
  signupText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});
