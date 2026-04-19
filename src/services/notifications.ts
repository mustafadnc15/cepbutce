import dayjs from 'dayjs';
import { Platform } from 'react-native';
import type { Subscription } from '../types';
import { formatCurrency } from '../utils/currency';

// Lazy / optional import. The spec requires @notifee/react-native, but the
// package is not installed during Phase 4 scaffold (requires `pod install`).
// When missing we log once and no-op so the rest of the app still works.
let notifee: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  notifee = require('@notifee/react-native').default;
} catch {
  console.warn(
    '[notifications] @notifee/react-native not installed. Reminders are disabled. ' +
      'Run: npm install @notifee/react-native && cd ios && pod install'
  );
}

const CHANNEL_ID = 'subscription-reminders';
const CHANNEL_NAME = 'Abonelik Hatırlatmaları';

// Permissions are requested lazily (on the first add with reminders on) so the
// user sees the OS prompt in a moment when they've shown intent.
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!notifee) return false;
  try {
    const settings = await notifee.requestPermission();
    // iOS: authorizationStatus 1 = authorized, 2 = provisional. Android: always granted.
    if (Platform.OS === 'ios') {
      return settings.authorizationStatus >= 1;
    }
    return true;
  } catch (e) {
    console.warn('[notifications] permission request failed', e);
    return false;
  }
}

async function ensureChannel(): Promise<void> {
  if (!notifee || Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: 4, // HIGH
  });
}

function reminderId(subscriptionId: string): string {
  return `sub-${subscriptionId}`;
}

// Reminder fires (nextRenewalDate − remindBefore days) at 10:00 local time.
// Returns true if scheduled, false if the fire time is in the past, we lack
// permission, or notifee isn't installed.
export async function scheduleSubscriptionReminder(
  sub: Subscription,
  language: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!notifee) return false;
  if (!sub.isActive || sub.remindBefore <= 0) return false;

  const fire = dayjs(sub.nextRenewalDate)
    .subtract(sub.remindBefore, 'day')
    .hour(10)
    .minute(0)
    .second(0)
    .millisecond(0);

  if (fire.isBefore(dayjs())) return false;

  await ensureChannel();

  const title = language === 'tr' ? '🔔 Abonelik Yenilenecek' : '🔔 Subscription renewing';
  const dateStr = dayjs(sub.nextRenewalDate)
    .locale(language)
    .format('D MMMM');
  const amountStr = formatCurrency(
    sub.amount,
    sub.currency as 'TRY' | 'USD' | 'EUR' | 'GBP',
    language
  );
  const body =
    language === 'tr'
      ? `${sub.name} aboneliğiniz ${dateStr} tarihinde yenilenecek. ${amountStr}`
      : `Your ${sub.name} subscription renews on ${dateStr}. ${amountStr}`;

  try {
    await notifee.createTriggerNotification(
      {
        id: reminderId(sub.id),
        title,
        body,
        android: {
          channelId: CHANNEL_ID,
          smallIcon: 'ic_launcher',
          color: '#00C864',
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      },
      {
        type: 1, // TriggerType.TIMESTAMP
        timestamp: fire.valueOf(),
      }
    );
    return true;
  } catch (e) {
    console.warn('[notifications] schedule failed', e);
    return false;
  }
}

export async function cancelReminder(subscriptionId: string): Promise<void> {
  if (!notifee) return;
  try {
    await notifee.cancelTriggerNotification(reminderId(subscriptionId));
  } catch (e) {
    console.warn('[notifications] cancel failed', e);
  }
}

// Cancel and re-schedule all active subs with a reminder. Called at app launch
// and after advancePastRenewals() so notifications stay in sync.
export async function rescheduleAll(
  subs: Subscription[],
  language: 'tr' | 'en' = 'tr'
): Promise<void> {
  if (!notifee) return;
  for (const sub of subs) {
    await cancelReminder(sub.id);
    if (sub.isActive && sub.remindBefore > 0) {
      await scheduleSubscriptionReminder(sub, language);
    }
  }
}
