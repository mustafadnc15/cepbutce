# CepBütçe — All-in-One Budget & Expense Tracker

## Project Description

**CepBütçe** (Turkish for "Pocket Budget") is a mobile-first personal finance app that combines three core tools into one clean, fast experience: expense tracking, subscription management, and receipt scanning. The app targets a massive market gap — existing budget apps either charge $10–20/month for basic features (Rocket Money, YNAB, Copilot) or bundle expense tracking into bloated enterprise suites (QuickBooks, Expensify). CepBütçe takes the opposite approach: give users a polished, free-core experience with a generous feature set, and monetize only premium features that have real server costs (OCR, cloud sync, export).

### Core Value Proposition

**"Your entire financial picture in one app — free."**

Most users currently juggle 2–3 apps: one for budgeting, one for tracking subscriptions, and a separate scanner for receipts. CepBütçe unifies these into a single, beautiful interface. The app is designed for freelancers, students, and budget-conscious individuals who want control over their money without paying a monthly subscription to get it.

### Target Audience

- **Primary**: Young professionals and freelancers (22–35) in Turkey and global markets who track spending manually or in spreadsheets
- **Secondary**: Students managing tight budgets who refuse to pay for YNAB ($109/yr)
- **Tertiary**: Small business owners / solo entrepreneurs who need receipt capture for tax purposes

### Monetization Strategy

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Unlimited manual expenses, 5 subscriptions, basic categories, monthly summary, local data |
| Premium | $2.99/mo or $19.99/yr | Unlimited subscriptions, receipt OCR (20/mo), cloud sync, CSV/PDF export, custom categories, multi-currency, widgets |
| Lifetime | $39.99 one-time | All premium features forever |

---

## Platform & Tech Stack

**Architecture: Bare React Native CLI — no Expo.** This gives full native module access, unrestricted linking, and freedom to use any community library without compatibility concerns.

### Core Framework

| Layer | Library | Why (not Expo) |
|-------|---------|----------------|
| Framework | **React Native CLI 0.76+** (New Architecture enabled) | Full native access, no managed workflow limits |
| Language | **TypeScript** (strict mode) | Type safety across the codebase |
| Build | **React Native CLI** + Xcode / Android Studio | Direct native builds, no EAS dependency |

### Navigation & UI

| Layer | Library | Why (not Expo) |
|-------|---------|----------------|
| Navigation | **React Navigation v7** (native-stack + bottom-tabs + material-top-tabs) | Industry standard, full control over custom tab bars |
| Bottom Sheets | **@gorhom/bottom-sheet v5** | Silky gesture-driven sheets, far superior to any Expo modal |
| Animations | **react-native-reanimated v3** | Worklet-based 60fps animations on UI thread |
| Gestures | **react-native-gesture-handler** | Native gesture system, swipe-to-delete, pull-to-refresh |
| Lists | **@shopify/flash-list** | 5x faster than FlatList for long transaction lists |
| SVG | **react-native-svg** | Icons, charts, custom graphics |
| Blur | **@react-native-community/blur** | Frosted glass effects on modals/sheets |
| Linear Gradient | **react-native-linear-gradient** | Header gradients, premium card backgrounds |
| Skeleton | **react-native-skeleton-placeholder** | Loading shimmer states |
| Toast | **react-native-toast-message** | Non-intrusive success/error feedback |

### Styling & Design

| Layer | Library | Why |
|-------|---------|-----|
| Styling | **NativeWind v4** (Tailwind CSS for RN) | Utility-first styling, fast iteration, dark mode built-in |
| Icons | **react-native-vector-icons** (Feather set) or **lucide-react-native** | Outline icon style matching the design system |
| Lottie | **lottie-react-native** | Micro-animations: success checkmarks, empty states, onboarding |
| Fast Image | **react-native-fast-image** | Cached receipt thumbnails, subscription logos |
| Skia (optional) | **@shopify/react-native-skia** | Custom donut charts, spending rings, gradient fills |

### Data & Storage

| Layer | Library | Why (not Expo) |
|-------|---------|----------------|
| Local DB | **op-sqlite** (or WatermelonDB for sync) | 5–10x faster than expo-sqlite, WAL mode, full SQL |
| KV Storage | **react-native-mmkv** | Fastest key-value store on RN, settings/preferences |
| State | **Zustand v5** | Lightweight, no boilerplate, MMKV persist middleware |

### Camera & Media

| Layer | Library | Why (not Expo) |
|-------|---------|----------------|
| Camera | **react-native-vision-camera v4** | Frame processors, barcode scanning, photo capture — most powerful camera lib in RN |
| Image Picker | **react-native-image-picker** | Gallery access, camera capture, cropping |
| Image Crop | **react-native-image-crop-picker** | Built-in crop/rotate UI for receipt photos |
| ML Kit OCR | **@react-native-ml-kit/text-recognition** | On-device text extraction (free tier) |

### Backend & Services

| Layer | Library | Why |
|-------|---------|-----|
| Auth | **@react-native-firebase/auth** | Email + Google + Apple sign-in |
| Firestore | **@react-native-firebase/firestore** | Cloud sync for premium users |
| Gemini API | **@google/generative-ai** (REST) | Premium receipt OCR with vision |
| IAP | **react-native-iap v12** | In-app purchases, subscription management |
| RevenueCat (alt) | **react-native-purchases** | Easier IAP if you want managed billing |

### Utilities

| Layer | Library | Why (not Expo) |
|-------|---------|----------------|
| Haptics | **react-native-haptic-feedback** | Precise haptic patterns (not just basic buzz) |
| Notifications | **@notifee/react-native** | Advanced local notifications, scheduled, categorized, action buttons |
| File System | **react-native-fs** | Read/write receipts, export files |
| Share | **react-native-share** | Share exported CSV/PDF files |
| Localization | **react-native-localize** + **i18next** + **react-i18next** | Device locale detection + translation |
| Date | **dayjs** (with locale plugins) | Lightweight date formatting, Turkish/English locales |
| PDF Gen | **react-native-html-to-pdf** | Premium export reports |
| Charts | **react-native-gifted-charts** or **victory-native** | Beautiful bar/line/donut charts, no web-view dependency |
| Biometrics | **react-native-biometrics** | Optional Face ID / fingerprint lock for financial data |
| Keychain | **react-native-keychain** | Secure storage for auth tokens |
| Splash | **react-native-bootsplash** | Faster, more controllable than default splash |
| StatusBar | **react-native-bars** or built-in StatusBar API | Per-screen status bar control |

---

## Design System Reference (Adapted from Piqup Template)

The app inherits the Piqup design language — a clean, card-based mobile UI with a signature green accent — but remaps it entirely for a finance context. No Piqup content, branding, or features are carried over. Only the visual system.

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `brand.primary` | `#00C864` | Primary buttons, active nav, header bg, income indicators |
| `brand.primaryTint` | `#E6F9EE` | Icon backgrounds, success states, income card bg |
| `brand.primaryLight` | `#F0FBF5` | Promo/stat card backgrounds |
| `brand.primaryBorder` | `#B8EDD1` | Bordered accent cards |
| `text.primary` | `#111111` | Headings, amounts, primary labels |
| `text.secondary` | `#888888` | Subtitles, descriptions, inactive tabs |
| `text.placeholder` | `#999999` | Input placeholders |
| `bg.page` | `#F5F5F5` | Screen background |
| `bg.card` | `#FFFFFF` | Card surfaces |
| `border.card` | `#E5E5E5` | Card borders (0.5px) |
| `semantic.error` | `#FF3B30` | Badges, overspend alerts, expense indicators |
| `semantic.warning` | `#FF9500` | Approaching budget limit |
| `semantic.expense` | `#FF3B30` | Expense amounts (red) |
| `semantic.income` | `#00C864` | Income amounts (green) |

### Dark Mode Tokens

| Token | Light | Dark |
|-------|-------|------|
| `bg.page` | `#F5F5F5` | `#0A0A0A` |
| `bg.card` | `#FFFFFF` | `#1C1C1E` |
| `text.primary` | `#111111` | `#F5F5F5` |
| `text.secondary` | `#888888` | `#A0A0A0` |
| `border.card` | `#E5E5E5` | `#2C2C2E` |
| `brand.primaryTint` | `#E6F9EE` | `#1A3D2A` |
| `brand.primaryLight` | `#F0FBF5` | `#162E20` |
| `brand.primary` | `#00C864` | `#00C864` (unchanged) |

### Typography Scale

| Size | Weight | Role | NativeWind class |
|------|--------|------|------------------|
| 28px | 700 | Page title | `text-[28px] font-bold` |
| 22–26px | 700 | Big number / stat | `text-[24px] font-bold` |
| 20px | 600 | Section heading | `text-[20px] font-semibold` |
| 17px | 600 | Card title / header banner | `text-[17px] font-semibold` |
| 14px | 600 | List item title / amount | `text-sm font-semibold` |
| 14px | 400 | Input text / body | `text-sm` |
| 13px | 400 | Greeting, descriptions | `text-[13px]` |
| 12px | 400 | Card subtitles, timestamps | `text-xs` |
| 11px | 400 | Captions, legal text | `text-[11px]` |
| 10px | 500 | Nav bar labels | `text-[10px] font-medium` |

