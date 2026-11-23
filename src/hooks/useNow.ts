'use client';

import { useEffect, useState } from 'react';

/** Current epoch ms, refreshed every `intervalMs` (pass null to stop ticking). */
export function useNow(intervalMs: number | null = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const kick = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}
