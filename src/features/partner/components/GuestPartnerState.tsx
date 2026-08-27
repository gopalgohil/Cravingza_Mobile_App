// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZE } from '../../../utils/theme';

export interface GuestPartnerStateProps {
  initialMode?: 'restaurant' | 'delivery';
  onLoginPress: () => void;
  onGoBack: () => void;
}

export const GuestPartnerState: React.FC<GuestPartnerStateProps> = ({
  initialMode = 'restaurant',
  onLoginPress,
  onGoBack,
}) => {
  const [activePartnerType, setActivePartnerType] = useState<'restaurant' | 'delivery'>(initialMode);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Bar */}
        <View style={styles.headerContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={onGoBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backIconText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Partner with Cravingza</Text>
            <View style={{ width: 38 }} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Selector Tabs (Restaurant Owner vs Delivery Rider) */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeTabBtn,
                activePartnerType === 'restaurant' && styles.typeTabBtnActive,
              ]}
              onPress={() => setActivePartnerType('restaurant')}
              activeOpacity={0.8}
            >
              <Text style={styles.typeTabEmoji}>🏪</Text>
              <Text
                style={[
                  styles.typeTabText,
                  activePartnerType === 'restaurant' && styles.typeTabTextActive,
                ]}
              >
                Restaurant Owner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeTabBtn,
                activePartnerType === 'delivery' && styles.typeTabBtnActive,
              ]}
              onPress={() => setActivePartnerType('delivery')}
              activeOpacity={0.8}
            >
              <Text style={styles.typeTabEmoji}>🛵</Text>
              <Text
                style={[
                  styles.typeTabText,
                  activePartnerType === 'delivery' && styles.typeTabTextActive,
                ]}
              >
                Ride & Earn
              </Text>
            </TouchableOpacity>
          </View>

          {/* Center Guest Card */}
          <View style={styles.contentContainer}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.illustrationEmoji}>
                {activePartnerType === 'restaurant' ? '🏪' : '🛵'}
              </Text>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>🔒</Text>
              </View>
            </View>

            <Text style={styles.titleText}>
              {activePartnerType === 'restaurant'
                ? 'Log in to Register Restaurant'
                : 'Log in to Ride & Earn'}
            </Text>

            <Text style={styles.subtitleText}>
              {activePartnerType === 'restaurant'
                ? 'Please log in or create an account to list your restaurant, register your menu, and grow your food business.'
                : 'Please log in or create an account to register as a delivery rider, set your flexible hours, and earn great income.'}
            </Text>

            {/* Partner Benefits Highlights with Clean SVG Icons */}
            <View style={styles.featuresContainer}>
              {activePartnerType === 'restaurant' ? (
                <>
                  {/* 1. Grow Your Food Business */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <Path d="M9 22V12h6v10" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Grow Your Food Business</Text>
                      <Text style={styles.featureSub}>Reach thousands of hungry local foodies every day.</Text>
                    </View>
                  </View>

                  {/* 2. Live Order Management */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <Path d="M3 6h18" />
                        <Path d="M16 10a4 4 0 01-8 0" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Live Order Management</Text>
                      <Text style={styles.featureSub}>Manage kitchen orders & live tracking in real-time.</Text>
                    </View>
                  </View>

                  {/* 3. Direct Bank Payouts */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <Path d="M1 10h22" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Direct Bank Payouts</Text>
                      <Text style={styles.featureSub}>100% transparent & automated weekly earnings.</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* 1. Flexible Delivery Hours */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx="12" cy="12" r="10" />
                        <Path d="M12 6v6l4 2" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Flexible Delivery Hours</Text>
                      <Text style={styles.featureSub}>Choose your own shifts & deliver whenever you want.</Text>
                    </View>
                  </View>

                  {/* 2. High Earnings & Incentives */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>High Earnings & Bonuses</Text>
                      <Text style={styles.featureSub}>Earn per trip + attractive weekly peak bonuses.</Text>
                    </View>
                  </View>

                  {/* 3. Direct Weekly Payouts */}
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconContainer}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <Path d="M1 10h22" />
                      </Svg>
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>Weekly Bank Transfers</Text>
                      <Text style={styles.featureSub}>Direct weekly payouts with 100% trip breakdown.</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Primary CTA Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={onLoginPress}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>
                {activePartnerType === 'restaurant'
                  ? 'Log In / Sign Up to Register ➔'
                  : 'Log In / Sign Up to Ride & Earn ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 30,
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
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  typeTabBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  typeTabEmoji: {
    fontSize: 16,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  typeTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  illustrationCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  illustrationEmoji: {
    fontSize: 44,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  lockBadgeText: {
    fontSize: 13,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: FONT_SIZE.xs,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  featureSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
