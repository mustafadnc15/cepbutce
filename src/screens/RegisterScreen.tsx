import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthError } from '../services/auth';
import type { ProfileStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Register'>;

export function RegisterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const signUp = useAuthStore((s) => s.signUp);
  const submitting = useAuthStore((s) => s.submitting);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      Toast.show({ type: 'success', text1: t('auth.signedIn') });
      navigation.goBack();
    } catch (e) {
      if (e instanceof AuthError) {
        setError(t(`auth.errors.${e.code.replace(/-(\w)/g, (_, c) => c.toUpperCase())}`));
      } else {
        setError(t('errors.generic'));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.bg.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Icon name="chevron-left" size={28} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {t('auth.registerTitle')}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.form}>
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              {t('auth.name')}
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder={t('editProfile.namePlaceholder')}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              {t('auth.email')}
            </Text>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              {t('auth.password')}
            </Text>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              error={error ?? undefined}
            />
          </View>

          <Button
            title={t('auth.registerCta')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!name.trim() || !email.trim() || password.length < 6}
          />

          <Pressable
            onPress={() => navigation.replace('Login')}
            style={styles.switchLink}>
            <Text style={[styles.switchText, { color: theme.colors.brand.primary }]}>
              {t('auth.hasAccount')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700' },
  form: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchLink: {
    alignItems: 'center',
    padding: 12,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
