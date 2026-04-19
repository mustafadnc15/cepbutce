import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { SubscriptionsScreen } from '../screens/SubscriptionsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { BudgetBreakdownScreen } from '../screens/BudgetBreakdownScreen';
import { BudgetSettingsScreen } from '../screens/BudgetSettingsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { ImportCsvScreen } from '../screens/ImportCsvScreen';
import type {
  DashboardStackParamList,
  MainTabParamList,
  ProfileStackParamList,
  SubscriptionsStackParamList,
  TransactionsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const TransactionsStack = createNativeStackNavigator<TransactionsStackParamList>();
const SubscriptionsStack = createNativeStackNavigator<SubscriptionsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = { headerShown: false } as const;

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="BudgetBreakdown" component={BudgetBreakdownScreen} />
      <DashboardStack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
    </DashboardStack.Navigator>
  );
}

function TransactionsNavigator() {
  return (
    <TransactionsStack.Navigator screenOptions={stackScreenOptions}>
      <TransactionsStack.Screen name="TransactionsHome" component={TransactionsScreen} />
    </TransactionsStack.Navigator>
  );
}

function SubscriptionsNavigator() {
  return (
    <SubscriptionsStack.Navigator screenOptions={stackScreenOptions}>
      <SubscriptionsStack.Screen name="SubscriptionsHome" component={SubscriptionsScreen} />
    </SubscriptionsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <ProfileStack.Screen name="Login" component={LoginScreen} />
      <ProfileStack.Screen name="Register" component={RegisterScreen} />
      <ProfileStack.Screen name="Export" component={ExportScreen} />
      <ProfileStack.Screen name="ImportCsv" component={ImportCsvScreen} />
    </ProfileStack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardNavigator} />
      <Tab.Screen name="Transactions" component={TransactionsNavigator} />
      <Tab.Screen name="Subscriptions" component={SubscriptionsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}
