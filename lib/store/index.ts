// lib/store/index.ts (UPDATED)
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { subjectsApi } from './api/subjectsApi';
import { questionsApi } from './api/questionsApi';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    [authApi.reducerPath]: authApi.reducer,
    [subjectsApi.reducerPath]: subjectsApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      authApi.middleware,
      subjectsApi.middleware,
      questionsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;