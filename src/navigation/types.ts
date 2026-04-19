import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ReceiptOCR } from '../services/ocr';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  BudgetBreakdown: undefined;
  BudgetSettings: undefined;
};

export type TransactionsStackParamList = {
  TransactionsHome: undefined;
};

export type SubscriptionsStackParamList = {
  SubscriptionsHome: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  BudgetSettings: undefined;
  EditProfile: undefined;
  Premium: undefined;
  Login: undefined;
  Register: undefined;
  Export: undefined;
  ImportCsv: undefined;
};

export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Transactions: NavigatorScreenParams<TransactionsStackParamList>;
  Subscriptions: NavigatorScreenParams<SubscriptionsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type ScannerStackParamList = {
  ReceiptScanner: undefined;
  ReceiptReview: { imagePath: string };
  ReceiptResults: { imagePath: string; ocr: ReceiptOCR };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: NavigatorScreenParams<ScannerStackParamList>;
};
