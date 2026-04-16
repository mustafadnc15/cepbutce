# Phase 0 — Project Scaffolding & Design System

**Date:** 2026-04-14
**Status:** Approved, ready for implementation plan
**Source spec:** [cepbutce-project-v2.md](../../../cepbutce-project-v2.md) lines 372–630

## Goal

Execute Phase 0 of the CepBütçe build: scaffold a bare React Native CLI project with the New Architecture, install and wire all native dependencies, lay down the theme system, reusable UI primitives, SQLite database with migrations, Zustand stores, and a provider-stack-complete `App.tsx` that renders a blank themed shell. **No screens, no navigation.**

## Context

- Repo is pre-scaffold; only `CLAUDE.md` and the spec file exist at root.
- Project instructions (`CLAUDE.md`) make bare RN (not Expo) a hard constraint, with a fixed stack: op-sqlite, react-native-mmkv, Zustand, NativeWind v4, Feather icons, bootsplash, Gorhom bottom-sheet, Reanimated, Gesture Handler.
- Toolchain verified present: Node 22, CocoaPods 1.16, Xcode, Android SDK.
- Git repo initialized at `budget-app/` root.

## Decisions

### Layout

Scaffold lives at the `budget-app/` repo root, alongside the spec, CLAUDE.md, and design docs. (Originally scaffolded into a nested `CepButce/` subdirectory, then flattened to root in commit `6c5b4d1` (or whichever the move commit ends up being). Path references below were updated post-move.)

### Execution cadence

Two checkpoints:

1. **Checkpoint 1** — scaffold complete, all native deps installed, `pod install` succeeds, Metro bundler starts cleanly. User runs the iOS simulator and Android emulator, confirms blank RN welcome screen renders, gives go-ahead.
2. **Checkpoint 2** — theme system, UI primitives, DB + migrations, stores, full provider stack in `App.tsx`. Blank themed shell renders.

### Build verification

User runs simulators; implementation verifies non-simulator signals (install exit codes, pod manifest, Metro startup, no missing native module warnings).

### Scaffold command

`npx @react-native-community/cli@latest init CepButce --skip-git-init`

- Drop the `--template react-native-template-typescript` flag from the original spec — that template is archived; current CLI emits TypeScript by default on RN 0.76+.
- `--skip-git-init` prevents a nested `.git` inside the scaffolded directory.

### New Architecture

On by default in RN 0.76+. Verify via `ios/Podfile.properties.json` (`"newArchEnabled": "true"`) and `android/gradle.properties` (`newArchEnabled=true`). If either value is missing or `false`, set it to `true` and rerun `pod install`. If already `true`, do nothing.

### CocoaPods

Use the bundler-pinned CocoaPods from the template: `cd ios && bundle install && bundle exec pod install`.

## Architecture

### Theme layer (`src/theme/`)

- Pure data modules: `colors.ts` (light + dark maps), `typography.ts`, `spacing.ts`, `shadows.ts`, `radius.ts`.
- `index.ts` barrel exports all tokens plus a `buildTheme(isDark: boolean)` helper returning the assembled theme object consumed by `useTheme()`.
- `ThemeProvider` is a React Context wrapper:
  - Reads `theme` preference (`'light' | 'dark' | 'system'`) from MMKV synchronously at module scope — MMKV is sync, so no flash on launch.
  - For `'system'`, subscribes to `useColorScheme()` from react-native.
  - Exposes `{ theme, isDark, themePreference, setThemePreference(pref) }` via `useTheme()`.
- `tailwind.config.js` pulls the same token values (via a `.js` shim that re-exports the TS tokens as CommonJS) so NativeWind classes and StyleSheet code stay in lockstep.

### UI primitives (`src/components/ui/`)

Nine components as specified: `Card`, `StatCard`, `IconBox`, `ListCard`, `Input`, `Button`, `SectionHeader`, `Chip`, `EmptyState`. Each consumes `useTheme()`, supports dark mode, accepts a style override prop, and uses Reanimated for press interactions where the spec requires animation. Haptics on `Button` press via `react-native-haptic-feedback`.

### Database layer (`src/db/`)

