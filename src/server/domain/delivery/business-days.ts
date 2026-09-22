/**
 * Calendar arithmetic for delivery promises.
 *
 * Two different units are used on purpose, because that is how the two halves of
 * the promise actually behave:
 *
 * - **Production** is counted in calendar days. "Produção em até 15 dias" is a
 *   wall-clock commitment; the workshop schedule is the store's problem, not the
 *   customer's.
 * - **Handling and carrier transit** are counted in business days, which is how
 *   carriers quote and how the store packs.
 *
 * Public holidays are deliberately not modelled here. A hardcoded holiday table
 * goes stale and would make the promise *look* precise while being wrong.
 * `isBusinessDay` accepts an optional set of non-working dates so a real
 * calendar can be supplied later without touching any of this logic.
 */

const MS_PER_DAY = 86_400_000;

export type IsoDate = `${number}-${number}-${number}`;

/** UTC-safe ISO date key (YYYY-MM-DD), used to look dates up in a holiday set. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function isBusinessDay(date: Date, nonWorkingDays: ReadonlySet<string> = new Set()): boolean {
  return !isWeekend(date) && !nonWorkingDays.has(toDateKey(date));
}

export function addCalendarDays(from: Date, days: number): Date {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError(`days must be a non-negative integer, received ${days}`);
  }
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/**
 * Adds business days, skipping weekends and any supplied non-working dates.
 * Adding zero business days still moves the date forward to the next business
 * day if it lands on a weekend — a parcel posted "today" on a Sunday is really
 * posted on Monday.
 */
export function addBusinessDays(
  from: Date,
  days: number,
  nonWorkingDays: ReadonlySet<string> = new Set()
): Date {
  if (!Number.isInteger(days) || days < 0) {
    throw new RangeError(`days must be a non-negative integer, received ${days}`);
  }

  let cursor = new Date(from.getTime());
  let remaining = days;

  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
    if (isBusinessDay(cursor, nonWorkingDays)) remaining -= 1;
  }

  // Never promise a dispatch or delivery on a non-working day.
  while (!isBusinessDay(cursor, nonWorkingDays)) {
    cursor = new Date(cursor.getTime() + MS_PER_DAY);
  }

  return cursor;
}
