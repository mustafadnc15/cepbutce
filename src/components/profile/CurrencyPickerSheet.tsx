import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionSheet, type OptionSheetHandle } from './OptionSheet';
import { CURRENCIES } from '../../constants/currencies';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const CurrencyPickerSheet = forwardRef<OptionSheetHandle>(
  function CurrencyPickerSheet(_, ref) {
    const { t } = useTranslation();
    const currency = useSettingsStore((s) => s.currency);
    const setCurrency = useSettingsStore((s) => s.setCurrency);

    return (
      <OptionSheet
        ref={ref}
        title={t('profile.rows.currency')}
        items={CURRENCIES.map((c) => ({
          value: c.code,
          label: `${c.name}`,
          sublabel: c.code,
          leading: c.symbol,
        }))}
        selectedValue={currency}
        onSelect={(code) => setCurrency(code)}
        snapPoints={['75%']}
      />
    );
  }
);
