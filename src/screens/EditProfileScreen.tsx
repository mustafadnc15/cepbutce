import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';

export function EditProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, email });
      Toast.show({ type: 'success', text1: t('editProfile.saved') });
      navigation.goBack();
    } catch (e) {
      console.warn('[editProfile]', e);
      Toast.show({ type: 'error', text1: t('errors.generic') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.bg.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-left" size={28} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('editProfile.title')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={{ gap: 6 }}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            {t('editProfile.name')}
          </Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('editProfile.namePlaceholder')}
            autoCapitalize="words"
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            {t('editProfile.email')}
          </Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder={t('editProfile.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim() || !email.trim() || !user}
        />
        {!user ? (
          <Text style={[styles.hint, { color: theme.colors.text.secondary }]}>
            {t('profile.loggedOut')}
          </Text>
        ) : null}
      </View>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
