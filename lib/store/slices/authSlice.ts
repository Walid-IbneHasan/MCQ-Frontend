import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../../types/auth';
import Cookies from 'js-cookie';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        access_token: string;
        refresh_token: string;
      }>
    ) => {
      const { user, access_token, refresh_token } = action.payload;
      state.user = user;
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.isAuthenticated = true;
      state.error = null;

      // Store tokens in cookies
      Cookies.set('access_token', access_token, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', refresh_token, { expires: 7 }); // 7 days
      Cookies.set('user', JSON.stringify(user), { expires: 7 });
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      Cookies.set('access_token', action.payload, { expires: 1 });
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      // Clear cookies
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user');
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    initializeAuth: (state) => {
      const accessToken = Cookies.get('access_token');
      const refreshToken = Cookies.get('refresh_token');
      const userString = Cookies.get('user');

      if (accessToken && refreshToken && userString) {
        try {
          const user = JSON.parse(userString);
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
        } catch (error) {
          // Clear invalid cookies
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          Cookies.remove('user');
        }
      }
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        Cookies.set('user', JSON.stringify(state.user), { expires: 7 });
      }
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  logout,
  setLoading,
  setError,
  clearError,
  initializeAuth,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;