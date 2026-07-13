import { trackEvent } from './analytics';

/**
 * Catches uncaught JS exceptions app-wide. Reports only the error message
 * (truncated) and whether it was fatal — never a full object dump, so no
 * health data or user content can leak through (hard rule, see CLAUDE.md).
 */
export function setupCrashReporter() {
  const ErrorUtils = (global as any).ErrorUtils;
  if (typeof ErrorUtils?.setGlobalHandler !== 'function') return;

  const defaultHandler = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    trackEvent('error', {
      message: String(error?.message || 'Unknown error').slice(0, 300),
      fatal: !!isFatal,
    });
    defaultHandler?.(error, isFatal);
  });
}
