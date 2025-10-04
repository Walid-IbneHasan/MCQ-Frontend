// lib/store/api/usersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface User {
  id: string;
  phone_number: string;
  email?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  profile_picture?: string;
  bio?: string;
  role: 'student' | 'teacher' | 'moderator' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  count: number;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UsersResponse;
}

export interface CreateUserData {
  phone_number: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'student' | 'teacher' | 'moderator' | 'admin';
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'student' | 'teacher' | 'moderator' | 'admin';
  is_active?: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://127.0.0.1:8000/api/auth/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedUsersResponse | UsersResponse, {
      search?: string;
      role?: string;
      is_active?: string;
      page?: number;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append('search', params.search);
        if (params.role) searchParams.append('role', params.role);
        if (params.is_active) searchParams.append('is_active', params.is_active);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `users/?${searchParams.toString()}`;
      },
      providesTags: ['User'],
    }),

    getUser: builder.query<{ success: boolean; user: User }, string>({
      query: (id) => `users/${id}/`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    createUser: builder.mutation<{
      success: boolean;
      message: string;
      user: User;
    }, CreateUserData>({
      query: (data) => ({
        url: 'users/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<{
      success: boolean;
      message: string;
      user: User;
    }, { id: string; data: UpdateUserData }>({
      query: ({ id, data }) => ({
        url: `users/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    deleteUser: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (id) => ({
        url: `users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;