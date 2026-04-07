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

export function recurrenceLabel(rule: string | null): string | null {
  if (!rule) return null;
  try {
    const r = JSON.parse(rule);
    const interval = r.interval || 1;
    if (interval === 1) return r.freq.charAt(0).toUpperCase() + r.freq.slice(1);
    return `Every ${interval} ${r.freq.replace('ly', '')}s`;
  } catch { return null; }
}
