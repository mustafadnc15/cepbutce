import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../theme';
import { Button } from '../components/ui';
import { importCsv } from '../services/importer/csv';

// Minimal text-paste import UI. A proper file picker (react-native-document-
// picker) is a follow-up; this keeps the dependency surface small while
// still making round-trips possible: user exports a CSV, edits it in a
// spreadsheet, pastes the text back in.

export function ImportCsvScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [content, setContent] = useState('');
  const [working, setWorking] = useState(false);

  const handleImport = () => {
    if (!content.trim()) {
      Toast.show({ type: 'error', text1: t('import.emptyInput') });
      return;
    }
    setWorking(true);
    try {
      const result = importCsv(content);
      if (result.ok === 0 && result.failed > 0) {
        Toast.show({ type: 'error', text1: t('import.failed') });
      } else if (result.failed > 0) {
        Toast.show({
          type: 'info',
          text1: t('import.partial', { ok: result.ok, failed: result.failed }),
        });
      } else {
        Toast.show({
          type: 'success',
          text1: t('import.success', { count: result.ok }),
        });
      }
      navigation.goBack();
    } catch (e) {
      console.warn('[import] failed', e);
      Toast.show({ type: 'error', text1: t('import.failed') });
    } finally {
      setWorking(false);
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
          {t('import.title')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.colors.bg.card,
              borderColor: theme.colors.border.card,
            },
          ]}>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            placeholder={t('import.placeholder')}
            placeholderTextColor={theme.colors.text.placeholder}
            style={[
              styles.input,
              { color: theme.colors.text.primary },
            ]}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Button
          title={t('import.import')}
          onPress={handleImport}
          loading={working}
          disabled={!content.trim()}
        />
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
    paddingBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700' },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
