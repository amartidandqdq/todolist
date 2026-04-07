export function computeNextDate(currentDue: string | null, rule: { freq: string; interval?: number }): string {
  const base = currentDue ? new Date(currentDue) : new Date();
  const interval = rule.interval || 1;

  switch (rule.freq) {
    case 'daily':
      base.setDate(base.getDate() + interval);
      break;
    case 'weekly':
      base.setDate(base.getDate() + 7 * interval);
      break;
    case 'monthly':
      base.setMonth(base.getMonth() + interval);
      break;
  }

  return base.toISOString().split('T')[0];
}
