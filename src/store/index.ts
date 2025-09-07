import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import settingsReducer from './slices/settingsSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['settings'], // Only persist settings
};

const persistedReducer = persistReducer(persistConfig, settingsReducer);

export const store = configureStore({
    reducer: {
        settings: persistedReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