**Font**: System font only — SF Pro (iOS) / Roboto (Android). No custom typefaces.

### Border Radius Scale

| Value | Usage | NativeWind |
|-------|-------|------------|
| 8px | Small inputs, tags | `rounded-lg` |
| 12px | Icon boxes | `rounded-xl` |
| 14px | Input containers | `rounded-[14px]` |
| 16–18px | Cards | `rounded-2xl` |
| 20–28px | Header corners, nav bar, modals | `rounded-[28px]` |
| 50% | FAB, avatar | `rounded-full` |

### Spacing Scale

Base unit: 4px. Scale: 4, 8, 12, 16, 20, 24.

- Card inner padding: 14–16px
- Row gap between cards: 10–12px
- Screen horizontal padding: 16–18px

### Component Patterns

**Content Card** (icon + text + arrow):
- Surface: `#FFFFFF`, border `0.5px #E5E5E5`, `borderRadius: 16`
- Shadow (iOS): `shadowColor: '#000'`, `shadowOpacity: 0.05`, `shadowOffset: {0, 2}`, `shadowRadius: 8`. Android: `elevation: 2`
- Icon box: 44×44, `borderRadius: 12`, bg = brand primary at 10–12% opacity (`#E6F9EE`)
- Icon: outline style, stroke uses brand primary
- Layout: `flexDirection: 'row'`, `alignItems: 'center'`, `padding: 14–16`, `gap: 12`

**Stat/Promo Card** (tinted surface):
- Background: brand primary at ~8% opacity (`#F0FBF5`)
- Border: brand at ~30% (`#B8EDD1`)
- Big number: 22–26px/700, brand green
- Used for: balance display, budget remaining, savings goals

**Input** (with optional prefix):
- Container: `borderRadius: 14`, border `1px #E5E5E5`, bg white
- Focus state: border color → brand primary
- Text: 14px/400, placeholder `#999`

**Green Header**:
- Background: `#00C864` flat fill (no gradient)
- Bottom corners rounded (24–28px), top bleeds into status bar
- Greeting: 13px/400, white 80% opacity
- Title: 17px/600, white 100%
- StatusBar: `barStyle="light-content"`

**Bottom Navigation**:
- White bg, `borderRadius: 20` top, `borderTopWidth: 0.5px #E5E5E5`
- Regular tab: 20px icon (outline, inactive `#888`), 10px/500 label
- Active tab: icon + label → `#00C864`
- Center FAB: 50–54px circle, bg `#00C864`, green shadow (`shadowColor: '#00C864'`, `shadowOpacity: 0.35`, `elevation: 6`), floats 18–20px above bar via negative `marginTop`
- Use custom `tabBar` prop — never default tab bar

---

## App Architecture

### Screen Map

```
RootStack (native-stack)
├── Onboarding (shown once)
├── MainTabs (bottom-tabs, custom tabBar)
│   ├── Dashboard (Home)
│   │   ├── Header (greeting + total balance)
│   │   ├── Budget summary card (spent / remaining)
│   │   ├── Recent transactions list
│   │   └── Quick stats + insights
│   │
│   ├── Transactions
│   │   ├── Search bar + filter chips
│   │   ├── Date range picker
│   │   ├── Grouped transaction list (FlashList)
│   │   └── Monthly summary bar
│   │
│   ├── [FAB] → opens Add Transaction BottomSheet
│   │
│   ├── Subscriptions
│   │   ├── Cost overview cards
│   │   ├── Upcoming renewals carousel
│   │   └── All subscriptions list
│   │
│   └── Profile / Settings
│       ├── Account, preferences, data, about
│       └── Premium upgrade
│
├── AddTransaction (BottomSheet via @gorhom/bottom-sheet)
├── AddSubscription (BottomSheet)
├── ReceiptScanner (full-screen stack)
├── ReceiptResults (stack)
├── BudgetBreakdown (stack)
├── Export (stack)
└── Premium (stack)
```

### Data Models

```typescript
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  categoryId: string;
  note?: string;
  date: string; // ISO 8601
  receiptUri?: string;
  receiptOcrData?: ReceiptOCR;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: string; // icon name from react-native-vector-icons (Feather set) or Lucide
  color: string;
  type: 'expense' | 'income' | 'both';
  isDefault: boolean;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  categoryId: string;
  startDate: string;
  nextRenewalDate: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive: boolean;
  remindBefore: number; // days before renewal
  createdAt: string;
}

interface Budget {
  id: string;
  categoryId?: string; // null = overall budget
  amount: number;
  period: 'weekly' | 'monthly';
  currency: string;
}

interface ReceiptOCR {
  vendor?: string;
  total?: number;
  date?: string;
  items?: { name: string; amount: number }[];
  rawText: string;
}

interface UserSettings {
  currency: string;
  language: 'tr' | 'en';
  theme: 'light' | 'dark' | 'system';
  budgetResetDay: number;
  notificationsEnabled: boolean;
  isPremium: boolean;
  premiumExpiresAt?: string;
  biometricLock: boolean;
}
```

### Default Categories

```typescript
const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: 'food', name: 'Yemek & İçecek', icon: 'coffee', color: '#FF9500', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Ulaşım', icon: 'navigation', color: '#007AFF', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Alışveriş', icon: 'shopping-bag', color: '#FF2D55', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Faturalar', icon: 'file-text', color: '#5856D6', type: 'expense', isDefault: true },
  { id: 'health', name: 'Sağlık', icon: 'heart', color: '#FF3B30', type: 'expense', isDefault: true },
  { id: 'entertainment', name: 'Eğlence', icon: 'film', color: '#AF52DE', type: 'expense', isDefault: true },
  { id: 'education', name: 'Eğitim', icon: 'book-open', color: '#00C864', type: 'expense', isDefault: true },
  { id: 'housing', name: 'Konut & Kira', icon: 'home', color: '#8E8E93', type: 'expense', isDefault: true },
  { id: 'other_expense', name: 'Diğer', icon: 'more-horizontal', color: '#C7C7CC', type: 'expense', isDefault: true },
  // Income
  { id: 'salary', name: 'Maaş', icon: 'briefcase', color: '#00C864', type: 'income', isDefault: true },
  { id: 'freelance', name: 'Freelance', icon: 'monitor', color: '#30D158', type: 'income', isDefault: true },
  { id: 'other_income', name: 'Diğer Gelir', icon: 'plus-circle', color: '#34C759', type: 'income', isDefault: true },
];
```

---

## Building Phases

### Phase 0 — Project Scaffolding & Design System
### Phase 1 — Dashboard & Navigation Shell
### Phase 2 — Add Transaction Flow
### Phase 3 — Transaction History & Filtering
### Phase 4 — Subscription Tracker
### Phase 5 — Receipt Scanner (Camera + OCR)
### Phase 6 — Budget System & Insights
### Phase 7 — Settings, Export & Localization
### Phase 8 — Premium / Paywall & Polish

---

## Claude Code Build Prompts

---

### PHASE 0 — Project Scaffolding & Design System

