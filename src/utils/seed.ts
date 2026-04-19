import dayjs from 'dayjs';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useBudgetStore } from '../stores/useBudgetStore';

function iso(daysAgo: number, hour = 10): string {
  return dayjs()
    .subtract(daysAgo, 'day')
    .hour(hour)
    .minute(15)
    .second(0)
    .millisecond(0)
    .toISOString();
}

export function hasDemoData(): boolean {
  const txCount = useTransactionStore.getState().transactions.length;
  const subCount = useSubscriptionStore.getState().subscriptions.length;
  return txCount > 0 || subCount > 0;
}

export function seedDemoData(): void {
  const txStore = useTransactionStore.getState();
  const subStore = useSubscriptionStore.getState();
  const budgetStore = useBudgetStore.getState();

  if (hasDemoData()) {
    if (__DEV__) console.log('[seed] skipped — data already present');
    return;
  }

  // Overall monthly budget
  if (!budgetStore.overallBudget()) {
    budgetStore.setBudget({
      categoryId: null,
      amount: 15000,
      period: 'monthly',
      currency: 'TRY',
    });
  }

  const transactions: Array<Parameters<typeof txStore.addTransaction>[0]> = [
    { amount: 85.5, currency: 'TRY', type: 'expense', categoryId: 'cat_food', note: 'Kahve & sandviç', date: iso(0, 9), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 42, currency: 'TRY', type: 'expense', categoryId: 'cat_transport', note: 'Metro', date: iso(0, 18), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 320, currency: 'TRY', type: 'expense', categoryId: 'cat_shopping', note: 'Market', date: iso(1, 19), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 1250, currency: 'TRY', type: 'expense', categoryId: 'cat_bills', note: 'Elektrik faturası', date: iso(2, 11), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 180, currency: 'TRY', type: 'expense', categoryId: 'cat_entertainment', note: 'Sinema', date: iso(3, 21), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 95, currency: 'TRY', type: 'expense', categoryId: 'cat_food', note: 'Akşam yemeği', date: iso(4, 20), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 25000, currency: 'TRY', type: 'income', categoryId: 'cat_salary', note: 'Maaş', date: iso(5, 9), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 55, currency: 'TRY', type: 'expense', categoryId: 'cat_food', note: 'Öğle yemeği', date: iso(6, 13), receiptUri: null, receiptOcrData: null, subscriptionId: null },
    { amount: 450, currency: 'TRY', type: 'expense', categoryId: 'cat_health', note: 'Eczane', date: iso(7, 15), receiptUri: null, receiptOcrData: null, subscriptionId: null },
  ];

  for (const tx of transactions) {
    txStore.addTransaction(tx);
  }

  const subscriptions: Array<Parameters<typeof subStore.add>[0]> = [
    {
      name: 'Netflix',
      amount: 229.99,
      currency: 'TRY',
      billingCycle: 'monthly',
      categoryId: 'cat_entertainment',
      startDate: iso(120),
      icon: 'film',
      color: '#E50914',
      note: null,
      isActive: true,
      remindBefore: 2,
      autoCreateTransactions: true,
    },
    {
      name: 'Spotify',
      amount: 59.99,
      currency: 'TRY',
      billingCycle: 'monthly',
      categoryId: 'cat_entertainment',
      startDate: iso(90),
      icon: 'headphones',
      color: '#1DB954',
      note: null,
      isActive: true,
      remindBefore: 2,
      autoCreateTransactions: true,
    },
    {
      name: 'iCloud+',
      amount: 29.99,
      currency: 'TRY',
      billingCycle: 'monthly',
      categoryId: 'cat_bills',
      startDate: iso(200),
      icon: 'cloud',
      color: '#007AFF',
      note: null,
      isActive: true,
      remindBefore: 2,
      autoCreateTransactions: true,
    },
  ];

  for (const sub of subscriptions) {
    subStore.add(sub);
  }

  if (__DEV__) console.log('[seed] populated demo data');
}

export function clearDemoData(): void {
  const txStore = useTransactionStore.getState();
  const subStore = useSubscriptionStore.getState();
  const budgetStore = useBudgetStore.getState();

  for (const t of [...txStore.transactions]) txStore.deleteTransaction(t.id);
  for (const s of [...subStore.subscriptions]) subStore.delete(s.id);
  for (const b of [...budgetStore.budgets]) budgetStore.removeBudget(b.id);
}
