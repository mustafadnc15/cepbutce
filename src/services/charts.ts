// Lazy wrapper around react-native-gifted-charts. When the package isn't
// installed (happens during the Phase 6 scaffold before `npm install`) the
// exports fall back to null so chart components can render a graceful
// "not available" state instead of crashing at import time.
//
// Keep the exported surface minimal — only the chart types we actually use.
// Prop types are intentionally loose (any) because we don't bundle the
// package's type declarations when it's absent.

import type { ComponentType } from 'react';

export type GiftedLineChart = ComponentType<any>;
export type GiftedBarChart = ComponentType<any>;
export type GiftedPieChart = ComponentType<any>;

interface GiftedChartsModule {
  LineChart: GiftedLineChart;
  BarChart: GiftedBarChart;
  PieChart: GiftedPieChart;
}

let charts: GiftedChartsModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  charts = require('react-native-gifted-charts');
} catch {
  console.warn(
    '[charts] react-native-gifted-charts not installed. Analytics charts are disabled. ' +
      'Run: npm install react-native-gifted-charts'
  );
}

export const LineChart: GiftedLineChart | null = charts?.LineChart ?? null;
export const BarChart: GiftedBarChart | null = charts?.BarChart ?? null;
export const PieChart: GiftedPieChart | null = charts?.PieChart ?? null;

export const isChartsAvailable = charts !== null;