```
You are building a React Native (BARE CLI — NOT Expo) mobile app called "CepBütçe" — an all-in-one budget tracker with expense tracking, subscription management, and receipt scanning.

CRITICAL: This is a BARE React Native project. Do NOT use any expo-* packages. Do NOT use Expo Router. Do NOT use any Expo managed workflow tooling. Use React Native CLI and community libraries only.

TASK: Initialize the project and set up the design system foundation.

STEP 1 — SCAFFOLD
- Create a new bare React Native project:
  `npx @react-native-community/cli init CepButce --template react-native-template-typescript`
- Enable the New Architecture (Fabric + TurboModules) in both iOS and Android configs
- Install and configure core dependencies in this exact order:

Navigation:
  - @react-navigation/native
  - @react-navigation/native-stack
  - @react-navigation/bottom-tabs
  - react-native-screens
  - react-native-safe-area-context

UI & Animation:
  - react-native-reanimated (configure babel plugin)
  - react-native-gesture-handler (wrap root with GestureHandlerRootView)
  - @gorhom/bottom-sheet (depends on reanimated + gesture-handler)
  - react-native-svg
  - react-native-vector-icons (configure Feather font in iOS Info.plist + Android assets)
  - react-native-fast-image
  - react-native-linear-gradient
  - react-native-haptic-feedback
  - react-native-toast-message
  - react-native-skeleton-placeholder
  - lottie-react-native
  - @react-native-community/blur

Styling:
  - nativewind@^4.0.0 + tailwindcss (configure tailwind.config.js, babel preset, metro.config.js)
  - Configure NativeWind following their v4 bare RN guide — NOT the Expo guide

Data:
  - react-native-mmkv
  - op-sqlite (follow their native linking guide for iOS + Android)
  - zustand

Utilities:
  - dayjs (install 'tr' and 'en' locale plugins)
  - react-native-localize
  - i18next + react-i18next
  - react-native-bootsplash (configure splash screen)

Run `cd ios && pod install` after all native deps.
Verify the project builds and runs on both iOS simulator and Android emulator before proceeding.

STEP 2 — DESIGN SYSTEM THEME FILE
Create `src/theme/colors.ts`, `src/theme/typography.ts`, `src/theme/spacing.ts`, `src/theme/shadows.ts`, and `src/theme/index.ts` (barrel export). This is the SINGLE SOURCE OF TRUTH for all visual values. Every component must import from here — never hardcode colors, sizes, or spacing.

Colors (light mode):
  brand: { primary: '#00C864', primaryTint: '#E6F9EE', primaryLight: '#F0FBF5', primaryBorder: '#B8EDD1' }
  text: { primary: '#111111', secondary: '#888888', placeholder: '#999999', white: '#FFFFFF' }
  bg: { page: '#F5F5F5', card: '#FFFFFF' }
  border: { card: '#E5E5E5', input: '#E5E5E5' }
  semantic: { error: '#FF3B30', warning: '#FF9500', income: '#00C864', expense: '#FF3B30' }

Colors (dark mode):
  bg: { page: '#0A0A0A', card: '#1C1C1E' }
  text: { primary: '#F5F5F5', secondary: '#A0A0A0', placeholder: '#666666' }
  border: { card: '#2C2C2E', input: '#3A3A3C' }
  brand.primaryTint: '#1A3D2A'
  brand.primaryLight: '#162E20'
  (brand.primary stays #00C864)

Create a ThemeProvider using React Context that:
  - Reads preference from MMKV ('light' | 'dark' | 'system')
  - For 'system': uses `useColorScheme()` from react-native
  - Exposes `theme` object + `isDark` boolean + `toggleTheme()` function
  - All components consume via `useTheme()` hook

Typography — system font only, no custom fonts:
  pageTitle: { fontSize: 28, fontWeight: '700' }
  bigNumber: { fontSize: 24, fontWeight: '700' }
  sectionHead: { fontSize: 20, fontWeight: '600' }
  cardTitle: { fontSize: 17, fontWeight: '600' }
  listTitle: { fontSize: 14, fontWeight: '600' }
  body: { fontSize: 14, fontWeight: '400' }
  greeting: { fontSize: 13, fontWeight: '400' }
  subtitle: { fontSize: 12, fontWeight: '400' }
  caption: { fontSize: 11, fontWeight: '400' }
  navLabel: { fontSize: 10, fontWeight: '500' }

Radius: { sm: 8, md: 12, input: 14, card: 16, lg: 20, header: 28, full: 9999 }
Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }

Shadows:
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
    android: { elevation: 2 }
  })
  fab: Platform.select({
    ios: { shadowColor: '#00C864', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    android: { elevation: 6 }
  })

Also configure the NativeWind tailwind.config.js to include these as custom theme values so we can use both approaches (StyleSheet for complex logic, NativeWind for layout).

STEP 3 — REUSABLE UI COMPONENTS
Create these in `src/components/ui/`. Each component must:
  - Use the theme via `useTheme()` hook
  - Support dark mode automatically
  - Accept style override props
  - Use reanimated for press/interaction animations

1. `Card.tsx` — White surface card. Props: children, style?, onPress?, variant ('default' | 'tinted').
   Default: bg card color, 0.5px border, borderRadius 16, padding 14-16, card shadow.
   Tinted: bg primaryLight, border 0.5px primaryBorder.
   If onPress provided: wrap in Pressable with scale animation (0.98 on press via reanimated).

2. `StatCard.tsx` — Tinted stat card. Props: label (string), value (string), valueColor?, icon?.
   Uses Card variant='tinted'. Value: 24px/700. Label: 12px/400 secondary.

3. `IconBox.tsx` — 44x44 icon container, borderRadius 12. Props: iconName, iconColor?, bgColor?, size?.
   Default bg: brand.primaryTint. Icon from react-native-vector-icons Feather set.

4. `ListCard.tsx` — Row card: IconBox left + title/subtitle center + right element.
   Props: icon, iconColor, iconBg?, title, subtitle?, right? (ReactNode), onPress?.
   Uses Card as wrapper. Layout: flexDirection row, alignItems center, gap 12.

5. `Input.tsx` — Text input with optional prefix. Props: prefix?, prefixIcon?, placeholder, value, onChangeText, keyboardType?, error?, focused styling.
   Container: borderRadius 14, border 1px, bg card.
   Focus: border → brand.primary (animated color transition via reanimated).
   Error: border → semantic.error, error message below.

6. `Button.tsx` — Props: title, onPress, variant ('primary' | 'secondary' | 'danger' | 'ghost'), loading?, disabled?, icon?.
   Primary: bg brand.primary, white text, borderRadius 14, height 50.
   Secondary: bg transparent, border 1px brand.primary, green text.
   Danger: bg semantic.error, white text.
   Loading: ActivityIndicator replaces text.
   Press animation: scale(0.98) via reanimated.
   Haptic feedback on press via react-native-haptic-feedback.

7. `SectionHeader.tsx` — Props: title, actionLabel?, onAction?.
   Title: 13px/500 uppercase, secondary color, letterSpacing 0.5.
   Action: 13px/500 brand.primary, right-aligned.

8. `Chip.tsx` — Filter chip / pill. Props: label, active?, onPress?.
   Active: bg brand.primary, white text. Inactive: bg card, border 0.5px, text secondary.
   BorderRadius: full (pill). Padding: 8 horizontal, 16 vertical.

9. `EmptyState.tsx` — Props: icon, title, subtitle?, actionLabel?, onAction?.
   Centered layout: large Lottie or icon, title 17px/600, subtitle 13px/400 secondary.
   Optional CTA button below.

STEP 4 — DATABASE SETUP
Create `src/db/connection.ts` and `src/db/migrations.ts` using op-sqlite:
- Open/create database named 'cepbutce.db'
- Define tables:
  - transactions (id TEXT PK, amount REAL, currency TEXT, type TEXT, categoryId TEXT, note TEXT, date TEXT, receiptUri TEXT, receiptOcrData TEXT, createdAt TEXT, updatedAt TEXT)
  - categories (id TEXT PK, name TEXT, icon TEXT, color TEXT, type TEXT, isDefault INTEGER)
  - subscriptions (id TEXT PK, name TEXT, amount REAL, currency TEXT, billingCycle TEXT, categoryId TEXT, startDate TEXT, nextRenewalDate TEXT, icon TEXT, color TEXT, note TEXT, isActive INTEGER, remindBefore INTEGER, createdAt TEXT)
  - budgets (id TEXT PK, categoryId TEXT, amount REAL, period TEXT, currency TEXT)
  - settings (key TEXT PK, value TEXT)
- Write a versioned migration system: check current version in settings table, run pending migrations
- Seed default categories on first launch (Turkish names):
  Expenses: Yemek & İçecek (coffee, #FF9500), Ulaşım (navigation, #007AFF), Alışveriş (shopping-bag, #FF2D55), Faturalar (file-text, #5856D6), Sağlık (heart, #FF3B30), Eğlence (film, #AF52DE), Eğitim (book-open, #00C864), Konut & Kira (home, #8E8E93), Diğer (more-horizontal, #C7C7CC)
  Income: Maaş (briefcase, #00C864), Freelance (monitor, #30D158), Diğer Gelir (plus-circle, #34C759)

STEP 5 — ZUSTAND STORES
Create stores in `src/stores/` with MMKV persistence middleware:

- `useTransactionStore.ts`:
  State: transactions[], loading, error
  Actions: addTransaction, updateTransaction, deleteTransaction, loadTransactions (from SQLite)
  Getters: getByDateRange, getByCategory, getByType, getRecentN, getTotalByType

- `useSubscriptionStore.ts`:
  State: subscriptions[], loading
  Actions: add, update, delete, toggleActive, loadAll
  Computed: totalMonthly (normalize all cycles), totalYearly, upcomingRenewals (sorted by nearest)

- `useBudgetStore.ts`:
  State: budgets[], overallBudget
  Actions: setBudget, removeBudget, loadAll
  Computed: spentThisMonth (from transactions), remainingThisMonth, spentByCategory

- `useSettingsStore.ts`:
  State: currency, language, theme, budgetResetDay, notificationsEnabled, isPremium, premiumExpiresAt, biometricLock, onboardingComplete, receiptScansThisMonth
  Persisted to MMKV directly (not SQLite — fast read on app start)

STEP 6 — FOLDER STRUCTURE
```
src/
├── components/
│   ├── ui/                    # Design system (Card, Button, Input, etc.)
│   ├── navigation/            # CustomTabBar
│   ├── dashboard/             # DashboardHeader, BudgetRing, QuickActions
│   ├── transactions/          # TransactionRow, FilterChips, DateRangePicker
│   ├── subscriptions/         # SubscriptionCard, CostOverview, RenewalCard
│   └── scanner/               # CameraOverlay, ReceiptPreview, OcrResultFields
├── screens/
│   ├── DashboardScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── SubscriptionsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── AddTransactionSheet.tsx
│   ├── AddSubscriptionSheet.tsx
│   ├── ReceiptScannerScreen.tsx
│   ├── ReceiptResultsScreen.tsx
│   ├── BudgetBreakdownScreen.tsx
│   ├── ExportScreen.tsx
│   ├── PremiumScreen.tsx
│   └── OnboardingScreen.tsx
├── navigation/
│   ├── RootNavigator.tsx       # Stack: Onboarding → MainTabs
│   ├── MainTabNavigator.tsx    # Bottom tabs with custom bar
│   └── types.ts                # Navigation type definitions
├── db/
│   ├── connection.ts
│   └── migrations.ts
├── stores/                     # Zustand stores
├── services/
│   ├── ocr.ts                  # ML Kit + Gemini OCR service
│   ├── notifications.ts        # Notifee scheduling helpers
│   └── iap.ts                  # In-app purchase service
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   └── index.ts
├── i18n/
│   ├── index.ts                # i18next config
│   ├── tr.json
│   └── en.json
├── utils/
│   ├── currency.ts             # Format ₺1.234,56 / $1,234.56
│   ├── date.ts                 # Relative dates, Turkish months
│   └── id.ts                   # UUID generation
├── types/
│   └── index.ts                # All TypeScript interfaces
└── constants/
    ├── categories.ts
    └── currencies.ts
