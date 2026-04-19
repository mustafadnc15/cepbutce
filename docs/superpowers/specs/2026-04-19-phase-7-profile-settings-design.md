# Phase 7 — Profile, Settings, Export, i18n, Dark Mode, Auth

**Status:** approved by user via auto-mode (autonomous execution on a detailed spec)
**Scope:** Phase 7 of the CepBütçe build spec

## Goal

Complete the Profile tab and everything downstream of it: real settings (currency, language, theme, notifications, biometric, reset day), data export (CSV + PDF), CSV import, full-app localization plumbing, a dark-mode audit, and an optional local auth scaffold. No Expo — bare React Native CLI.

## Non-goals (deferred)

- **Firebase Auth with native credentials.** Firebase requires a Google Cloud project plus `GoogleService-Info.plist` / `google-services.json`, neither of which can be generated from code. We ship an auth scaffold (`src/services/auth.ts`) with the Firebase/Google/Apple adapters behind a feature flag; today the app uses local-only auth (email + password hashed with a simple MMKV-backed store) so the UI and state machine exist and Firebase becomes a drop-in later.
- **Cloud sync.** Phase 8 concern.
- **Retranslating every single hardcoded string in every existing screen.** We'll translate the Profile surface + shared navigation/primitive strings fully, and install the i18n plumbing + key conventions so the remaining screens can be migrated incrementally.

## Architecture

Same layering as earlier phases: UI → Zustand store → SQLite/MMKV.

New modules:

- `src/screens/ProfileScreen.tsx` — fully rebuilt grouped-settings list
- `src/screens/EditProfileScreen.tsx` — name + email form (local-only for now)
- `src/screens/PremiumScreen.tsx` — static premium feature list with a "Dev Toggle" row (wired to `setPremium`) so QA can flip tiers without IAP
- `src/screens/LoginScreen.tsx` / `src/screens/RegisterScreen.tsx` — design-system forms, wired to the local auth service
- `src/screens/ExportScreen.tsx` — date range + include toggles + format picker
- `src/components/profile/CurrencyPickerSheet.tsx`
- `src/components/profile/LanguagePickerSheet.tsx`
- `src/components/profile/ThemePickerSheet.tsx`
- `src/components/profile/BudgetResetDayPickerSheet.tsx`
- `src/services/auth.ts` — local-auth facade with Firebase hook points
- `src/services/export/csv.ts` — transactions/subscriptions → CSV string
- `src/services/export/pdf.ts` — HTML template + html-to-pdf call (lazy-loaded)
- `src/services/export/share.ts` — thin wrapper around `react-native-share`
- `src/services/importer/csv.ts` — CSV → validated rows → insert
- `src/services/biometrics.ts` — lazy wrapper around `react-native-biometrics`
- `src/services/dataWipe.ts` — drop DB + clear MMKV
- `src/stores/useAuthStore.ts` — Zustand + MMKV persistence, mirrors auth service
- `src/utils/csv.ts` — CSV serialize/parse helpers with Turkish formatting

New deps (user must `pod install` after):

- `react-native-share`
- `react-native-html-to-pdf`
- `react-native-biometrics`

Firebase / Google / Apple Sign-In deps are **not** added yet — they need native configuration from the user. Auth service defines the interface so they slot in cleanly.

## Data flow

### Settings changes
1. UI calls `useSettingsStore.setX(value)` (e.g., `setLanguage('en')`).
2. Store writes the value + `persist` middleware flushes to MMKV.
3. Side effects: `setLanguage` also calls `i18n.changeLanguage(l)`; `setTheme` re-renders `ThemeProvider` via subscription.
4. `BudgetResetDayPickerSheet` / `CurrencyPickerSheet` / etc. are bottom sheets that call the setter and dismiss.

### CSV export
1. `ExportScreen` → `buildExport(range, flags)` collects rows from the three stores.
2. `services/export/csv.ts` serializes to `Tarih,Tür,Kategori,Tutar,Para Birimi,Not` (Turkish format: `DD.MM.YYYY`, decimal comma).
3. `react-native-fs` writes to `DocumentDirectoryPath/cepbutce-YYYYMMDD-HHmm.csv`.
4. `services/export/share.ts` opens Share sheet.

### PDF export (premium)
1. Same collection; `services/export/pdf.ts` renders an HTML string (CepBütçe header, summary table, transactions table) with inline CSS matching the design tokens.
2. `react-native-html-to-pdf` writes PDF to `DocumentDirectoryPath`.
3. Share sheet.
4. Gated by `isPremium`; free-tier tap opens the existing premium prompt pattern.

