import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NotesState {
  text: string;
  updatedAt: number | null;
}

export const MAX_NOTE_LENGTH = 20_000;
export const initialNotesState: NotesState = { text: '', updatedAt: null };

const notesSlice = createSlice({
  name: 'notes',
  initialState: initialNotesState,
  reducers: {
    setNotes: {
      reducer(state, action: PayloadAction<{ text: string; at: number }>) {
        state.text = action.payload.text.slice(0, MAX_NOTE_LENGTH);
        state.updatedAt = action.payload.at;
      },
      prepare(text: string, at: number = Date.now()) {
        return { payload: { text, at } };
      },
    },
  },
});

export const { setNotes } = notesSlice.actions;
export default notesSlice.reducer;
