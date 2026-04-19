import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { ListCard, SectionHeader, Card } from '../components/ui';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { ProfileStackParamList } from '../navigation/types';
import { CURRENCIES } from '../constants/currencies';
import { CurrencyPickerSheet } from '../components/profile/CurrencyPickerSheet';
import { LanguagePickerSheet } from '../components/profile/LanguagePickerSheet';
import { ThemePickerSheet } from '../components/profile/ThemePickerSheet';
import { BudgetResetDayPickerSheet } from '../components/profile/BudgetResetDayPickerSheet';
import type { OptionSheetHandle } from '../components/profile/OptionSheet';
import { authenticate, isSensorAvailable } from '../services/biometrics';
import { wipeAll } from '../services/dataWipe';
import pkg from '../../package.json';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const FEEDBACK_EMAIL = 'hello@cepbutce.app';
const PRIVACY_URL = 'https://cepbutce.app/privacy';
const TERMS_URL = 'https://cepbutce.app/terms';
const IOS_STORE_URL = 'itms-apps://apps.apple.com/app/idPLACEHOLDER';
const ANDROID_STORE_URL = 'market://details?id=com.cepbutce';

export function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const isPremium = useSettingsStore((s) => s.isPremium);
  const currency = useSettingsStore((s) => s.currency);
  const language = useSettingsStore((s) => s.language);
  const themePref = useSettingsStore((s) => s.theme);
  const resetDay = useSettingsStore((s) => s.budgetResetDay);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const setBiometricLock = useSettingsStore((s) => s.setBiometricLock);

  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const signOut = useAuthStore((s) => s.signOut);

  const currencySheetRef = useRef<OptionSheetHandle>(null);
  const languageSheetRef = useRef<OptionSheetHandle>(null);
  const themeSheetRef = useRef<OptionSheetHandle>(null);
  const resetDaySheetRef = useRef<OptionSheetHandle>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const currencySymbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const currencyName =
    CURRENCIES.find((c) => c.code === currency)?.name ?? currency;

  const initials = (user?.name ?? '').trim().split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

  const handleHaptic = () => HapticFeedback.trigger('impactLight');

  const handleSignOut = () => {
    Alert.alert(t('auth.signOutConfirm.title'), t('auth.signOutConfirm.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          Toast.show({ type: 'success', text1: t('auth.signedOut') });
        },
      },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    handleHaptic();
    if (!value) {
      setBiometricLock(false);
      Toast.show({ type: 'info', text1: t('toasts.biometricDisabled') });
      return;
    }
    const available = await isSensorAvailable();
    if (!available) {
      Toast.show({ type: 'error', text1: t('errors.biometricUnavailable') });
      return;
    }
    const result = await authenticate(t('profile.rows.biometricLock'));
    if (!result.success) {
      Toast.show({ type: 'error', text1: t('errors.biometricFailed') });
      return;
    }
    setBiometricLock(true);
    Toast.show({ type: 'success', text1: t('toasts.biometricEnabled') });
  };

  const handleNotificationsToggle = (value: boolean) => {
    handleHaptic();
    setNotificationsEnabled(value);
    Toast.show({
      type: 'info',
      text1: value ? t('toasts.notificationsEnabled') : t('toasts.notificationsDisabled'),
    });
  };

  const handleDeleteAll = () => {
    Alert.alert(t('profile.wipe.title1'), t('profile.wipe.message1'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('profile.wipe.title2'), t('profile.wipe.message2'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('profile.wipe.confirm'),
              style: 'destructive',
              onPress: () => {
                try {
                  wipeAll();
                  Toast.show({ type: 'success', text1: t('profile.wipe.done') });
                  navigation.getParent()?.navigate('Main', {
                    screen: 'Dashboard',
                    params: { screen: 'DashboardHome' },
                  } as never);
                } catch (e) {
                  console.warn('[wipe] failed', e);
                  Toast.show({ type: 'error', text1: t('errors.generic') });
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const openUrl = (url: string) => {
    handleHaptic();
    Linking.openURL(url).catch(() => {
      Toast.show({ type: 'error', text1: t('errors.generic') });
    });
  };

  const openStore = () => {
    const url =
      require('react-native').Platform.OS === 'ios' ? IOS_STORE_URL : ANDROID_STORE_URL;
    openUrl(url);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.colors.text.primary }]}>
          {t('profile.title')}
        </Text>

        {/* User header */}
        <Card
          onPress={
            user ? () => navigation.navigate('EditProfile') : () => navigation.navigate('Login')
          }>
          <View style={styles.userRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: user
                    ? theme.colors.brand.primary
                    : theme.colors.bg.page,
                },
              ]}>
              {user ? (
                <Text style={styles.avatarText}>{initials}</Text>
              ) : (
                <Icon name="user" size={24} color={theme.colors.text.secondary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              {user ? (
                <>
                  <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                    {user.name}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
                    {user.email}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                    {t('profile.loggedOut')}
                  </Text>
                  <Text
                    style={[
                      styles.userEmail,
                      { color: theme.colors.brand.primary, fontWeight: '600' },
                    ]}>
                    {t('profile.signIn')}
                  </Text>
                </>
              )}
            </View>
            <ChevronRight color={theme.colors.text.secondary} />
          </View>
        </Card>

        {/* Hesap */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.sections.account')} />
          <View style={styles.group}>
            <ListCard
              icon="user"
              iconColor="#007AFF"
              iconBg="#E8F0FE"
              title={t('profile.editProfile')}
              onPress={() => {
                handleHaptic();
                navigation.navigate(user ? 'EditProfile' : 'Login');
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon={isPremium ? 'star' : 'zap'}
              iconColor="#FF9500"
              iconBg="#FFF3E0"
              title={isPremium ? t('profile.premium.active') : t('profile.premium.title')}
              subtitle={
                isPremium
                  ? t('profile.premium.subtitleActive')
                  : t('profile.premium.subtitleInactive')
              }
              onPress={() => {
                handleHaptic();
                navigation.navigate('Premium');
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            {user ? (
              <ListCard
                icon="log-out"
                iconColor={theme.colors.semantic.error}
                iconBg={isDark ? '#3B1A1A' : '#FDEAEA'}
                title={t('profile.signOut')}
                onPress={handleSignOut}
              />
            ) : null}
          </View>
        </View>

        {/* Tercihler */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.sections.preferences')} />
          <View style={styles.group}>
            <ListCard
              icon="dollar-sign"
              iconColor="#00C864"
              iconBg="#E6F9EE"
              title={t('profile.rows.currency')}
              subtitle={`${currencySymbol} ${currencyName}`}
              onPress={() => {
                handleHaptic();
                currencySheetRef.current?.present();
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="globe"
              iconColor="#007AFF"
              iconBg="#E8F0FE"
              title={t('profile.rows.language')}
              subtitle={t(`profile.languageOptions.${language}`)}
              onPress={() => {
                handleHaptic();
                languageSheetRef.current?.present();
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="moon"
              iconColor="#5856D6"
              iconBg="#EEEEFD"
              title={t('profile.rows.theme')}
              subtitle={t(`profile.themeOptions.${themePref}`)}
              onPress={() => {
                handleHaptic();
                themeSheetRef.current?.present();
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="calendar"
              iconColor="#AF52DE"
              iconBg="#F3E8FD"
              title={t('profile.rows.budgetResetDay')}
              subtitle={t('profile.rows.budgetResetDayHint', { day: resetDay })}
              onPress={() => {
                handleHaptic();
                resetDaySheetRef.current?.present();
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ToggleRow
              icon="bell"
              iconColor="#FF9500"
              iconBg="#FFF3E0"
              title={t('profile.rows.notifications')}
              subtitle={t('profile.rows.notificationsHint')}
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
            />
            <ToggleRow
              icon="lock"
              iconColor="#34C759"
              iconBg="#E6F9EE"
              title={t('profile.rows.biometricLock')}
              subtitle={t('profile.rows.biometricLockHint')}
              value={biometricLock}
              onValueChange={handleBiometricToggle}
            />
          </View>
        </View>

        {/* Bütçe */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.sections.budget')} />
          <View style={styles.group}>
            <ListCard
              icon="target"
              iconColor={theme.colors.brand.primary}
              iconBg={theme.colors.brand.primaryTint}
              title={t('profile.rows.budgetSettings')}
              subtitle={t('profile.rows.budgetSettingsSubtitle')}
              onPress={() => {
                handleHaptic();
                navigation.navigate('BudgetSettings');
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
          </View>
        </View>

        {/* Veri */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.sections.data')} />
          <View style={styles.group}>
            <ListCard
              icon="download"
              iconColor="#34C759"
              iconBg="#E6F9EE"
              title={t('profile.rows.exportData')}
              onPress={() => {
                handleHaptic();
                navigation.navigate('Export');
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="upload"
              iconColor="#007AFF"
              iconBg="#E8F0FE"
              title={t('profile.rows.importData')}
              onPress={() => {
                handleHaptic();
                navigation.navigate('ImportCsv');
              }}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="trash-2"
              iconColor={theme.colors.semantic.error}
              iconBg={isDark ? '#3B1A1A' : '#FDEAEA'}
              title={t('profile.rows.deleteAll')}
              subtitle={t('profile.rows.deleteAllHint')}
              onPress={handleDeleteAll}
            />
          </View>
        </View>

        {/* Hakkında */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.sections.about')} />
          <View style={styles.group}>
            <ListCard
              icon="mail"
              iconColor="#007AFF"
              iconBg="#E8F0FE"
              title={t('profile.rows.feedback')}
              onPress={() => openUrl(`mailto:${FEEDBACK_EMAIL}?subject=CepB%C3%BCt%C3%A7e`)}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="star"
              iconColor="#FF9500"
              iconBg="#FFF3E0"
              title={t('profile.rows.rate')}
              onPress={openStore}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="shield"
              iconColor="#5856D6"
              iconBg="#EEEEFD"
              title={t('profile.rows.privacy')}
              onPress={() => openUrl(PRIVACY_URL)}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <ListCard
              icon="file-text"
              iconColor="#8E8E93"
              iconBg={isDark ? '#2A2A2E' : '#EFEFF1'}
              title={t('profile.rows.terms')}
              onPress={() => openUrl(TERMS_URL)}
              right={<ChevronRight color={theme.colors.text.secondary} />}
            />
            <View style={styles.versionRow}>
              <Text style={[styles.versionLabel, { color: theme.colors.text.secondary }]}>
                {t('profile.rows.version')}
              </Text>
              <Text
                style={[styles.versionValue, { color: theme.colors.text.secondary }]}>
                {pkg.version}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CurrencyPickerSheet ref={currencySheetRef} />
      <LanguagePickerSheet ref={languageSheetRef} />
      <ThemePickerSheet ref={themeSheetRef} />
      <BudgetResetDayPickerSheet ref={resetDaySheetRef} />
    </View>
  );
}

interface ToggleRowProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function ToggleRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  onValueChange,
}: ToggleRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        {
          backgroundColor: pressed
            ? theme.colors.bg.page
            : theme.colors.bg.card,
          borderColor: theme.colors.border.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: theme.radius.card,
          padding: theme.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          ...theme.shadows.card,
        },
      ]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
        }}>
        <Icon name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...theme.typography.listTitle,
            color: theme.colors.text.primary,
          }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...theme.typography.subtitle,
              color: theme.colors.text.secondary,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border.input, true: theme.colors.brand.primary }}
      />
    </Pressable>
  );
}

interface ChevronRightProps {
  color: string;
}

function ChevronRight({ color }: ChevronRightProps) {
  return <Icon name="chevron-right" size={20} color={color} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
  group: {
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  versionLabel: {
    fontSize: 13,
  },
  versionValue: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
