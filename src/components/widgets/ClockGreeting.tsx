'use client';

import { formatClock, formatLongDate, greetingFor } from '@/lib/datetime';
import { useNow } from '@/hooks/useNow';
import { useAppSelector } from '@/store/hooks';

export function ClockGreeting() {
  const { hour12, showSeconds, showGreeting, name } = useAppSelector((s) => s.settings);
  const now = new Date(useNow(1000));
  const { time, period } = formatClock(now, { hour12, seconds: showSeconds });
  const label = name.trim() ? `${greetingFor(now.getHours())}, ${name.trim()}` : greetingFor(now.getHours());

  return (
    <div className="text-on-bg text-center">
      <p
        className="tabular flex items-baseline justify-center gap-2 text-[clamp(3.75rem,11vw,8rem)] leading-none font-semibold tracking-tight"
        aria-label={`Current time ${time} ${period}`.trim()}
        role="timer"
      >
        <span aria-hidden>{time}</span>
        {period && (
          <span aria-hidden className="text-[0.22em] font-medium text-fg-muted">
            {period}
          </span>
        )}
      </p>
      <p className="mt-3 text-base font-medium text-fg sm:text-lg">
        {showGreeting && <span>{label}</span>}
        {showGreeting && <span aria-hidden className="mx-2 text-fg-muted">·</span>}
        <span className="text-fg-muted">{formatLongDate(now)}</span>
      </p>
    </div>
  );
}
