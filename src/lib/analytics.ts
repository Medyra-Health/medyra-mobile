import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'https://medyra.de'}/api`;
const DEVICE_ID_KEY = 'medyra_device_id';

type EventType = 'app_open' | 'screen_view' | 'error';

let cachedDeviceId: string | null = null;

async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
    const generated = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
    cachedDeviceId = generated;
    return generated;
  } catch {
    cachedDeviceId = Crypto.randomUUID();
    return cachedDeviceId;
  }
}

/**
 * Fire-and-forget telemetry. Never blocks or throws — a tracking failure must
 * never affect the app. Records only lifecycle/navigation/crash signals, no
 * health data or user content (hard rule, see CLAUDE.md).
 */
export async function trackEvent(
  eventType: EventType,
  data: Record<string, unknown> = {},
  token?: string | null,
): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    await fetch(`${BASE_URL}/mobile/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventType,
        deviceId,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        ...data,
      }),
    });
  } catch {
    // Telemetry is best-effort only
  }
}
