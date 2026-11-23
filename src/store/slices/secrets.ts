import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Optional, user-supplied API keys. Persisted ONLY to chrome.storage.local on this
 * device, never synced and never included in exports unless explicitly requested.
 */
export interface SecretsState {
  openWeatherKey: string;
  unsplashKey: string;
  pexelsKey: string;
}

export const initialSecretsState: SecretsState = { openWeatherKey: '', unsplashKey: '', pexelsKey: '' };

const secretsSlice = createSlice({
  name: 'secrets',
  initialState: initialSecretsState,
  reducers: {
    setSecrets(state, action: PayloadAction<Partial<SecretsState>>) {
      for (const [key, value] of Object.entries(action.payload)) {
        if (key in state && typeof value === 'string') {
          (state as unknown as Record<string, string>)[key] = value.trim().slice(0, 200);
        }
      }
    },
    clearSecrets: () => initialSecretsState,
  },
});

export const { setSecrets, clearSecrets } = secretsSlice.actions;
export default secretsSlice.reducer;
