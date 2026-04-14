# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repo is **pre-scaffold**. The only file is [cepbutce-project-v2.md](cepbutce-project-v2.md) — a complete build specification for **CepBütçe**, a Turkish mobile-first budget tracker (expenses + subscriptions + receipt OCR). The app is built in 9 sequential phases (0–8); each phase has a self-contained prompt block in the spec.

Always consult the spec before making architecture decisions — it defines the data models, design tokens, screen map, tech stack, and free/premium tier limits.

## Hard Constraint: BARE React Native, not Expo

This is a **bare React Native CLI 0.76+** project with New Architecture (Fabric + TurboModules) enabled. This is not a stylistic preference — it is a scaffolding decision that governs every library choice in the spec.

- **Never install `expo-*` packages.** Never suggest Expo Router, EAS, expo-sqlite, expo-camera, etc.
- Use the community equivalents named in the spec: `op-sqlite` (not expo-sqlite), `react-native-vision-camera` (not expo-camera), `react-native-mmkv`, `@notifee/react-native`, `react-native-bootsplash`, etc.
- NativeWind v4 must be set up following the **bare RN guide**, not the Expo guide.
- After native deps: `cd ios && pod install`.

## Architecture Principles

**Theme is the single source of truth.** All visual values live in `src/theme/` (colors, typography, spacing, shadows, radii). Components consume via `useTheme()` — never hardcode colors, sizes, or radii. NativeWind's `tailwind.config.js` mirrors these tokens so Tailwind classes and StyleSheet code stay aligned.

**Dark mode is mandatory.** Every component must work in both modes. Theme preference (`'light' | 'dark' | 'system'`) is persisted in MMKV; `'system'` uses `useColorScheme()`.

**Data flow: UI → Zustand store → SQLite/MMKV.** Stores are the only layer that touches persistence:
- `op-sqlite` for relational data (transactions, categories, subscriptions, budgets) with a versioned migration system
- `react-native-mmkv` for settings and KV state (fast synchronous read on app start)
- Zustand stores wrap both; UI never calls the DB directly

**Custom bottom tab bar with FAB.** Never use React Navigation's default tab bar. The center `+` button is a standalone `Pressable` between tabs 2 and 3 (not a tab) that presents the `AddTransaction` bottom sheet globally — wire it via a Zustand store or Context ref, not per-screen.

**Bottom sheets over modal screens.** Add/edit flows (transaction, subscription, pickers) use `@gorhom/bottom-sheet` `BottomSheetModal`, not stack screens. Inside sheets, use `BottomSheetTextInput` (not `TextInput`) to avoid keyboard bugs.

**Lists: `@shopify/flash-list` everywhere.** Never `FlatList` for transaction history. Set `estimatedItemSize`, memoize row components, `useCallback` handlers.

## Folder Structure

The spec mandates this layout under `src/`:

```
components/{ui,navigation,dashboard,transactions,subscriptions,scanner}
screens/
navigation/        # RootNavigator, MainTabNavigator, types
db/                # connection.ts, migrations.ts (op-sqlite)
stores/            # Zustand + MMKV persistence
services/          # ocr.ts, notifications.ts, iap.ts
theme/             # colors, typography, spacing, shadows, index (barrel)
i18n/              # index.ts, tr.json, en.json
utils/             # currency.ts, date.ts, id.ts
types/             # shared TS interfaces
constants/         # categories.ts, currencies.ts
```

`src/components/ui/` holds the design system primitives defined in spec Phase 0 Step 3: `Card`, `StatCard`, `IconBox`, `ListCard`, `Input`, `Button`, `SectionHeader`, `Chip`, `EmptyState`. Build UI from these — don't compose raw `View`/`Text` with inline styles for screen content.

## Localization

**Turkish is the primary language.** All user-facing strings go through `i18next` / `react-i18next` with `tr.json` as the default and `en.json` as fallback. Default currency is `₺` (TRY) with Turkish number formatting: `1.234,56` (dots for thousands, comma for decimals). The `currency.ts` util must handle both `tr` and `en` locales. Dates use `dayjs` with locale plugins for both.

Category names, toast messages, empty states, button labels — all Turkish by default. See the spec for exact wording (e.g. "Harcama Ekle", "Son İşlemler", "Abonelikler").

## Free vs Premium Tier Limits

Enforce these in the relevant store (not just in UI):
- Free: 5 active subscriptions max, 3 receipt scans/month (on-device ML Kit only), default categories only, local data
- Premium: unlimited subscriptions, 20 scans/month (Gemini Vision OCR), custom categories, cloud sync, export

`receiptScansThisMonth` resets on the 1st (checked on app launch). Hitting a limit opens a bottom sheet with a premium CTA, not an alert.

## Phase Dependencies

```
0 → 1 → 2 → 3 ──┐
    │           ├→ (4 after 1; 5 independent; 6 after 3)
    └→ 6 → 7 → 8
```

Phases 0–3 are strictly sequential. Phase 4 (subscriptions) needs navigation from Phase 1. Phase 5 (scanner) only needs Phase 0 + the Phase 2 patterns. Phase 6 (budgets) needs transaction data from Phase 3. Phase 8 is always last.

Each phase prompt in the spec is self-contained and assumes prior phases are complete — follow the step order inside a phase, don't reorder.

## Commands

No `package.json` yet. Once Phase 0 scaffolds the project, the standard React Native CLI commands apply: `npm start`, `npm run ios`, `npm run android`, `npm test`. Update this section after scaffolding with anything non-obvious (OCR test fixtures, seed scripts, etc.).
