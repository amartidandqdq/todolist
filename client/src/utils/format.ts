/**
 * Format a due date into a human-readable relative string.
 * @param d - Date string (YYYY-MM-DD) or null
 * @returns 'Today', 'Tomorrow', 'Overdue (date)', locale date, or null
 */
export function formatDate(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  const days = Math.round(diff / 86400000);

  if (days < 0) return `Overdue (${date.toLocaleDateString()})`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return date.toLocaleDateString();
}

/**
 * Convert a recurrence_rule JSON string into a display label.
 * @param rule - JSON string like '{"freq":"weekly","interval":1}' or null
 * @returns Human-readable label like 'Weekly', 'Every 2 Months', or null
 */
export function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null;
  try {
    const r = JSON.parse(rule);
    const interval: number = r.interval || 1;
    if (interval === 1) return r.freq.charAt(0).toUpperCase() + r.freq.slice(1);
    return `Every ${interval} ${r.freq.replace('ly', '')}s`;
  } catch { return null; }
}