### CSV import
1. User picks file via `react-native-image-crop-picker` or `DocumentPicker` (we'll use a minimal native file intent — simplest: `react-native-fs` + `react-native-share`'s open variant). To keep deps tight, import flow uses `react-native-share`'s `open` or falls back to a text area paste for MVP.
2. `services/importer/csv.ts` parses rows, validates required columns, maps to transactions, inserts via `addTransaction` in a loop.
3. Toast summarizes success/fail counts.

### Data wipe
1. Double-confirm Alert (Turkish: "Tüm verileri silmek istediğinize emin misiniz?" → second: "Bu işlem geri alınamaz. Onaylıyor musunuz?").
2. `services/dataWipe.wipeAll()`: drop all DB tables, re-run migrations to reseed categories, clear MMKV keys (except language + theme to avoid jarring UX).
3. Reload all stores.
4. Toast + navigate to Dashboard root.

### Auth
1. `useAuthStore` holds `{ user: { id, name, email } | null, status }`.
2. `services/auth.ts` exposes `signIn`, `signUp`, `signOut` — today backed by MMKV + bcrypt-lite hash; Firebase adapter lives behind `if (AUTH_PROVIDER === 'firebase')` and throws a clear "not configured" error until deps are installed and this flag is flipped.
3. Profile screen shows initials + email when signed in; "Giriş Yap" CTA when not.

## i18n plumbing

- Expand `tr.json` / `en.json` with the complete key surface listed in the task spec (navigation, common buttons, Profile surface, Export surface, categories, date strings).
- Keep the existing minimal keys (`app.*`) working.
- Add `language` MMKV persistence that wins over device locale on next launch.
- Add `formatCurrency(amount, currency, locale)` already exists — good. Add `formatNumber(n, locale)` helper for non-currency numeric output.
- Refactor categories: keep `DEFAULT_CATEGORIES` in Turkish for DB storage (seed data), but the UI renders each via `t(\`categories.\${category.id}\`)` when a translation exists, falling back to `category.name`. This avoids a DB migration.
- **Do not** re-translate every existing screen today — audit and migrate the Profile tab + Export screen + shared primitives (EmptyState default copies, Button labels) this phase. A follow-up task migrates other screens.

## Dark-mode audit

1. Grep for hex colors in `src/screens/**` and `src/components/**` outside of the `theme/` tree — any hit is a candidate to convert to `theme.colors.*`.
2. Fix bottom-sheet `backgroundStyle` to use `theme.colors.bg.card` across all sheets.
3. Add `StatusBar` component to `App.tsx` (currently missing) that toggles `dark-content` / `light-content` by `isDark`.
4. Android: set `navigationBarColor` via `react-native-bars` or `StatusBar` setBackgroundColor. Acceptable to skip if it introduces a new dep — document as a known gap.
5. Manual visual check on Dashboard, Transactions, Subscriptions, Profile, Receipt screens — note any remaining leaks.

## Error handling

- All async work (share, PDF render, file write, biometric prompt, auth) returns `Result<T, Error>` via try/catch and surfaces via `Toast.show({ type: 'error' })`. Turkish error copies in `errors.*` i18n namespace.
- Import parser rejects malformed rows individually and reports `{ ok: n, failed: n }`.
- Biometric toggle: if `isSensorAvailable()` returns false, show info toast and keep the setting off.

## Testing

- Unit tests: `utils/csv.ts` (round-trip serialize/parse), `services/auth.ts` (hash + verify), `services/dataWipe.ts` (clears + reseeds).
- No integration tests for native share / PDF / biometrics — those are thin wrappers.
- Existing `__tests__/utils/currency.test.ts` continues to pass.

## Phase ordering (implementation)

1. Install new npm deps.
2. i18n: expand JSON + switch existing hardcoded strings on Profile/primitives.
3. Stores: `useAuthStore`, extend `useSettingsStore` if needed (it already has what we need).
4. Services: `auth`, `biometrics`, `export/csv`, `export/pdf`, `export/share`, `importer/csv`, `dataWipe`.
5. Components: four picker sheets.
6. Screens: `ProfileScreen` (rebuilt), `EditProfileScreen`, `PremiumScreen`, `LoginScreen`, `RegisterScreen`, `ExportScreen`.
7. Navigation: extend `ProfileStackParamList` with new screens.
8. Dark mode audit + fix bottom sheets + status bar.
9. Wire language change → `i18n.changeLanguage`.
10. Smoke-check `tsc --noEmit` and run existing tests.

## Known gaps carried forward

- Firebase Auth + Google/Apple Sign-In: scaffolded, not wired.
- Android navigation bar theming: not handled.
- Full-app retranslation beyond Profile/primitives: not done this phase.
- PDF styling fidelity vs the in-app design system: best-effort with inline CSS; no visual regression tests.
- CSV import file picker: uses a simple approach; dedicated `react-native-document-picker` can replace later.
