// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';
import { CustomerBottomNav } from './CustomerBottomNav';

export interface GuestOrdersStateProps {
  onLoginPress: () => void;
  onGoBack?: () => void;
  navigation: any;
}

export const GuestOrdersState: React.FC<GuestOrdersStateProps> = ({
  onLoginPress,
  onGoBack,
  navigation,
}) => {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={styles.headerContainer}>
          <View style={styles.topRow}>
            {onGoBack ? (
              <TouchableOpacity
                style={styles.backCircleBtn}
                onPress={onGoBack}
                activeOpacity={0.8}
              >
                <Text style={styles.backIconText}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}
            <Text style={styles.screenTitle}>My Orders</Text>
            <View style={{ width: 38 }} />
          </View>
        </View>

        {/* Center Swiggy/Zomato Style Empty Guest Card */}
        <View style={styles.contentContainer}>
          <View style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>📦</Text>
            <View style={styles.lockBadge}>
              <Text style={styles.lockBadgeText}>🔒</Text>
            </View>
          </View>

          <Text style={styles.titleText}>Log in to view your orders</Text>
          <Text style={styles.subtitleText}>
            Please log in or create an account to view your active food orders, track live deliveries, and see past order history.
          </Text>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={onLoginPress}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation Bar */}
        <CustomerBottomNav activeTab="Orders" navigation={navigation} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80,
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  illustrationEmoji: {
    fontSize: 48,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  lockBadgeText: {
    fontSize: 14,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
