import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { hostnameOf, normalizeHttpUrl, uid } from '@/lib/utils';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export interface LinksState {
  items: QuickLink[];
}

export const MAX_LINKS = 24;

export const defaultLinks: QuickLink[] = [
  { id: 'gh', title: 'GitHub', url: 'https://github.com/' },
  { id: 'yt', title: 'YouTube', url: 'https://www.youtube.com/' },
  { id: 'li', title: 'LinkedIn', url: 'https://www.linkedin.com/' },
  { id: 'mail', title: 'Gmail', url: 'https://mail.google.com/' },
  { id: 'cal', title: 'Calendar', url: 'https://calendar.google.com/' },
  { id: 'mdn', title: 'MDN', url: 'https://developer.mozilla.org/' },
];

export const initialLinksState: LinksState = { items: defaultLinks };

const linksSlice = createSlice({
  name: 'links',
  initialState: initialLinksState,
  reducers: {
    addLink: {
      reducer(state, action: PayloadAction<QuickLink>) {
        if (state.items.length < MAX_LINKS) state.items.push(action.payload);
      },
      prepare(input: { title: string; url: string }) {
        const url = normalizeHttpUrl(input.url) ?? '';
        const title = input.title.trim().slice(0, 40) || hostnameOf(url);
        return { payload: { id: uid(), title, url } };
      },
    },
    updateLink(state, action: PayloadAction<{ id: string; title: string; url: string }>) {
      const link = state.items.find((l) => l.id === action.payload.id);
      const url = normalizeHttpUrl(action.payload.url);
      if (!link || !url) return;
      link.url = url;
      link.title = action.payload.title.trim().slice(0, 40) || hostnameOf(url);
    },
    removeLink(state, action: PayloadAction<string>) {
      state.items = state.items.filter((l) => l.id !== action.payload);
    },
    moveLink(state, action: PayloadAction<{ id: string; direction: -1 | 1 }>) {
      const index = state.items.findIndex((l) => l.id === action.payload.id);
      const target = index + action.payload.direction;
      if (index < 0 || target < 0 || target >= state.items.length) return;
      const [item] = state.items.splice(index, 1);
      if (item) state.items.splice(target, 0, item);
    },
    resetLinks: () => initialLinksState,
  },
});

export const { addLink, updateLink, removeLink, moveLink, resetLinks } = linksSlice.actions;
export default linksSlice.reducer;