```

STEP 7 — APP ENTRY POINT
Set up `App.tsx`:
  - GestureHandlerRootView wrapping everything
  - SafeAreaProvider
  - ThemeProvider
  - BottomSheetModalProvider (from @gorhom/bottom-sheet)
  - NavigationContainer
  - Toast component (from react-native-toast-message)
  - Initialize database on mount (useEffect)
  - Initialize i18next on mount
  - RootNavigator as main content

DO NOT build any screens yet. This phase is ONLY scaffolding, theme, components, database, and stores. Everything should compile and run on both platforms showing a blank app shell.
```

---

### PHASE 1 — Dashboard & Custom Navigation

```
You are continuing the CepBütçe bare React Native app. Phase 0 (scaffolding, design system, DB, stores) is complete.

CRITICAL: No Expo packages. This is bare React Native with react-native-vector-icons, react-native-reanimated, @gorhom/bottom-sheet, etc.

TASK: Build the Dashboard (home) screen and custom bottom navigation bar.

IMPORTANT DESIGN RULES (apply to ALL phases from now on):
- Import ALL visual values from src/theme — never hardcode colors, sizes, or radii
- Use useTheme() hook to get the current theme (supports dark mode)
- System font only (no custom fonts)
- Cards: bg card, 0.5px border, borderRadius 16, platform shadow
- Screen bg: bg.page from theme
- Horizontal screen padding: 16–18px
- Card gap: 10–12px
- All pressable elements: reanimated scale animation (0.98) + haptic feedback

STEP 1 — CUSTOM BOTTOM TAB BAR
Create `src/components/navigation/CustomTabBar.tsx`:
- Receives the standard BottomTabBar props from @react-navigation/bottom-tabs
- 4 tabs: Dashboard (home icon), Transactions (file-text icon), Subscriptions (repeat icon), Profile (user icon)
- Center floating FAB button ("+" add button) between tabs 2 and 3 — this is NOT a tab, it's a standalone Pressable
- Tab bar container: bg card, borderTopLeftRadius 20, borderTopRightRadius 20, borderTopWidth 0.5px border color, height ~60px + SafeArea bottom inset (from react-native-safe-area-context useSafeAreaInsets)
- Regular tab: Feather icon (20px, stroke color text.secondary), label below (10px/500 text.secondary)
- Active tab: icon stroke + label color → brand.primary. Use reanimated to animate color transition
- FAB button: 52px circle, bg brand.primary, white Feather "plus" icon (24px) inside. Positioned with negative marginTop -18px so it floats above the bar. Shadow: fab shadow from theme
- FAB press → open AddTransaction bottom sheet (will be built in Phase 2 — for now, just console.log or show toast)
- FAB has a spring scale animation on press (reanimated withSpring)
- Register this as the `tabBar` prop in the Tab.Navigator — NEVER use the default bar

Create `src/navigation/MainTabNavigator.tsx`:
- Uses @react-navigation/bottom-tabs createBottomTabNavigator
- 4 screens: Dashboard, Transactions, Subscriptions, Profile
- Custom tab bar component
- Each screen wrapped in its own native-stack for future sub-screens

STEP 2 — GREEN HEADER COMPONENT
Create `src/components/dashboard/DashboardHeader.tsx`:
- Green header banner at top of Dashboard
- Background: brand.primary FLAT fill (no gradient, no LinearGradient here)
- Shape: View with borderBottomLeftRadius 28, borderBottomRightRadius 28
- StatusBar: set to light-content (white icons) when this screen is focused. Use React Navigation's useFocusEffect to set/reset.
- SafeArea: add paddingTop from useSafeAreaInsets so content doesn't overlap the notch/status bar
- Content:
  - Greeting: time-aware text — "İyi Sabahlar" (06-12), "İyi Günler" (12-18), "İyi Akşamlar" (18-22), "İyi Geceler" (22-06) + ", Mustafa 👋" → 13px/400 white 80% opacity
  - Balance: "₺X,XXX.XX" → 28px/700 white. Format using currency util (Turkish: dots for thousands, comma for decimals)
  - Subtitle: "Toplam Bakiye" → 12px/400 white 70% opacity
- Right side: notification bell icon (Feather "bell") in a glass pill: bg rgba(255,255,255,0.18), borderRadius 12, 44×44, pressable with haptic. Use @react-native-community/blur or just the rgba bg
- Entering animation: balance number counts up from 0 using reanimated (optional, nice-to-have)

STEP 3 — DASHBOARD SCREEN
Build `src/screens/DashboardScreen.tsx`:
- Full screen with bg.page background
- DashboardHeader at top (NOT inside ScrollView — stays fixed)
- ScrollView below the header with the following sections:

Section 1 — Budget Summary:
- Uses StatCard (tinted variant)
- Shows: "Bu Ay Harcanan" label, "₺X,XXX" value in large text
- Below the number: a horizontal progress bar (View with inner View, borderRadius full)
  - Width = (spent / budget) percentage, max 100%
  - Color: green (0–60%), orange (60–85%), red (85%+)
  - Background track: rgba of border color
- Below bar: "₺X,XXX kaldı" (remaining) → 12px/400 secondary
- Entire card tappable → will navigate to BudgetBreakdown in Phase 6

Section 2 — Quick Actions:
- Horizontal ScrollView (showsHorizontalScrollIndicator false)
- 3 small action cards, each ~100px wide:
  1. "Harcama Ekle" — icon: minus-circle, iconBg: tinted red (#FFEAE9)
  2. "Gelir Ekle" — icon: trending-up, iconBg: tinted green (#E6F9EE)
  3. "Fiş Tara" — icon: camera, iconBg: tinted blue (#E8F0FE)
- Each: Card component, IconBox centered on top (36x36), label below (11px/400 centered)
- Press → respective action (bottom sheet / scanner)

Section 3 — Recent Transactions:
- SectionHeader: "Son İşlemler" with "Tümünü Gör →" action (navigates to Transactions tab)
- Last 5 transactions using ListCard
- Each: category IconBox with category-specific color tint, title (note or category name), date subtitle (relative: "Bugün", "Dün", "2 gün önce"), amount right-aligned (red "−₺XX" for expense, green "+₺XX" for income, 14px/600)
- Empty state: EmptyState component with message "Henüz işlem yok" + CTA "İlk harcamanı ekle"

Section 4 — Upcoming Subscriptions:
- SectionHeader: "Yaklaşan Yenilemeler"
- Horizontal ScrollView of next 3 upcoming renewal cards
- Each: small Card, subscription icon/initial circle at top, name (14px/600), amount + "X gün sonra" below
- Empty: "Henüz abonelik yok"

Pull-to-refresh: use RefreshControl on ScrollView, reload data from stores.
Seed demo data: create a `seedDemoData()` function in a `src/utils/seed.ts` that populates stores with realistic sample transactions and subscriptions so the dashboard looks populated during development. Call it from a dev-only button or on first launch in __DEV__ mode.
```

---

### PHASE 2 — Add Transaction Flow

