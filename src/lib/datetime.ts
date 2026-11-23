export function greetingFor(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

export interface ClockOptions {
  hour12: boolean;
  seconds: boolean;
}

/** "14:05" / "2:05 PM" (+ seconds). Always splits the day-period so it can be styled separately. */
export function formatClock(date: Date, { hour12, seconds }: ClockOptions): { time: string; period: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hour12,
    hourCycle: hour12 ? 'h12' : 'h23',
  }).formatToParts(date);

  let period = '';
  const time = parts
    .filter((part) => {
      if (part.type === 'dayPeriod') {
        period = part.value.toUpperCase();
        return false;
      }
      return true;
    })
    .map((part) => part.value)
    .join('')
    .trim();
  return { time, period };
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function formatShortWeekday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date(y, m - 1, d));
}

/** Local calendar day key, e.g. "2026-11-23". */
export function dayKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Whole days since the Unix epoch in the *local* calendar — stable for "quote of the day". */
export function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** 1500000 -> "25:00" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function timeAgo(from: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - from);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}
