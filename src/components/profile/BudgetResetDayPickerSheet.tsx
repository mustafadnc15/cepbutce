import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { OptionSheet, type OptionSheetHandle } from './OptionSheet';
import { useSettingsStore } from '../../stores/useSettingsStore';

// Day values are stored as numbers (1..28); the OptionSheet is typed over
// strings, so we serialize both ways at the edges.

export const BudgetResetDayPickerSheet = forwardRef<OptionSheetHandle>(
  function BudgetResetDayPickerSheet(_, ref) {
    const { t } = useTranslation();
    const day = useSettingsStore((s) => s.budgetResetDay);
    const setDay = useSettingsStore((s) => s.setBudgetResetDay);

    const items = Array.from({ length: 28 }, (_, i) => {
      const d = i + 1;
      return {
        value: String(d),
        label: t('profile.rows.budgetResetDayHint', { day: d }),
        leading: String(d),
      };
    });

    return (
      <OptionSheet
        ref={ref}
        title={t('profile.rows.budgetResetDay')}
        items={items}
        selectedValue={String(day)}
        onSelect={(v) => setDay(Number(v))}
        snapPoints={['75%']}
      />
    );
  }
);
