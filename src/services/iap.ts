// Lazy facade over react-native-iap. The module isn't linked yet in dev, so
// this file falls back to a mock flow that still resolves the store contract.
// Once `npm i react-native-iap && cd ios && pod install` runs, the real
// bindings kick in automatically.

import { Platform } from 'react-native';
import dayjs from 'dayjs';

export type ProductId =
  | 'com.cepbutce.premium.monthly'
  | 'com.cepbutce.premium.yearly'
  | 'com.cepbutce.premium.lifetime';

export const PRODUCT_IDS: ProductId[] = [
  'com.cepbutce.premium.monthly',
  'com.cepbutce.premium.yearly',
  'com.cepbutce.premium.lifetime',
];

export interface Product {
  productId: ProductId;
  localizedPrice: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  // subscription vs non-consumable
  kind: 'sub' | 'oneTime';
}

export interface PurchaseResult {
  productId: ProductId;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  // Computed expiry based on productId; real validation happens server-side
  expiresAt: string | null;
}

let mod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('react-native-iap');
} catch {
  mod = null;
}

export const isIapAvailable: boolean = mod !== null;

// Fallback prices used when the native module hasn't loaded real SKUs. These
// are display-only; actual charges come from App Store Connect / Play Console.
const MOCK_PRODUCTS: Record<ProductId, Product> = {
  'com.cepbutce.premium.monthly': {
    productId: 'com.cepbutce.premium.monthly',
    localizedPrice: '₺79,99',
    price: '79.99',
    currency: 'TRY',
    title: 'CepBütçe Premium — Aylık',
    description: 'Aylık yenilenen abonelik',
    kind: 'sub',
  },
  'com.cepbutce.premium.yearly': {
    productId: 'com.cepbutce.premium.yearly',
    localizedPrice: '₺499,99',
    price: '499.99',
    currency: 'TRY',
    title: 'CepBütçe Premium — Yıllık',
    description: 'Yıllık yenilenen abonelik',
    kind: 'sub',
  },
  'com.cepbutce.premium.lifetime': {
    productId: 'com.cepbutce.premium.lifetime',
    localizedPrice: '₺999,99',
    price: '999.99',
    currency: 'TRY',
    title: 'CepBütçe Premium — Ömür Boyu',
    description: 'Tek seferlik ödeme',
    kind: 'oneTime',
  },
};

function computeExpiry(productId: ProductId): string | null {
  switch (productId) {
    case 'com.cepbutce.premium.monthly':
      return dayjs().add(1, 'month').toISOString();
    case 'com.cepbutce.premium.yearly':
      return dayjs().add(1, 'year').toISOString();
    case 'com.cepbutce.premium.lifetime':
      return null; // Lifetime never expires
  }
}

let connected = false;

export async function initIAP(): Promise<void> {
  if (!mod) return;
  if (connected) return;
  try {
    await mod.initConnection?.();
    connected = true;
  } catch (e) {
    console.warn('[iap] initConnection failed', e);
  }
}

export async function loadProducts(): Promise<Product[]> {
  if (!mod) {
    return Object.values(MOCK_PRODUCTS);
  }
  try {
    const skus = PRODUCT_IDS;
    const subs = PRODUCT_IDS.filter(
      (id) => MOCK_PRODUCTS[id].kind === 'sub'
    );
    const oneTime = PRODUCT_IDS.filter(
      (id) => MOCK_PRODUCTS[id].kind === 'oneTime'
    );
    const [subProducts, oneTimeProducts] = await Promise.all([
      mod.getSubscriptions?.({ skus: subs }) ?? Promise.resolve([]),
      mod.getProducts?.({ skus: oneTime }) ?? Promise.resolve([]),
    ]);
    const merged = [...(subProducts ?? []), ...(oneTimeProducts ?? [])];
    if (!merged.length) return Object.values(MOCK_PRODUCTS);
    return merged.map((p: any): Product => {
      const id = p.productId as ProductId;
      const fallback = MOCK_PRODUCTS[id];
      return {
        productId: id,
        localizedPrice: p.localizedPrice ?? fallback.localizedPrice,
        price: p.price ?? fallback.price,
        currency: p.currency ?? fallback.currency,
        title: p.title ?? fallback.title,
        description: p.description ?? fallback.description,
        kind: fallback.kind,
      };
    });
  } catch (e) {
    console.warn('[iap] loadProducts failed', e);
    return Object.values(MOCK_PRODUCTS);
  }
}

export async function purchasePremium(productId: ProductId): Promise<PurchaseResult> {
  if (!mod) {
    // Dev fallback: fake a successful purchase so QA can drive the UI end
    // to end without touching the store.
    return {
      productId,
      transactionId: `mock-${Date.now()}`,
      transactionDate: Date.now(),
      transactionReceipt: 'mock-receipt',
      expiresAt: computeExpiry(productId),
    };
  }
  try {
    const isSub = MOCK_PRODUCTS[productId].kind === 'sub';
    const result = isSub
      ? await mod.requestSubscription?.({ sku: productId })
      : await mod.requestPurchase?.({ sku: productId });
    const purchase: any = Array.isArray(result) ? result[0] : result;
    if (!purchase) throw new Error('no-purchase');
    if (mod.finishTransaction) {
      try {
        await mod.finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('[iap] finishTransaction failed', e);
      }
    }
    return {
      productId,
      transactionId: purchase.transactionId ?? `tx-${Date.now()}`,
      transactionDate: purchase.transactionDate ?? Date.now(),
      transactionReceipt:
        purchase.transactionReceipt ?? purchase.purchaseToken ?? '',
      expiresAt: computeExpiry(productId),
    };
  } catch (e) {
    throw new Error(
      e instanceof Error ? e.message : 'purchase-failed'
    );
  }
}

export async function restorePurchases(): Promise<PurchaseResult[]> {
  if (!mod) return [];
  try {
    const purchases: any[] = (await mod.getAvailablePurchases?.()) ?? [];
    return purchases
      .filter((p) =>
        PRODUCT_IDS.includes(p.productId as ProductId)
      )
      .map((p: any): PurchaseResult => ({
        productId: p.productId as ProductId,
        transactionId: p.transactionId ?? `restore-${Date.now()}`,
        transactionDate: p.transactionDate ?? Date.now(),
        transactionReceipt: p.transactionReceipt ?? p.purchaseToken ?? '',
        expiresAt: computeExpiry(p.productId as ProductId),
      }));
  } catch (e) {
    console.warn('[iap] restorePurchases failed', e);
    return [];
  }
}

// Light client-side validation. Real validation must happen on a backend
// calling Apple/Google verification endpoints; this only checks expiry.
export function validateReceipt(result: PurchaseResult): boolean {
  if (!result.transactionId) return false;
  if (!result.expiresAt) return true; // Lifetime
  return dayjs(result.expiresAt).isAfter(dayjs());
}

export async function endIAP(): Promise<void> {
  if (!mod || !connected) return;
  try {
    await mod.endConnection?.();
    connected = false;
  } catch (e) {
    console.warn('[iap] endConnection failed', e);
  }
}

export function getPlatformStoreName(): string {
  return Platform.OS === 'ios' ? 'App Store' : 'Google Play';
}
