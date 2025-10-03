// lib/store/api/questionSetsApi.ts (NEW FILE)

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface QuestionSet {
  id: string;
  name: string;
  description: string;
  created_by_name: string;
  total_questions: number;
  chapters_count: number;
  chapters_names: string[];
  usage_count: number;
  last_used_at?: string;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  is_active: boolean;
  created_at: string;
}

export interface QuestionSetDetail extends QuestionSet {
  questions: string[];
  questions_detail: any[];
  chapters_detail: any[];
}

export interface CreateQuestionSetData {
  name?: string;
  description?: string;
  chapters: string[];
  questions: string[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://127.0.0.1:8000/api/exams/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const questionSetsApi = createApi({
  reducerPath: 'questionSetsApi',
  baseQuery,
  tagTypes: ['QuestionSet'],
  endpoints: (builder) => ({
    getQuestionSets: builder.query<{
      success: boolean;
      question_sets: QuestionSet[];
    }, { search?: string; page?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append('search', params.search);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `question-sets/?${searchParams.toString()}`;
      },
      providesTags: ['QuestionSet'],
    }),

    getQuestionSet: builder.query<{
      success: boolean;
      question_set: QuestionSetDetail;
    }, string>({
      query: (id) => `question-sets/${id}/`,
      providesTags: (result, error, id) => [{ type: 'QuestionSet', id }],
    }),

    getPopularQuestionSets: builder.query<{
      success: boolean;
      question_sets: QuestionSet[];
    }, void>({
      query: () => 'question-sets/popular/',
      providesTags: ['QuestionSet'],
    }),

    createQuestionSet: builder.mutation<{
      success: boolean;
      message: string;
      question_set: QuestionSetDetail;
    }, CreateQuestionSetData>({
      query: (data) => ({
        url: 'question-sets/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['QuestionSet'],
    }),

    updateQuestionSet: builder.mutation<QuestionSet, {
      id: string;
      data: Partial<Pick<QuestionSet, 'name' | 'description' | 'is_active'>>;
    }>({
      query: ({ id, data }) => ({
        url: `question-sets/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuestionSet', id }],
    }),

    deleteQuestionSet: builder.mutation<void, string>({
      query: (id) => ({
        url: `question-sets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QuestionSet'],
    }),

    incrementQuestionSetUsage: builder.mutation<{
      success: boolean;
      message: string;
      usage_count: number;
    }, string>({
      query: (id) => ({
        url: `question-sets/${id}/increment_usage/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'QuestionSet', id }],
    }),
  }),
});

export const {
  useGetQuestionSetsQuery,
  useGetQuestionSetQuery,
  useGetPopularQuestionSetsQuery,
  useCreateQuestionSetMutation,
  useUpdateQuestionSetMutation,
  useDeleteQuestionSetMutation,
  useIncrementQuestionSetUsageMutation,
} = questionSetsApi;