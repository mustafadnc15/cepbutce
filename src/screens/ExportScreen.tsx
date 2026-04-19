import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/feather';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { useTheme } from '../theme';
import { Button, Chip, Card } from '../components/ui';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { getDB } from '../db/connection';
import { usePremium } from '../hooks/usePremium';
import type { Category } from '../types';
import { buildCsv, writeCsvFile } from '../services/export/csv';
import { buildHtml, writePdf, isPdfAvailable } from '../services/export/pdf';
import { shareFile } from '../services/export/share';

type RangePreset = 'thisMonth' | 'last3Months' | 'thisYear' | 'allTime';
type Format = 'csv' | 'pdf';

function computeRange(preset: RangePreset): { start: string; end: string } {
  const now = dayjs();
  switch (preset) {
    case 'thisMonth':
      return { start: now.startOf('month').toISOString(), end: now.endOf('month').toISOString() };
    case 'last3Months':
      return {
        start: now.subtract(3, 'month').startOf('month').toISOString(),
        end: now.endOf('day').toISOString(),
      };
    case 'thisYear':
      return { start: now.startOf('year').toISOString(), end: now.endOf('year').toISOString() };
    case 'allTime':
      return { start: '1970-01-01T00:00:00.000Z', end: now.endOf('day').toISOString() };
  }
}

function loadCategories(): Category[] {
  const db = getDB();
  const res = db.executeSync('SELECT * FROM categories;');
  return (res.rows ?? []) as unknown as Category[];
}

export function ExportScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const transactions = useTransactionStore((s) => s.transactions);
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const { canUsePdfExport, showPaywall } = usePremium();
  const isPremium = canUsePdfExport;

  const [preset, setPreset] = useState<RangePreset>('thisMonth');
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeIncomes, setIncludeIncomes] = useState(true);
  const [includeSubs, setIncludeSubs] = useState(true);
  const [format, setFormat] = useState<Format>('csv');
  const [working, setWorking] = useState(false);

  const categories = useMemo(() => loadCategories(), []);

  const handleExport = async () => {
    if (format === 'pdf' && !isPremium) {
      Toast.show({ type: 'error', text1: t('export.premiumRequired') });
      return;
    }

    setWorking(true);
    try {
      const range = computeRange(preset);
      const input = {
        range,
        flags: {
          expenses: includeExpenses,
          incomes: includeIncomes,
          subscriptions: includeSubs,
        },
        transactions,
        subscriptions,
        categories,
      };

      let filePath: string | null = null;
      let mimeType: 'text/csv' | 'application/pdf' = 'text/csv';

      if (format === 'csv') {
        const content = buildCsv(input);
        filePath = await writeCsvFile(content);
        mimeType = 'text/csv';
      } else {
        if (!isPdfAvailable) {
          Toast.show({ type: 'error', text1: t('errors.pdfFailed') });
          return;
        }
        const html = buildHtml(input);
        filePath = await writePdf(html);
        mimeType = 'application/pdf';
      }

      if (!filePath) {
        Toast.show({ type: 'error', text1: t('errors.fileWriteFailed') });
        return;
      }

      const filename = filePath.split('/').pop() ?? 'export';
      const shared = await shareFile({ url: filePath, filename, mimeType });
      if (shared) {
        Toast.show({ type: 'success', text1: t('export.success') });
      } else {
        Toast.show({ type: 'error', text1: t('errors.shareFailed') });
      }
    } catch (e) {
      console.warn('[export] failed', e);
      Toast.show({ type: 'error', text1: t('errors.generic') });
    } finally {
      setWorking(false);
    }
  };

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'thisMonth', label: t('common.thisMonth') },
    { key: 'last3Months', label: t('common.last3Months') },
    { key: 'thisYear', label: t('common.thisYear') },
    { key: 'allTime', label: t('common.allTime') },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.page }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-left" size={28} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('export.title')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <SectionLabel title={t('export.dateRange')} color={theme.colors.text.secondary} />
        <View style={styles.chips}>
          {presets.map((p) => (
            <Chip
              key={p.key}
              label={p.label}
              active={preset === p.key}
              onPress={() => setPreset(p.key)}
            />
          ))}
        </View>

        <SectionLabel
          title={t('export.include')}
          color={theme.colors.text.secondary}
          style={{ marginTop: 20 }}
        />
        <Card>
          <CheckRow
            label={t('export.includeExpenses')}
            value={includeExpenses}
            onValueChange={setIncludeExpenses}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border.card }]} />
          <CheckRow
            label={t('export.includeIncomes')}
            value={includeIncomes}
            onValueChange={setIncludeIncomes}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border.card }]} />
          <CheckRow
            label={t('export.includeSubscriptions')}
            value={includeSubs}
            onValueChange={setIncludeSubs}
          />
        </Card>

        <SectionLabel
          title={t('export.format')}
          color={theme.colors.text.secondary}
          style={{ marginTop: 20 }}
        />
        <View style={styles.formatRow}>
          <FormatCard
            title={t('export.csv')}
            active={format === 'csv'}
            onPress={() => setFormat('csv')}
            icon="file-text"
          />
          <FormatCard
            title={t('export.pdf')}
            active={format === 'pdf'}
            onPress={() => {
              if (!isPremium) {
                showPaywall();
                return;
              }
              setFormat('pdf');
            }}
            icon="file"
            badge={isPremium ? undefined : t('export.pdfPremium')}
            locked={!isPremium}
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <Button
            title={working ? t('export.exporting') : t('export.exportCta')}
            onPress={handleExport}
            loading={working}
            disabled={!includeExpenses && !includeIncomes && !includeSubs}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({
  title,
  color,
  style,
}: {
  title: string;
  color: string;
  style?: { marginTop?: number };
}) {
  return (
    <Text
      style={[
        {
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color,
          marginBottom: 10,
        },
        style,
      ]}>
      {title}
    </Text>
  );
}

interface CheckRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function CheckRow({ label, value, onValueChange }: CheckRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={styles.checkRow}>
      <Text style={[styles.checkLabel, { color: theme.colors.text.primary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border.input, true: theme.colors.brand.primary }}
      />
    </Pressable>
  );
}

interface FormatCardProps {
  title: string;
  icon: string;
  active: boolean;
  onPress: () => void;
  badge?: string;
  locked?: boolean;
}

function FormatCard({ title, icon, active, onPress, badge, locked }: FormatCardProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.formatCard,
        {
          backgroundColor: active
            ? theme.colors.brand.primaryLight
            : theme.colors.bg.card,
          borderColor: active ? theme.colors.brand.primary : theme.colors.border.card,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${title} (Premium)` : title}
      accessibilityState={{ selected: active }}>
      <Icon
        name={icon as any}
        size={24}
        color={
          locked
            ? theme.colors.text.placeholder
            : active
            ? theme.colors.brand.primary
            : theme.colors.text.secondary
        }
      />
      <Text
        style={[
          styles.formatTitle,
          {
            color: locked
              ? theme.colors.text.secondary
              : active
              ? theme.colors.brand.primary
              : theme.colors.text.primary,
          },
        ]}>
        {title}
      </Text>
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.semantic.warning },
          ]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {locked ? (
        <View style={styles.lockIcon}>
          <Icon name="lock" size={14} color={theme.colors.text.placeholder} />
        </View>
      ) : null}
    </Pressable>
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
  content: { padding: 16 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  checkLabel: { fontSize: 15 },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  formatTitle: { fontSize: 15, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});
