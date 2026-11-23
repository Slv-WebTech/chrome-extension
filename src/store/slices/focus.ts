import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { dayKey } from '@/lib/datetime';

export type FocusMode = 'focus' | 'short' | 'long';
export type FocusStatus = 'idle' | 'running' | 'paused';

export interface FocusDurations {
  focusMin: number;
  shortMin: number;
  longMin: number;
  longEvery: number;
}

export interface FocusState {
  mode: FocusMode;
  status: FocusStatus;
  /** epoch ms at which the running phase finishes */
  endsAt: number | null;
  /** ms left while paused / idle */
  remainingMs: number;
  /** focus sessions finished since the last long break */
  round: number;
  stats: { day: string; sessions: number; minutes: number };
}

export const DEFAULT_DURATIONS: FocusDurations = { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4 };

export function durationMs(mode: FocusMode, d: FocusDurations): number {
  const minutes = mode === 'focus' ? d.focusMin : mode === 'short' ? d.shortMin : d.longMin;
  return Math.max(1, Math.round(minutes)) * 60_000;
}

export const MODE_LABEL: Record<FocusMode, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };

export const initialFocusState: FocusState = {
  mode: 'focus',
  status: 'idle',
  endsAt: null,
  remainingMs: durationMs('focus', DEFAULT_DURATIONS),
  round: 0,
  stats: { day: '', sessions: 0, minutes: 0 },
};

/** Remaining ms for display; derived from `endsAt` so it survives reloads and tab switches. */
export function remainingFor(state: FocusState, now: number): number {
  return state.status === 'running' && state.endsAt !== null ? Math.max(0, state.endsAt - now) : state.remainingMs;
}

export function todayStats(state: FocusState, now: number): { sessions: number; minutes: number } {
  return state.stats.day === dayKey(now)
    ? { sessions: state.stats.sessions, minutes: state.stats.minutes }
    : { sessions: 0, minutes: 0 };
}

interface WithDurations {
  durations: FocusDurations;
}
interface Timed {
  now: number;
}

function enter(state: FocusState, mode: FocusMode, d: FocusDurations, run: boolean, now: number) {
  state.mode = mode;
  state.remainingMs = durationMs(mode, d);
  state.status = run ? 'running' : 'idle';
  state.endsAt = run ? now + state.remainingMs : null;
}

const focusSlice = createSlice({
  name: 'focus',
  initialState: initialFocusState,
  reducers: {
    startTimer(state, action: PayloadAction<Timed & WithDurations>) {
      const { now, durations } = action.payload;
      if (state.status === 'running') return;
      if (state.status === 'idle') state.remainingMs = durationMs(state.mode, durations);
      state.status = 'running';
      state.endsAt = now + state.remainingMs;
    },
    pauseTimer(state, action: PayloadAction<Timed>) {
      if (state.status !== 'running' || state.endsAt === null) return;
      state.remainingMs = Math.max(0, state.endsAt - action.payload.now);
      state.endsAt = null;
      state.status = 'paused';
    },
    resetTimer(state, action: PayloadAction<WithDurations>) {
      state.status = 'idle';
      state.endsAt = null;
      state.remainingMs = durationMs(state.mode, action.payload.durations);
    },
    setMode(state, action: PayloadAction<WithDurations & { mode: FocusMode }>) {
      enter(state, action.payload.mode, action.payload.durations, false, 0);
    },
    /** Phase finished (timer reached zero). Counts focus sessions and picks the next phase. */
    completePhase(state, action: PayloadAction<Timed & WithDurations & { autoStart: boolean }>) {
      const { now, durations, autoStart } = action.payload;
      if (state.mode === 'focus') {
        const today = dayKey(now);
        if (state.stats.day !== today) state.stats = { day: today, sessions: 0, minutes: 0 };
        state.stats.sessions += 1;
        state.stats.minutes += Math.round(durations.focusMin);
        state.round += 1;
        const next: FocusMode = state.round >= durations.longEvery ? 'long' : 'short';
        enter(state, next, durations, autoStart, now);
      } else {
        if (state.mode === 'long') state.round = 0;
        enter(state, 'focus', durations, autoStart, now);
      }
    },
    /** Skip to the next phase without counting it. */
    skipPhase(state, action: PayloadAction<Timed & WithDurations>) {
      const { now, durations } = action.payload;
      if (state.mode === 'focus') {
        const next: FocusMode = state.round + 1 >= durations.longEvery ? 'long' : 'short';
        enter(state, next, durations, false, now);
      } else {
        if (state.mode === 'long') state.round = 0;
        enter(state, 'focus', durations, false, now);
      }
    },
    resetStats(state) {
      state.stats = { day: '', sessions: 0, minutes: 0 };
      state.round = 0;
    },
  },
});

export const { startTimer, pauseTimer, resetTimer, setMode, completePhase, skipPhase, resetStats } = focusSlice.actions;
export default focusSlice.reducer;