```
You are continuing the CepBütçe bare React Native app. Phases 0–1 are complete.

CRITICAL: No Expo. Use @gorhom/bottom-sheet for the modal, react-native-haptic-feedback for haptics, react-native-reanimated for animations.

TASK: Build the "Add Transaction" bottom sheet — the core interaction of the entire app.

STEP 1 — BOTTOM SHEET SETUP
Create `src/screens/AddTransactionSheet.tsx`:
- This is NOT a navigation screen. It is a @gorhom/bottom-sheet BottomSheetModal.
- Controlled from the Dashboard (or FAB) via a ref: `bottomSheetRef.current?.present()`
- Snap points: ['92%'] (nearly full screen)
- Has a drag handle at top (default @gorhom style)
- BottomSheetScrollView inside for scrollable content
- Background: bg.card from theme
- Backdrop: BottomSheetBackdrop with opacity 0.5, pressBehavior 'close'
- Use BottomSheetTextInput (from @gorhom/bottom-sheet) instead of regular TextInput for inputs inside the sheet — this fixes keyboard issues

Create a global BottomSheet manager so the FAB from CustomTabBar can trigger it:
  - Option A: Use a Zustand store with `showAddTransaction: boolean` + a ref
  - Option B: Use React Context to pass the sheet ref from the root layout to the tab bar
  Choose whichever is cleaner. The FAB press should open this sheet from anywhere in the app.

STEP 2 — EXPENSE / INCOME TOGGLE
- Two-segment toggle at the top of the sheet
- Labels: "Harcama" (Expense) | "Gelir" (Income)
- Container: bg.page background, borderRadius 14, padding 4
- Active segment: animated sliding background pill (reanimated). For Expense: bg semantic.expense (#FF3B30), white text. For Income: bg brand.primary (#00C864), white text
- Inactive: transparent bg, text.secondary color
- Animation: the pill background slides between positions using useSharedValue + useAnimatedStyle (translateX interpolation)
- Haptic: trigger 'impactLight' on toggle via react-native-haptic-feedback

STEP 3 — AMOUNT INPUT
- Large centered amount display: currency symbol + "0" initially
- Currency symbol from settings (default "₺"), displayed as prefix
- Amount text: 32px/700, color = semantic.expense when Expense mode, brand.primary when Income mode
- Below: custom numeric keypad (NOT the system keyboard — hide it)
  - 4 rows × 3 columns grid:
    Row 1: [1] [2] [3]
    Row 2: [4] [5] [6]
    Row 3: [7] [8] [9]
    Row 4: [,] [0] [⌫]
  - Each key: height 56px, borderRadius 12, bg card, flex 1 with gap 8
  - Active press state: bg bg.page (slightly darker) via reanimated
  - Decimal separator: comma "," (Turkish format). If locale is EN, show "."
  - Backspace key: Feather "delete" icon, long-press to clear all (with haptic)
  - Haptic: 'impactLight' on each key press
  - Max 2 decimal places, max reasonable amount (999,999.99)
  - Display with Turkish formatting as user types: 1.234,56

STEP 4 — CATEGORY PICKER
- Section label: "Kategori" → SectionHeader component
- Horizontal ScrollView or 3-column grid of category pills/buttons
- Each: borderRadius 12, padding 10, centered column layout
  - IconBox (36×36) with category's specific color tint background
  - Category name below (11px/400)
  - Selected state: 2px border in category's color + subtle bg tint of that color
  - Selection animation: spring scale via reanimated
- Show expense categories when "Harcama" active, income categories for "Gelir"
- Last slot: "+" icon with "Diğer" label (for custom category — show premium lock icon if free user)

STEP 5 — DATE PICKER
- Default: today, displayed as "Bugün, 14 Nisan 2026"
- Uses a compact card row: calendar icon + formatted date + chevron-down icon
- Tapping opens @react-native-community/datetimepicker (or custom date picker in a nested bottom sheet)
- Date formatted using dayjs with Turkish locale

STEP 6 — NOTE FIELD
- Optional: uses BottomSheetTextInput
- Placeholder: "Not ekle..."
- Single line, uses the Input component from design system
- 14px/400, borderRadius 14

STEP 7 — RECEIPT PHOTO ATTACHMENT
- Small card row: camera icon + "Fiş Ekle" label + chevron
- On press: show a small action sheet (another BottomSheet or Alert.alert):
  - "Fotoğraf Çek" → opens react-native-image-crop-picker camera
  - "Galeriden Seç" → opens react-native-image-crop-picker gallery picker
  - "İptal" (Cancel)
- After photo selected: show thumbnail (FastImage, 60x60, borderRadius 8) with an X button overlay to remove
- Photo saved to app's document directory via react-native-fs
- Actual OCR processing happens later (Phase 5)

STEP 8 — SAVE BUTTON
- Sticky at bottom of sheet (not inside ScrollView — use absolute positioning or BottomSheet footerComponent)
- Primary Button: "Kaydet" — full width
- Disabled (opacity 0.5) until: amount > 0 AND category selected
- On save:
  1. Create transaction object with UUID (use uuid or nanoid)
  2. Save to Zustand store (which writes to SQLite)
  3. Trigger haptic 'notificationSuccess'
  4. Show toast: "Harcama kaydedildi ✓" or "Gelir kaydedildi ✓"
  5. Dismiss the bottom sheet
  6. Dashboard auto-updates (Zustand reactivity)

STEP 9 — EDIT MODE
- The same sheet should accept an optional `transaction` prop
- When provided: pre-populate all fields, change button text to "Güncelle"
- Add a trash icon button in the sheet header (next to the drag handle area)
  - On press: show destructive confirmation Alert: "Bu işlemi silmek istediğinize emin misiniz?"
  - Confirm: delete from store, dismiss sheet, show toast "İşlem silindi"
```

---

### PHASE 3 — Transaction History & Filtering

```
You are continuing the CepBütçe bare React Native app. Phases 0–2 are complete.

CRITICAL: No Expo. Use @shopify/flash-list for the list, react-native-gesture-handler for swipe, @gorhom/bottom-sheet for pickers.

TASK: Build the Transactions tab — a searchable, filterable, scrollable history of all transactions.

STEP 1 — SCREEN LAYOUT
Create `src/screens/TransactionsScreen.tsx`:
- Page title: "İşlemler" (28px/700) at top left
- bg.page background
- Below title: search input + filters + list

STEP 2 — SEARCH BAR
- Input component with Feather "search" icon as prefix
- Placeholder: "İşlem ara..."
- Filters transactions by note text and category name
- Debounced search (300ms) to avoid excessive re-renders
- Clear button (X icon) appears when text is entered

STEP 3 — FILTER CHIPS
- Horizontal ScrollView below search bar
- Uses Chip component from design system
- Chips: "Tümü", "Harcama", "Gelir", then category chips (only categories with transactions)
- Single-select: tapping one deactivates others
- Active: bg brand.primary + white text. Inactive: bg card + border + text.secondary
- Animated transitions between states (reanimated)

STEP 4 — DATE RANGE SELECTOR
- Compact row below chips: calendar icon + current range text + chevron-down
- Default: "Bu Ay" (This Month)
- Tapping opens a BottomSheet with options:
  "Bugün" (Today), "Bu Hafta" (This Week), "Bu Ay" (This Month), "Son 3 Ay" (Last 3 Months), "Bu Yıl" (This Year), "Tüm Zamanlar" (All Time), "Özel Aralık..." (Custom Range)
- Custom Range: show two date pickers (start + end) inside the bottom sheet
- Display: "1 Nis – 14 Nis 2026" format

STEP 5 — MONTHLY SUMMARY BAR
- Sticky card below filters (does NOT scroll with the list)
- Three inline stats: "Gelir: +₺X,XXX" (green) | "Gider: −₺X,XXX" (red) | "Net: ₺X,XXX" (primary or red if negative)
- Card style: bg card, borderRadius 12, subtle shadow, padding 12
- Values update dynamically based on active filters

STEP 6 — TRANSACTION LIST
- Uses @shopify/flash-list (estimatedItemSize: 72)
- Data grouped by date. Section headers: "Bugün", "Dün", "13 Nisan 2026", etc.
  - Use FlashList's stickyHeaderIndices or a custom section header approach
  - Header: 12px/500 uppercase, text.secondary, paddingTop 16, paddingBottom 8
- Each transaction row (ListCard):
  - Left: IconBox with category icon, bg = category color at 12% opacity
  - Center: note or category name (listTitle), category name as subtitle if note exists (subtitle style)
  - Right: amount (listTitle weight, expense = red with "−₺" prefix, income = green with "+₺" prefix)
- Swipe left to delete:
  - Use react-native-gesture-handler Swipeable component
  - Red background revealed on swipe with trash icon
  - On swipe complete: confirmation alert → delete → toast
- Tap: open AddTransactionSheet in edit mode with the selected transaction data

STEP 7 — PAGINATION
- Load 50 transactions at a time from SQLite
- FlashList onEndReached → load next batch
- Show a small ActivityIndicator at bottom while loading more
- onEndReachedThreshold: 0.3

STEP 8 — EMPTY STATES
- When filters return 0 results:
  EmptyState: icon "search", title "İşlem bulunamadı", subtitle "Filtrelerinizi değiştirmeyi deneyin"
- When no transactions exist at all:
  EmptyState: Lottie animation (wallet or coins), title "Harcamalarınızı takip etmeye başlayın!", CTA button "İlk İşlemi Ekle" → opens AddTransaction sheet
```

---

### PHASE 4 — Subscription Tracker

