import { useAuth } from '@clerk/clerk-expo';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { trackEvent } from '@/lib/analytics';

/** Renders nothing — fires app_open once and screen_view on every route change. */
export function AppAnalytics() {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const hasTrackedOpen = useRef(false);

  useEffect(() => {
    if (hasTrackedOpen.current) return;
    hasTrackedOpen.current = true;
    getToken()
      .then(token => trackEvent('app_open', {}, token))
      .catch(() => trackEvent('app_open'));
  }, [getToken]);

  useEffect(() => {
    if (!pathname) return;
    getToken()
      .then(token => trackEvent('screen_view', { screen: pathname }, token))
      .catch(() => trackEvent('screen_view', { screen: pathname }));
  }, [pathname, getToken]);

  return null;
}
