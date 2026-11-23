import { describe, expect, it } from 'vitest';
import reducer, {
  DEFAULT_DURATIONS,
  completePhase,
  durationMs,
  initialFocusState,
  pauseTimer,
  remainingFor,
  resetTimer,
  setMode,
  skipPhase,
  startTimer,
  todayStats,
} from '@/store/slices/focus';

const d = DEFAULT_DURATIONS;
const T0 = new Date(2026, 5, 15, 10, 0, 0).getTime();

describe('focus timer', () => {
  it('starts, counts down from endsAt, pauses and resumes without drift', () => {
    let s = reducer(initialFocusState, startTimer({ now: T0, durations: d }));
    expect(s.status).toBe('running');
    expect(s.endsAt).toBe(T0 + 25 * 60_000);
    expect(remainingFor(s, T0 + 60_000)).toBe(24 * 60_000);

    s = reducer(s, pauseTimer({ now: T0 + 60_000 }));
    expect(s).toMatchObject({ status: 'paused', endsAt: null, remainingMs: 24 * 60_000 });
    expect(remainingFor(s, T0 + 10 * 60_000)).toBe(24 * 60_000); // paused: frozen

    s = reducer(s, startTimer({ now: T0 + 5 * 60_000, durations: d }));
    expect(s.endsAt).toBe(T0 + 5 * 60_000 + 24 * 60_000);
  });

  it('completing a focus session counts it and moves to a short break', () => {
    let s = reducer(initialFocusState, startTimer({ now: T0, durations: d }));
    s = reducer(s, completePhase({ now: T0 + 25 * 60_000, durations: d, autoStart: false }));
    expect(s).toMatchObject({ mode: 'short', status: 'idle', round: 1 });
    expect(s.remainingMs).toBe(durationMs('short', d));
    expect(todayStats(s, T0)).toEqual({ sessions: 1, minutes: 25 });
  });

  it('takes a long break after `longEvery` sessions, then resets the round', () => {
    let s = initialFocusState;
    for (let i = 0; i < d.longEvery; i += 1) {
      s = reducer(s, setMode({ mode: 'focus', durations: d }));
      s = reducer(s, completePhase({ now: T0 + i, durations: d, autoStart: false }));
    }
    expect(s.mode).toBe('long');
    expect(todayStats(s, T0).sessions).toBe(d.longEvery);
    s = reducer(s, completePhase({ now: T0 + 99, durations: d, autoStart: false }));
    expect(s).toMatchObject({ mode: 'focus', round: 0 });
  });

  it('auto-starts the next phase when enabled', () => {
    const s = reducer(initialFocusState, completePhase({ now: T0, durations: d, autoStart: true }));
    expect(s).toMatchObject({ mode: 'short', status: 'running', endsAt: T0 + 5 * 60_000 });
  });

  it('stats roll over to a new day', () => {
    let s = reducer(initialFocusState, completePhase({ now: T0, durations: d, autoStart: false }));
    const tomorrow = T0 + 26 * 3_600_000;
    expect(todayStats(s, tomorrow)).toEqual({ sessions: 0, minutes: 0 });
    s = reducer(s, setMode({ mode: 'focus', durations: d }));
    s = reducer(s, completePhase({ now: tomorrow, durations: d, autoStart: false }));
    expect(s.stats.sessions).toBe(1);
  });

  it('skip does not count a session; reset restores the full duration', () => {
    let s = reducer(initialFocusState, skipPhase({ now: T0, durations: d }));
    expect(s.mode).toBe('short');
    expect(s.stats.sessions).toBe(0);
    s = reducer(s, resetTimer({ durations: { ...d, shortMin: 7 } }));
    expect(s.remainingMs).toBe(7 * 60_000);
  });
});