```
You are continuing the CepBütçe bare React Native app. Phases 0–3 are complete.

CRITICAL: No Expo. Use @notifee/react-native for notifications, @gorhom/bottom-sheet for forms.

TASK: Build the Subscriptions tab — track recurring payments, see total cost, get renewal reminders.

STEP 1 — SUBSCRIPTIONS SCREEN
Create `src/screens/SubscriptionsScreen.tsx`:
- Page title: "Abonelikler" (28px/700)
- bg.page background, ScrollView content

STEP 2 — COST OVERVIEW
Two StatCards side by side (horizontal row, 50/50 width with gap 10):
- Left: "Aylık" label, "₺XXX" value (monthly total, normalized from all cycles)
- Right: "Yıllık" label, "₺X,XXX" value
- Both use tinted variant
- Auto-calculated from active subscriptions:
  weekly × 4.33 = monthly, quarterly / 3 = monthly, yearly / 12 = monthly

STEP 3 — UPCOMING RENEWALS
- SectionHeader: "Yaklaşan Yenilemeler"
- Horizontal ScrollView of upcoming renewal cards (sorted nearest first)
- Each card: white Card, width 150, borderRadius 16
  - Top: colored circle (44px) with first letter of subscription name (white text, bg = subscription's color)
  - Name: listTitle (14px/600), max 1 line, ellipsize
  - Amount: 14px/600, semantic.expense color
  - Days until: "X gün sonra" (caption style). Orange if ≤3 days, red if today/overdue
- Max 5 shown, then small "Tümünü Gör" text button

STEP 4 — ALL SUBSCRIPTIONS LIST
- SectionHeader: "Tüm Abonelikler" with count in parentheses
- Toggle row: "Aktif" | "Pasif" — uses Chip components
- Each subscription: ListCard with:
  - Left: colored circle with initial letter
  - Center: name (listTitle), cycle + amount as subtitle ("Aylık · ₺79,99")
  - Right: next renewal date (subtitle style)
- On press → navigate to subscription detail (new stack screen or expanded bottom sheet)
- Swipe left: options sheet → "Düzenle", "Pasife Al", "Sil"

STEP 5 — ADD SUBSCRIPTION (Bottom Sheet)
Create `src/screens/AddSubscriptionSheet.tsx` (BottomSheetModal, snap ['90%']):

Top section — Popular Services Quick-Pick:
- Horizontal ScrollView of common services: Netflix, Spotify, YouTube Premium, iCloud, ChatGPT Plus, Apple Music, Disney+, Amazon Prime
- Each: small card with brand color circle + name
- Tapping auto-fills name and suggests a default amount

Form fields:
1. Name input (BottomSheetTextInput)
2. Amount with custom keypad (reuse the keypad component from Phase 2)
3. Billing cycle: segmented picker → Haftalık | Aylık | 3 Aylık | Yıllık
4. Category picker (reuse from Phase 2, filtered for relevant categories)
5. First billing date picker
6. Reminder: toggle + "X gün önce" picker (1, 3, 7 days)
7. Color picker: row of 8 color circles (tappable, selected = checkmark overlay)
8. Note (optional)
- Save button: "Abonelik Ekle" — primary Button

STEP 6 — NOTIFICATIONS
Using @notifee/react-native:
- Request notification permissions on first subscription add
- When subscription saved with reminder:
  - Create a trigger notification scheduled for (nextRenewalDate - remindBefore days) at 10:00 AM
  - Channel: "subscription-reminders" with name "Abonelik Hatırlatmaları"
  - Title: "🔔 Abonelik Yenilenecek"
  - Body: "{name} aboneliğiniz {formatted date} tarihinde yenilenecek. ₺{amount}"
  - Android: set smallIcon, color to brand primary
- On app launch: check all subscriptions, advance past nextRenewalDates (add billingCycle period), reschedule reminders
- Create `src/services/notifications.ts` with helpers: scheduleSubscriptionReminder, cancelReminder, rescheduleAll

STEP 7 — FREE TIER LIMIT
- Free: max 5 active subscriptions (tracked in settings store)
- On adding 6th: intercept in the store, show a BottomSheet:
  - Title: "Abonelik Limiti"
  - Text: "Ücretsiz planda en fazla 5 abonelik takip edebilirsiniz"
  - Primary CTA: "Premium'a Geç" → navigate to Premium screen
  - Ghost button: "Sonra" → dismiss
```

---

### PHASE 5 — Receipt Scanner (Camera + OCR)

```
You are continuing the CepBütçe bare React Native app. Phases 0–4 are complete.

CRITICAL: No Expo. Use react-native-vision-camera for camera, @react-native-ml-kit/text-recognition for OCR, react-native-image-crop-picker for gallery.

TASK: Build the receipt scanner — photograph a receipt and auto-extract data.

STEP 1 — CAMERA PERMISSIONS
Add camera and photo library permissions:
- iOS: add NSCameraUsageDescription and NSPhotoLibraryUsageDescription to Info.plist
- Android: add CAMERA and READ_MEDIA_IMAGES to AndroidManifest.xml
- Create a permission request flow that shows before camera access

STEP 2 — SCANNER SCREEN
Create `src/screens/ReceiptScannerScreen.tsx` (full-screen stack screen, not a sheet):
- Uses react-native-vision-camera v4 Camera component
- Camera fills the entire screen
- Overlay layer on top of camera (absolute positioned View):
  - Semi-transparent dark edges (rgba(0,0,0,0.5))
  - Clear rectangle in center (the receipt guide frame) — use a View with transparent bg and dashed border (or just a cutout effect)
  - Text above frame: "Fişi çerçevenin içine hizalayın" (13px/400 white)
- Bottom controls bar (absolute bottom, safe area padded):
  - Left: Gallery button — Feather "image" icon, circular bg rgba(255,255,255,0.2), 44px
    → opens react-native-image-crop-picker picker with cropping enabled
  - Center: Capture button — 70px white circle with 4px brand.primary ring border, inner white circle 60px
    → takes photo using camera ref
    → haptic 'impactMedium'
  - Right: Flash toggle — Feather "zap" / "zap-off" icon, same circular style
    → toggles camera torch mode
- Top left: back button (Feather "x" icon, white, circular bg)
- StatusBar: hidden on this screen

STEP 3 — PHOTO REVIEW
After capture or gallery pick:
- Navigate to a review screen or show inline
- Full-screen image preview (FastImage, resizeMode contain)
- Bottom actions:
  - "Bu Fotoğrafı Kullan" — Primary Button
  - "Tekrar Çek" — Ghost Button → go back to camera
  - Rotate 90° button (Feather "rotate-cw" icon) — rotates the image
- Image path stored in a temp variable

STEP 4 — OCR SERVICE
Create `src/services/ocr.ts`:

Function: `extractReceiptData(imagePath: string, usePremiumAI: boolean): Promise<ReceiptOCR>`

Strategy A — On-Device (Free tier):
  - Use @react-native-ml-kit/text-recognition
  - Pass the image file path, get back recognized text blocks
  - Parse with heuristics in `src/utils/receiptParser.ts`:
    - Total: look for keywords "TOPLAM", "TOTAL", "GENEL TOPLAM", "TUTARI", "NET" near a number. Take the LARGEST number near these keywords
    - Date: regex for DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY patterns. Also try "GG.AA.YYYY" Turkish variants
    - Vendor: usually the first or second text block (line 1 or 2 of the receipt). Filter out common non-vendor text like "FİŞ", "FATURA"
    - Line items: look for lines with a number at the end (price pattern: X,XX or X.XX followed by TL or ₺)
  - Return structured ReceiptOCR object

Strategy B — Gemini Vision API (Premium tier):
  - Convert image to base64 (read file with react-native-fs, convert)
  - Send to Gemini Vision API (gemini-2.0-flash model) with this prompt:
    "Bu bir Türk fiş/fatura görüntüsüdür. Aşağıdaki bilgileri çıkar ve SADECE geçerli JSON formatında yanıtla, başka hiçbir metin ekleme:
    { "vendor": "mağaza adı", "date": "YYYY-MM-DD", "total": sayı, "currency": "TRY", "items": [{"name": "ürün adı", "amount": sayı}] }
    Eğer bir alan okunamıyorsa null yaz."
  - Parse JSON response
  - Fallback to Strategy A if API fails

STEP 5 — RESULTS SCREEN
Create `src/screens/ReceiptResultsScreen.tsx`:
- Top: receipt thumbnail (tappable → full-screen image viewer overlay)
- Status badge: "AI ile tarandı ✓" (green) or "Manuel kontrol gerekli" (orange) based on OCR confidence

Editable fields (each in a card-like row):
1. Mağaza (Vendor): Input, pre-filled
2. Toplam (Total): Amount display, pre-filled, tappable to edit with keypad
3. Tarih (Date): Date picker, pre-filled
4. Kategori (Category): auto-suggested from vendor name matching (e.g., "Migros" → Yemek & İçecek). Tappable to change
5. Ürünler (Items): expandable list, each with name + amount. Swipe to delete, "+" to add
- Each auto-filled field has a green check icon. User-edited fields switch to a pencil icon

STEP 6 — SAVE AS TRANSACTION
- Bottom sticky button: "Harcama Olarak Kaydet" — Primary Button
- On save:
  1. Create transaction with amount, date, category from the form
  2. Set note = vendor name
  3. Set receiptUri = image file path
  4. Set receiptOcrData = full OCR result object (JSON stringified in SQLite)
  5. Save to store + DB
  6. Haptic success, toast "Fiş kaydedildi ✓"
  7. Navigate back to Dashboard

STEP 7 — FREE TIER LIMITS
- Track `receiptScansThisMonth` in settings store
- Free: 3 scans/month (on-device ML Kit only)
- Premium: 20 scans/month (Gemini Vision AI)
- Reset count on 1st of each month (check on app launch)
- When limit hit: show BottomSheet with usage info + premium CTA
- Show remaining scans on the scanner screen: "X tarama hakkınız kaldı"
```

---

### PHASE 6 — Budget System & Insights

