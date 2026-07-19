/**
 * Local dose reminders for the medication planner. No push infrastructure:
 * every reminder is a locally scheduled notification (daily or weekly repeat)
 * per medication and time slot. Rescheduled whenever medications change.
 *
 * Privacy rule: notification content shows only the medication name and dose
 * the user typed. Nothing is logged and nothing leaves the device.
 */
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Medication, MedSlot } from './types';

const ENABLED_KEY = 'medyra.medplan.notifications';
const CHANNEL_ID = 'med-reminders';

const SLOT_ORDER: MedSlot[] = ['morning', 'noon', 'evening', 'night'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function getRemindersEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

async function setRemindersEnabled(on: boolean) {
  try {
    await SecureStore.setItemAsync(ENABLED_KEY, on ? '1' : '0');
  } catch {
    // non fatal: worst case we reschedule on next app start
  }
}

async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medication reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function parseTime(time: string | undefined, fallback: string): { hour: number; minute: number } {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time ?? '');
  const src = m ? time! : fallback;
  const [h, min] = src.split(':').map(Number);
  return { hour: h, minute: min };
}

const FALLBACK_TIMES: Record<MedSlot, string> = {
  morning: '08:00',
  noon: '13:00',
  evening: '19:00',
  night: '22:00',
};

/** Remove every previously scheduled dose reminder. */
export async function cancelAllMedReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.kind === 'med-reminder')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Reschedule reminders for the given medications (active ones only).
 * `title` is the localized notification title, `profileLabel` an optional
 * prefix such as a family member name.
 */
export async function scheduleMedReminders(
  meds: Medication[],
  title: string,
): Promise<number> {
  await ensureChannel();
  await cancelAllMedReminders();

  let count = 0;
  for (const med of meds) {
    if (!med.active) continue;
    for (const slot of SLOT_ORDER) {
      if (!med.slots[slot]) continue;
      const { hour, minute } = parseTime(med.times?.[slot], FALLBACK_TIMES[slot]);
      const body = med.dose ? `${med.name} (${med.dose})` : med.name;
      const content = {
        title,
        body,
        sound: true as const,
        data: { kind: 'med-reminder', medicationId: med.id, slot },
      };
      if (med.days.length === 0) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          },
        });
        count++;
      } else {
        for (const day of med.days) {
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              // expo-notifications weekday: 1 = Sunday … 7 = Saturday
              weekday: day + 1,
              hour,
              minute,
              ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
            },
          });
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * Turn reminders on (requests permission) or off (cancels everything).
 * Returns the resulting enabled state.
 */
export async function setMedRemindersEnabled(
  on: boolean,
  meds: Medication[],
  title: string,
): Promise<boolean> {
  if (!on) {
    await cancelAllMedReminders();
    await setRemindersEnabled(false);
    return false;
  }
  const granted = await ensurePermission();
  if (!granted) {
    await setRemindersEnabled(false);
    return false;
  }
  await scheduleMedReminders(meds, title);
  await setRemindersEnabled(true);
  return true;
}

/** Keep schedules in sync after meds change, if reminders are enabled. */
export async function resyncMedReminders(meds: Medication[], title: string) {
  if (!(await getRemindersEnabled())) return;
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) return;
  await scheduleMedReminders(meds, title);
}
