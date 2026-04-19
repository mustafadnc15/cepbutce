import { create } from 'zustand';
import type { Subscription, Transaction } from '../types';

type SheetOpener = () => void;
type EditTransactionOpener = (tx: Transaction) => void;
type EditSubscriptionOpener = (sub: Subscription) => void;

interface SheetState {
  openAddTransaction: SheetOpener;
  openAddIncome: SheetOpener;
  openScanReceipt: SheetOpener;
  openEditTransaction: EditTransactionOpener;
  openAddSubscription: SheetOpener;
  openEditSubscription: EditSubscriptionOpener;

  registerAddTransaction: (fn: SheetOpener) => void;
  registerAddIncome: (fn: SheetOpener) => void;
  registerScanReceipt: (fn: SheetOpener) => void;
  registerEditTransaction: (fn: EditTransactionOpener) => void;
  registerAddSubscription: (fn: SheetOpener) => void;
  registerEditSubscription: (fn: EditSubscriptionOpener) => void;
}

const noop: SheetOpener = () => {};
const noopEditTx: EditTransactionOpener = () => {};
const noopEditSub: EditSubscriptionOpener = () => {};

export const useSheetStore = create<SheetState>((set) => ({
  openAddTransaction: noop,
  openAddIncome: noop,
  openScanReceipt: noop,
  openEditTransaction: noopEditTx,
  openAddSubscription: noop,
  openEditSubscription: noopEditSub,

  registerAddTransaction: (fn) => set({ openAddTransaction: fn }),
  registerAddIncome: (fn) => set({ openAddIncome: fn }),
  registerScanReceipt: (fn) => set({ openScanReceipt: fn }),
  registerEditTransaction: (fn) => set({ openEditTransaction: fn }),
  registerAddSubscription: (fn) => set({ openAddSubscription: fn }),
  registerEditSubscription: (fn) => set({ openEditSubscription: fn }),
}));