- `connection.ts` — opens `cepbutce.db` via op-sqlite and exports a singleton handle.
- `migrations.ts` — `migrations: Array<{ version: number, up: (db) => void }>`.
  - On boot: ensure `settings` table exists, read `db_version` key, apply any migration with `version > current` inside a transaction, bump `db_version`.
  - v1 migration creates all 5 tables (`transactions`, `categories`, `subscriptions`, `budgets`, `settings`) with the columns named in the spec, and seeds the 12 default Turkish categories (9 expense + 3 income).

### Store layer (`src/stores/`)

- **`useSettingsStore`** — Zustand + `persist` middleware backed by a custom MMKV storage adapter. This is the only store that persists through Zustand. Fields: `currency`, `language`, `theme`, `budgetResetDay`, `notificationsEnabled`, `isPremium`, `premiumExpiresAt`, `biometricLock`, `onboardingComplete`, `receiptScansThisMonth`.
- **`useTransactionStore`**, **`useSubscriptionStore`**, **`useBudgetStore`** — in-memory state hydrated from SQLite on mount; mutations write to SQLite first, then update local state. No Zustand persistence; SQLite is the source of truth. Getters are pure selectors over current state.

### App entry (`App.tsx`)

Provider stack, outside-in:

```
GestureHandlerRootView
  └── SafeAreaProvider
      └── ThemeProvider
          └── BottomSheetModalProvider
              └── NavigationContainer
                  └── <blank themed View with "CepBütçe" text>
  + <Toast /> (sibling)
```

On mount (`useEffect`):

1. Run DB migrations (blocks shell render via a minimal loading flag — no splash art yet).
2. Initialize i18next (detect system locale via `react-native-localize`, default `tr`, fallback `en`).
3. Hide bootsplash when providers are ready (`RNBootSplash.hide({ fade: true })`).

## Deferrals (explicit non-goals for Phase 0)

- **Bootsplash logo asset** — install the library and wire `hide()` but skip `generate-bootsplash` until a logo is provided. TODO left in `App.tsx`.
- **Screens** — per spec's final line, no screens beyond the blank shell.
- **Services** — `services/ocr.ts`, `services/notifications.ts`, `services/iap.ts` are **not** created. Owned by Phases 5, 7, 8.
- **Custom tab bar, RootNavigator, MainTabNavigator** — Phase 1.
- **i18n content** — `tr.json` / `en.json` contain only a handful of keys to prove the pipeline; full strings land in later phases.

## Risks and how they're handled

| Risk | Mitigation |
|------|------------|
| `pod install` fails on a New Arch peer dep | Stop at checkpoint 1, report the resolver output. Do not force-resolve. |
| Vector icon font doesn't copy correctly | Verify via `react-native.config.js` asset linking + `npx react-native-asset`. User confirms by seeing a Feather icon render on the shell (I'll add one to the placeholder). |
| op-sqlite / Reanimated / MMKV New Arch incompatibility | All three are New Arch compatible at their current major versions. If install surfaces a peer conflict, report rather than downgrade silently. |
| Theme flash on launch | MMKV sync read at module scope avoids the flash. |
| Scaffolding into a non-empty parent | Working dir `budget-app/` is non-empty, but `init CepButce` creates a child dir — no conflict at scaffold time. (Files are moved up to the root in a later restructure.) |

## Definition of done

- **Checkpoint 1 done when:** the scaffolded RN project exists at the repo root, `npm install` exits clean, `pod install` exits clean, Metro starts without errors, and the user has confirmed the stock RN welcome screen appears on both iOS simulator and Android emulator.
- **Checkpoint 2 done when:** all files listed in the spec's Step 6 folder structure exist with real content (except deferrals above), `App.tsx` uses the full provider stack, the shell renders a theme-aware blank view showing "CepBütçe" whose background color matches the active theme (switching the OS appearance and relaunching flips light/dark, since theme default is `'system'`), DB migrations run on first launch, and the `categories` table contains the 12 seeded rows (verifiable via a SELECT count logged once at boot).

## Out of scope for later phases

This phase does not make any decision about Phase 1+ implementation. Navigation, screens, the FAB, and all feature work begin after Phase 0 is signed off.
