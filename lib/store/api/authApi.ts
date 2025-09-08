import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import {
  LoginRequest,
  RegisterRequest,
  OTPVerificationRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
  AuthResponse,
  User,
  ApiResponse,
} from '../../../types/auth';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/auth/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User', 'Profile'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: 'register/',
        method: 'POST',
        body: userData,
      }),
    }),

    verifyOTP: builder.mutation<AuthResponse, OTPVerificationRequest>({
      query: (otpData) => ({
        url: 'verify-otp/',
        method: 'POST',
        body: otpData,
      }),
    }),

    resendOTP: builder.mutation<ApiResponse, { phone_number: string; otp_type: string }>({
      query: (data) => ({
        url: 'resend-otp/',
        method: 'POST',
        body: data,
      }),
    }),

    logout: builder.mutation<ApiResponse, { refresh_token: string }>({
      query: (data) => ({
        url: 'logout/',
        method: 'POST',
        body: data,
      }),
    }),

    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: (data) => ({
        url: 'token/refresh/',
        method: 'POST',
        body: data,
      }),
    }),

    // Password management
    requestPasswordReset: builder.mutation<ApiResponse, PasswordResetRequest>({
      query: (data) => ({
        url: 'password-reset/',
        method: 'POST',
        body: data,
      }),
    }),

    confirmPasswordReset: builder.mutation<ApiResponse, PasswordResetConfirmRequest>({
      query: (data) => ({
        url: 'password-reset-confirm/',
        method: 'POST',
        body: data,
      }),
    }),

    changePassword: builder.mutation<ApiResponse, ChangePasswordRequest>({
      query: (data) => ({
        url: 'change-password/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Profile management
    getProfile: builder.query<User, void>({
      query: () => 'profile/',
      providesTags: ['Profile'],
    }),

    
    updateProfile: builder.mutation<User, FormData>({
      query: (data) => ({
        url: 'profile/',
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['Profile', 'User'],
    }),

    // Permissions
    getUserPermissions: builder.query<{ success: boolean; permissions: any[] }, void>({
      query: () => 'permissions/',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useChangePasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetUserPermissionsQuery,
} = authApi;