```
You are continuing the CepBütçe bare React Native app. Phases 0–5 are complete.

CRITICAL: No Expo. Use react-native-gifted-charts (or victory-native or @shopify/react-native-skia) for charts. Use @notifee/react-native for budget notifications.

TASK: Build the budget management system and spending insights/charts.

STEP 1 — BUDGET SETTINGS
Add "Bütçe Ayarları" section accessible from Profile screen (list item → navigates to new stack screen):
- Create `src/screens/BudgetSettingsScreen.tsx`
- Overall monthly budget: Card with large amount input, label "Aylık Toplam Bütçe"
- Category budgets: FlatList of expense categories, each row:
  - IconBox + category name on left
  - Budget amount input on right (or "—" if not set, tappable to add)
  - Swipe to remove category budget
- Budget reset day: picker row → "Her ayın X'inde sıfırla" (default 1)
- Save: updates budget store + SQLite, show toast

STEP 2 — BUDGET RING ON DASHBOARD
Update DashboardScreen's budget summary section:
- Replace/enhance the progress bar with a circular progress ring:
  - Use react-native-gifted-charts PieChart (donut variant) OR build a custom SVG ring with react-native-svg (Circle with strokeDasharray)
  - Ring size: 120px diameter
  - Track color: rgba(border.card, 0.3)
  - Fill color: green → orange → red based on % (same thresholds as before)
  - Center text: amount remaining (bigNumber style)
  - Below ring: "₺spent / ₺budget" (subtitle style)
- Animate the ring fill on mount using reanimated (interpolate from 0 to current %)
- Tap → navigate to BudgetBreakdownScreen

STEP 3 — BUDGET BREAKDOWN SCREEN
Create `src/screens/BudgetBreakdownScreen.tsx`:
- Top: larger version of the budget ring (160px)
- Below: list of categories with individual progress bars
  - Each row: IconBox + category name + horizontal progress bar + "₺spent / ₺budget" text
  - Progress bar: same color logic (green/orange/red)
  - Categories sorted by % used (highest first)
  - Categories without budgets: show just "₺spent" with no bar
- Footer: Button "Bütçeyi Düzenle" → navigate to BudgetSettingsScreen

STEP 4 — INSIGHTS / ANALYTICS
Add an "Analiz" section on Dashboard (or a separate tab/screen accessible from Dashboard):

Chart 1 — Monthly Spending Trend (Line/Area Chart):
- X: last 6 months. Y: total spending
- Use react-native-gifted-charts LineChart
- Line color: brand.primary. Area fill: brand.primaryTint
- Data points with amount labels
- Animated on mount

Chart 2 — Category Breakdown (Donut Chart):
- Segments colored by category colors
- Center: total amount
- Legend below: colored circles + category name + percentage
- Period selector chips: "Bu Ay", "Son 3 Ay", "Bu Yıl"

Chart 3 — Income vs Expense (Grouped Bar Chart):
- Side-by-side bars per month (last 6 months)
- Green = income, Red = expense
- Labels on top of bars

Each chart inside a Card with SectionHeader above. ScrollView wraps all charts.

STEP 5 — BUDGET NOTIFICATIONS
Using @notifee/react-native:
- When a new transaction is saved, check budget status:
  - If total spending just crossed 50%: schedule immediate notification
    "📊 Bütçenizin yarısını harcadınız" / "Bu ay ₺X,XXX harcadınız, ₺X,XXX kaldı"
  - 80%: "⚠️ Bütçe uyarısı — %80'ini harcadınız!"
  - 100%: "🚨 Bütçeyi aştınız! Bu ay ₺X,XXX fazla harcadınız"
- Per-category: same thresholds if category budget is set
- Create `src/services/budgetAlerts.ts` with a `checkBudgetThresholds(transactionAmount)` function
- Only fire each threshold once per budget period (track in MMKV)

STEP 6 — INSIGHT CARDS ON DASHBOARD
Add 2–3 insight cards at bottom of Dashboard ScrollView:
- "Bu ay en çok: {category} (₺XXX)" — top spending category
- "Geçen aya göre %X daha az/çok harcadınız" — month-over-month delta with ↑/↓ arrow
- "Günlük ortalama: ₺XX" — daily average spending this period
- Each: compact Card with icon + text row, subtitle style, tappable → full analytics
- Only show if there's enough data (>5 transactions)
```

---

### PHASE 7 — Settings, Export & Localization

```
You are continuing the CepBütçe bare React Native app. Phases 0–6 are complete.

CRITICAL: No Expo. Use react-native-localize for locale, react-native-fs + react-native-share for export, react-native-html-to-pdf for PDF, @react-native-firebase/auth for auth.

TASK: Build Profile/Settings, data export, i18n, dark mode toggle.

STEP 1 — PROFILE SCREEN
Build `src/screens/ProfileScreen.tsx`:
- Top: user section — initials circle (56px, bg brand.primary, white letter, borderRadius full) + name + email. If not logged in: "Giriş Yap" CTA
- Below: grouped settings list using ListCard components with section dividers

Group "Hesap" (Account):
- Profili Düzenle → stack screen
- Premium → PremiumScreen
- Giriş Yap / Çıkış Yap → Firebase Auth flow

Group "Tercihler" (Preferences):
- Para Birimi → BottomSheet picker (₺ TRY, $ USD, € EUR, £ GBP, + 10 more common ones)
- Dil / Language → BottomSheet: Türkçe / English. Changes i18n language + persists to MMKV
- Tema → BottomSheet: Açık / Koyu / Sistem. Updates ThemeProvider
- Bütçe Sıfırlama Günü → picker 1–28
- Bildirimler → toggle switch (on card row)
- Biyometrik Kilit → toggle (uses react-native-biometrics to verify before enabling)

Group "Veri" (Data):
- Verileri Dışa Aktar → ExportScreen
- Verileri İçe Aktar → CSV import (parse + validate + insert to DB)
- Tüm Verileri Sil → double confirmation Alert → wipe DB + stores + navigate to onboarding

Group "Hakkında" (About):
- Geri Bildirim → Linking.openURL('mailto:...')
- Uygulamayı Değerlendir → Linking to App Store / Play Store
- Gizlilik Politikası → in-app WebView or Linking.openURL
- Kullanım Koşulları → same
- Sürüm → app version from package.json

Each group has a SectionHeader label above. Subtle divider line between groups.

STEP 2 — DATA EXPORT
Create `src/screens/ExportScreen.tsx`:
- Date range: chips → "Bu Ay", "Son 3 Ay", "Bu Yıl", "Tüm Zamanlar", "Özel"
- Include checkboxes: ☑ Harcamalar ☑ Gelirler ☑ Abonelikler
- Format selector: "CSV" (free) | "PDF Rapor" (premium badge)

CSV Export:
  - Query transactions from SQLite with date filter
  - Generate CSV string with Turkish headers: Tarih, Tür, Kategori, Tutar, Para Birimi, Not
  - Turkish date format: DD.MM.YYYY
  - Turkish number format: 1234,56
  - Write to temp file via react-native-fs (DocumentDirectoryPath)
  - Share via react-native-share

PDF Export (Premium):
  - Generate HTML template with:
    - CepBütçe header with brand color
    - Period and export date
    - Summary table: total income, expenses, net, top 3 categories
    - Transaction table with all entries
    - Styled with inline CSS matching the app's design system
  - Convert to PDF via react-native-html-to-pdf
  - Share via react-native-share

STEP 3 — LOCALIZATION (i18n)
Configure i18next in `src/i18n/index.ts`:
  - Use react-native-localize to detect device locale
  - Fallback: 'tr' (Turkish is primary)
  - Load translations from `src/i18n/tr.json` and `src/i18n/en.json`
  - Persist language choice in MMKV, override device detection if set

Create complete translation files covering EVERY user-facing string:
  - Navigation labels (Anasayfa/Dashboard, İşlemler/Transactions, Abonelikler/Subscriptions, Profil/Profile)
  - Screen titles, section headers, button labels
  - Empty states, error messages, confirmation dialogs
  - Category names (all 12 defaults in both languages)
  - Date relative strings (Bugün/Today, Dün/Yesterday, X gün önce/X days ago)
  - Number format helpers (Turkish: 1.234,56 / English: 1,234.56)
  - Currency symbols and placement

Go through EVERY screen built so far and replace ALL hardcoded Turkish strings with t('key') calls. Use namespaced keys: t('dashboard.greeting'), t('transactions.empty.title'), etc.

STEP 4 — DARK MODE FINALIZATION
Ensure ThemeProvider and useTheme() hook work correctly:
- All screens + components read colors from useTheme()
- Test every screen in dark mode — verify no hardcoded colors leak through
- Bottom sheets: set BottomSheet backgroundStyle to use theme bg.card
- Status bar: dark-content in light mode, light-content in dark mode (except on green header)
- Navigation bar (Android): match bg.page color
- Transition: when theme changes, use Appearance listener to update immediately

STEP 5 — FIREBASE AUTH (Optional cloud sync prep)
- Install @react-native-firebase/app + @react-native-firebase/auth
- Configure Firebase project (GoogleService-Info.plist + google-services.json)
- Auth methods: Email/Password + Google Sign-In (@react-native-google-signin/google-signin) + Apple Sign-In (@invertase/react-native-apple-authentication)
- Auth is OPTIONAL — app works fully without login
- Auth state stored in MMKV
- Simple login/register screen using the design system's Input + Button components
- When logged in: show user info on Profile, unlock cloud sync option (Phase 8 consideration)
```

---

### PHASE 8 — Premium / Paywall & Final Polish

