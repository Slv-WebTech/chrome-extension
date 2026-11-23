import { combineReducers, configureStore, createAction } from '@reduxjs/toolkit';
import focus from './slices/focus';
import links from './slices/links';
import notes from './slices/notes';
import secrets from './slices/secrets';
import settings from './slices/settings';
import tasks from './slices/tasks';

const meta = (state = { hydrated: false }, action: { type: string }) =>
  action.type === 'app/hydrated' ? { hydrated: true } : state;

const combined = combineReducers({ settings, tasks, links, notes, focus, secrets, meta });

export type AppState = ReturnType<typeof combined>;

/** Replace persisted slices wholesale (initial load, cross-context sync, import). */
export const hydrate = createAction<Partial<Omit<AppState, 'meta'>>>('app/hydrate');
export const markHydrated = createAction('app/hydrated');

function rootReducer(state: AppState | undefined, action: { type: string }): AppState {
  if (hydrate.match(action as never)) {
    const base = state ?? combined(undefined, { type: '@@init' });
    return combined({ ...base, ...(action as ReturnType<typeof hydrate>).payload }, action);
  }
  return combined(state, action);
}

export function makeStore(preloadedState?: Partial<AppState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as AppState | undefined,
    middleware: (getDefault) => getDefault({ serializableCheck: true, immutableCheck: false }),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = AppState;
export type AppDispatch = AppStore['dispatch'];
