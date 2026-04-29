/**
 * Moroccan Date & Time Utilities
 * Locale: fr-MA | Timezone: Africa/Casablanca
 * Format: DD/MM/YYYY HH:mm (French Moroccan standard)
 */

const MA_LOCALE = 'fr-MA';
const MA_TIMEZONE = { timeZone: 'Africa/Casablanca' };

/** Returns time only: "14:35" */
export function toMATime(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString(MA_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    ...MA_TIMEZONE
  });
}

/** Returns time with seconds: "14:35:22" */
export function toMATimeFull(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString(MA_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...MA_TIMEZONE
  });
}

/** Returns date only: "29/04/2026" */
export function toMADate(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '--/--/----';
  return d.toLocaleDateString(MA_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...MA_TIMEZONE
  });
}

/** Returns full date + time: "29/04/2026 14:35" */
export function toMADateTime(date?: string | Date): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '--/--/---- --:--';
  return d.toLocaleString(MA_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...MA_TIMEZONE
  });
}
