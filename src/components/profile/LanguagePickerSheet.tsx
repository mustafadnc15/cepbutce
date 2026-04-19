import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionSheet, type OptionSheetHandle } from './OptionSheet';
import { useSettingsStore, type Language } from '../../stores/useSettingsStore';

export const LanguagePickerSheet = forwardRef<OptionSheetHandle>(
  function LanguagePickerSheet(_, ref) {
    const { t } = useTranslation();
    const language = useSettingsStore((s) => s.language);
    const setLanguage = useSettingsStore((s) => s.setLanguage);

    const items = [
      { value: 'tr', label: t('profile.languageOptions.tr'), leading: 'TR' },
      { value: 'en', label: t('profile.languageOptions.en'), leading: 'EN' },
    ];

    return (
      <OptionSheet
        ref={ref}
        title={t('profile.rows.language')}
        items={items}
        selectedValue={language}
        onSelect={(lang) => setLanguage(lang as Language)}
        snapPoints={['35%']}
      />
    );
  }
);
