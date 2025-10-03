// lib/store/index.ts 
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { subjectsApi } from './api/subjectsApi';
import { questionsApi } from './api/questionsApi';
import { examsApi } from './api/examsApi';
import { resultsApi } from './api/resultsApi';
import { examAnalyticsApi } from './api/examAnalyticsApi';
import { leaderboardsApi } from './api/leaderboardsApi';
import { questionSetsApi } from './api/questionSetsApi';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    [authApi.reducerPath]: authApi.reducer,
    [subjectsApi.reducerPath]: subjectsApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
    [examsApi.reducerPath]: examsApi.reducer,
    [examAnalyticsApi.reducerPath]: examAnalyticsApi.reducer,
    [resultsApi.reducerPath]: resultsApi.reducer,
    [leaderboardsApi.reducerPath]: leaderboardsApi.reducer,
    [questionSetsApi.reducerPath]: questionSetsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      authApi.middleware,
      subjectsApi.middleware,
      questionsApi.middleware,
      examsApi.middleware,
      examAnalyticsApi.middleware,
      resultsApi.middleware,
      leaderboardsApi.middleware,
      questionSetsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;