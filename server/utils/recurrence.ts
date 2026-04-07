/** Recurrence rule parsed from JSON */
interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
}

/**
 * Compute the next occurrence date based on a recurrence rule.
 * @param currentDue - Current due date (ISO string YYYY-MM-DD) or null
 * @param rule - Recurrence rule with freq and optional interval
 * @returns Next due date as YYYY-MM-DD string
 */
export function computeNextDate(currentDue: string | null, rule: RecurrenceRule): string {
  const base = currentDue ? new Date(currentDue) : new Date();
  const interval = rule.interval || 1;

  switch (rule.freq) {
    case 'daily': base.setDate(base.getDate() + interval); break;
    case 'weekly': base.setDate(base.getDate() + 7 * interval); break;
    case 'monthly': base.setMonth(base.getMonth() + interval); break;
    case 'yearly': base.setFullYear(base.getFullYear() + interval); break;
  }

  return base.toISOString().split('T')[0];
}
