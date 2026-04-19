import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionSheet, type OptionSheetHandle } from './OptionSheet';
import { useSettingsStore, type ThemePreference } from '../../stores/useSettingsStore';

export const ThemePickerSheet = forwardRef<OptionSheetHandle>(
  function ThemePickerSheet(_, ref) {
    const { t } = useTranslation();
    const theme = useSettingsStore((s) => s.theme);
    const setTheme = useSettingsStore((s) => s.setTheme);

    const items = [
      { value: 'light', label: t('profile.themeOptions.light'), leading: '☀' },
      { value: 'dark', label: t('profile.themeOptions.dark'), leading: '☾' },
      { value: 'system', label: t('profile.themeOptions.system'), leading: '⊙' },
    ];

    return (
      <OptionSheet
        ref={ref}
        title={t('profile.rows.theme')}
        items={items}
        selectedValue={theme}
        onSelect={(v) => setTheme(v as ThemePreference)}
        snapPoints={['40%']}
      />
    );
  }
);