```
You are continuing the CepBütçe bare React Native app. Phases 0–7 are complete.

CRITICAL: No Expo. Use react-native-iap (or react-native-purchases/RevenueCat) for IAP, @notifee/react-native for any remaining notifications, react-native-bootsplash for splash.

TASK: Implement premium paywall, onboarding, and production polish.

STEP 1 — PREMIUM SCREEN
Create `src/screens/PremiumScreen.tsx` (full stack screen):
- Top section: LinearGradient header (brand.primary → slightly darker green)
  - Large icon: crown or diamond (from vector-icons, white, 48px)
  - "CepBütçe Premium" (24px/700 white)
  - "Finansal özgürlüğün kilidini aç" subtitle (14px/400 white 80%)
- Feature list comparing Free vs Premium (ScrollView):
  Use a clean list of rows, each with:
    - Feature name on left
    - Free status (✓ or limit text or ✗) center
    - Premium status (✓ or "Sınırsız") right, highlighted in green

  Features to list:
    Manuel harcama takibi: Sınırsız | Sınırsız
    Abonelik takibi: 5 adet | Sınırsız
    Fiş tarama: 3/ay (cihaz) | 20/ay (AI)
    Kategori bütçeleri: ✗ | ✓
    Veri dışa aktarma: CSV | CSV + PDF
    Grafikler: Temel | Gelişmiş
    Bulut senkronizasyon: ✗ | ✓
    Koyu tema: ✓ | ✓
    Reklamsız: ✗ | ✓

- Price cards (selectable, 2px green border on selected — only case for 2px border):
  Card 1: "Aylık" — ₺79,99/ay — subtle "Esnek" badge
  Card 2: "Yıllık" — ₺499,99/yıl — highlighted badge "EN POPÜLER — %48 tasarruf", default selected
  Card 3: "Ömür Boyu" — ₺999,99 — badge "Tek Seferlik"
- CTA: "Premium'a Geç" — large primary Button, full width
- Below: "7 gün ücretsiz dene" caption + "Satın alımı geri yükle" text link
- Legal: auto-renewal terms in caption text

STEP 2 — IN-APP PURCHASES
Using react-native-iap (or RevenueCat react-native-purchases for easier management):
- Configure 3 products in App Store Connect + Google Play Console:
  - com.cepbutce.premium.monthly (₺79.99/mo auto-renewable)
  - com.cepbutce.premium.yearly (₺499.99/yr auto-renewable)
  - com.cepbutce.premium.lifetime (₺999.99 non-consumable)
- Create `src/services/iap.ts`:
  - initIAP(): connect to store, load products
  - purchasePremium(productId): initiate purchase flow
  - restorePurchases(): check for existing purchases
  - validateReceipt(): verify with App Store / Play Store (or RevenueCat handles this)
- On successful purchase:
  - Update settings store: isPremium = true, premiumExpiresAt = date
  - Show Lottie success animation + "Premium'a hoş geldiniz! 🎉" toast
  - Navigate back, all limits lifted
- On app launch: verify subscription status (check expiry, validate receipt)

STEP 3 — PREMIUM GATING HOOK
Create `src/hooks/usePremium.ts`:
  Returns: { isPremium, canScanReceipt (bool), remainingScans (number), canAddSubscription (bool), maxSubscriptions (number), showPaywall() }
  - showPaywall: navigates to PremiumScreen
  - Wrap all gated actions:
    - AddSubscriptionSheet: check canAddSubscription before save
    - ReceiptScannerScreen: check canScanReceipt before camera opens
    - ExportScreen: check isPremium for PDF option
    - BudgetSettings: check isPremium for per-category budgets

STEP 4 — ONBOARDING
Create `src/screens/OnboardingScreen.tsx`:
- Shown only on first launch (check onboardingComplete in MMKV)
- 3 swipeable pages using a FlatList with horizontal paging (or react-native-pager-view):

  Page 1: "Harcamalarını Takip Et"
    - Large Lottie animation (wallet/money theme) or custom SVG illustration
    - Title: 20px/600
    - Subtitle: "Gelir ve giderlerini kolayca kaydet, bütçeni kontrol altında tut"

  Page 2: "Aboneliklerini Yönet"
    - Lottie (recurring/subscription theme)
    - "Tüm aboneliklerini tek yerden takip et, yenilenmeden önce hatırlatma al"

  Page 3: "Fişlerini Tara"
    - Lottie (camera/scan theme)
    - "Fişlerini fotoğrafla, yapay zeka ile otomatik olarak kaydet"

- Bottom: page dot indicators (3 dots, active = brand.primary, inactive = border.card)
- Button: "Sonraki" on pages 1–2, "Başla" on page 3
- Optional extra page: currency selector (grid of common currencies, default ₺ TRY highlighted)
- After onboarding: set onboardingComplete = true, navigate to MainTabs

STEP 5 — BIOMETRIC LOCK
Using react-native-biometrics:
- When enabled in settings: on app foreground (AppState listener), show biometric prompt
- "CepBütçe'ye erişmek için kimliğinizi doğrulayın"
- If biometrics unavailable: fall back to no lock (don't block the user)
- Blur overlay on app content while locked (using @react-native-community/blur)

STEP 6 — SPLASH SCREEN
Using react-native-bootsplash:
- Green background (#00C864) with white app logo/icon centered
- Configure for both iOS and Android
- Hide splash after DB initialization + store hydration is complete

STEP 7 — FINAL POLISH CHECKLIST
Go through the ENTIRE app and verify:
- [ ] Haptic feedback: every button, toggle, and interactive element (react-native-haptic-feedback)
- [ ] Loading states: skeleton placeholders on every data-loading screen (react-native-skeleton-placeholder)
- [ ] Pull-to-refresh: Dashboard, Transactions, Subscriptions
- [ ] Error boundaries: wrap each screen, show friendly error UI with "Tekrar Dene" button
- [ ] Empty states: every FlatList/FlashList has an EmptyState component
- [ ] Keyboard: KeyboardAvoidingView on every screen with inputs, dismiss on tap outside
- [ ] Safe areas: all screens respect notch/status bar/home indicator (useSafeAreaInsets)
- [ ] Press animations: scale(0.98) via reanimated on every Pressable/touchable
- [ ] Screen transitions: native-stack default animations, no janky custom ones
- [ ] List performance: FlashList everywhere, React.memo on row components, useCallback on handlers
- [ ] Accessibility: accessibilityLabel on all interactive elements (Turkish by default)
- [ ] Offline: app is fully offline-first, no crash if network unavailable
- [ ] Toast: react-native-toast-message for all success/error feedback
- [ ] Lottie: success animations (checkmark) on transaction/subscription save
- [ ] App icon: green background with white budget/wallet icon. Generate all sizes for iOS + Android
- [ ] StatusBar: per-screen control (light on green header, dark elsewhere, adapts to dark mode)

STEP 8 — BUILD & RELEASE PREP
- Configure package.json: name "CepButce", version "1.0.0"
- iOS:
  - Set bundle ID: com.cepbutce.app (or your own)
  - Configure signing in Xcode
  - Add required Info.plist keys: NSCameraUsageDescription, NSPhotoLibraryUsageDescription
  - Set deployment target: iOS 15.0+
  - App Store metadata: Turkish + English descriptions, screenshots
- Android:
  - Set applicationId in build.gradle
  - Generate release keystore
  - ProGuard rules for all native libraries
  - Target SDK: 34+
  - Play Store listing: Turkish + English
- CI/CD: Fastlane config for automated builds (optional but recommended)
```

---

## Quick Reference: Phase Dependencies

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
  │            │                        │
  │            └──→ Phase 4 ────────────┤
  │                                     │
  │                 Phase 5 (can parallel with 4)
  │                   │
  └──→ Phase 6 ───────┘
         │
         └──→ Phase 7 ──→ Phase 8
```

- **Phases 0–3**: strictly sequential (foundation → shell → core input → history)
- **Phase 4** (subscriptions): can start after Phase 1 (needs navigation)
- **Phase 5** (scanner): independent, needs only Phase 0 + 2 patterns
- **Phase 6** (budgets): needs Phase 3 (transaction data to analyze)
- **Phase 7** (settings/i18n): needs all feature phases done
- **Phase 8** (premium/polish): always last

## Key Library Quick-Install Reference

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Animation & Gesture
npm install react-native-reanimated react-native-gesture-handler @gorhom/bottom-sheet

# UI
npm install react-native-svg react-native-vector-icons react-native-fast-image react-native-linear-gradient react-native-haptic-feedback react-native-toast-message react-native-skeleton-placeholder lottie-react-native @react-native-community/blur

# Styling
npm install nativewind tailwindcss

# Data
npm install react-native-mmkv op-sqlite zustand

# Camera & Media
npm install react-native-vision-camera react-native-image-picker react-native-image-crop-picker @react-native-ml-kit/text-recognition

# Utilities
npm install dayjs react-native-localize i18next react-i18next react-native-fs react-native-share react-native-html-to-pdf react-native-biometrics react-native-keychain react-native-bootsplash

# Charts
npm install react-native-gifted-charts

# Notifications
npm install @notifee/react-native

# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# IAP
npm install react-native-iap

# Lists
npm install @shopify/flash-list

# Date picker
npm install @react-native-community/datetimepicker

# Don't forget:
cd ios && pod install
```
