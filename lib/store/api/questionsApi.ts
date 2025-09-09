// lib/store/api/questionsApi.ts (FINAL FIX - CORRECT ENDPOINTS)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Types for Questions
export interface QuestionOption {
  id: string;
  option_text: string;
  option_image?: string;
  option_order: number;
  is_correct: boolean;
}

export interface QuestionTag {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Question {
  id: string;
  chapter: string;
  chapter_name: string;
  subject_name: string;
  question_text: string;
  question_image?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  allow_negative_marking: boolean;
  is_active: boolean;
  options: QuestionOption[];
  tags: QuestionTag[];
  success_rate: number;
  options_count: number;
  created_by_name?: string;
  created_at: string;
  times_used?: number;
  total_attempts?: number;
  chapter_detail?: any;
}

// Based on your Postman response
export interface ChapterQuestionsResponse {
  success: boolean;
  chapter: any;
  questions: Question[];
}

export interface QuestionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Question[];
}

export interface QuestionCreateData {
  chapter: string;
  question_text: string;
  question_image?: File;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  allow_negative_marking: boolean;
  options: Omit<QuestionOption, 'id'>[];
  tags?: string[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://127.0.0.1:8000/api/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const questionsApi = createApi({
  reducerPath: 'questionsApi',
  baseQuery,
  tagTypes: ['Question', 'QuestionTag', 'Chapter', 'Subject'],
  endpoints: (builder) => ({
    // FIXED: Get questions for a specific chapter (uses subjects API endpoint)
    getChapterQuestions: builder.query<ChapterQuestionsResponse, string>({
      query: (chapterId) => `subjects/chapters/${chapterId}/questions/`,
      providesTags: ['Question'],
    }),

    // Get all questions with filters (uses questions API endpoint)
    getQuestions: builder.query<QuestionsResponse, { 
      chapter?: string; 
      subject?: string;
      difficulty?: string;
      tags?: string;
      search?: string; 
      page?: number;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.chapter) searchParams.append('chapter', params.chapter);
        if (params.subject) searchParams.append('subject', params.subject);
        if (params.difficulty) searchParams.append('difficulty', params.difficulty);
        if (params.tags) searchParams.append('tags', params.tags);
        if (params.search) searchParams.append('search', params.search);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `questions/questions/?${searchParams.toString()}`;
      },
      providesTags: ['Question'],
    }),

    getQuestion: builder.query<Question, string>({
      query: (id) => `questions/questions/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    getRandomQuestions: builder.query<{ success: boolean; questions: Question[]; count: number }, {
      count?: number;
      chapter?: string;
      difficulty?: string;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.count) searchParams.append('count', params.count.toString());
        if (params.chapter) searchParams.append('chapter', params.chapter);
        if (params.difficulty) searchParams.append('difficulty', params.difficulty);
        
        return `questions/questions/random/?${searchParams.toString()}`;
      },
      providesTags: ['Question'],
    }),

    createQuestion: builder.mutation<Question, QuestionCreateData>({
      query: (question) => ({
        url: 'questions/questions/',
        method: 'POST',
        body: question,
      }),
      invalidatesTags: ['Question', 'Chapter', 'Subject'],
    }),

    updateQuestion: builder.mutation<Question, { id: string; data: Partial<QuestionCreateData> }>({
      query: ({ id, data }) => ({
        url: `questions/questions/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Question', id }],
    }),

    deleteQuestion: builder.mutation<void, string>({
      query: (id) => ({
        url: `questions/questions/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Question'],
    }),

    bulkCreateQuestions: builder.mutation<{ success: boolean; message: string; questions_count: number }, {
      chapter: string;
      questions: any[];
    }>({
      query: (data) => ({
        url: 'questions/questions/bulk_create/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Question'],
    }),

    getQuestionStats: builder.query<{
      success: boolean;
      question_id: string;
      stats: {
        times_used: number;
        total_attempts: number;
        correct_attempts: number;
        success_rate: number;
        difficulty: string;
        average_time: number;
      };
    }, string>({
      query: (id) => `questions/questions/${id}/stats/`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),

    // Question Tags endpoints
    getQuestionTags: builder.query<{ success: boolean; tags: QuestionTag[] }, { search?: string }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append('search', params.search);
        
        return `questions/tags/?${searchParams.toString()}`;
      },
      providesTags: ['QuestionTag'],
    }),

    getPopularTags: builder.query<{ success: boolean; tags: QuestionTag[] }, void>({
      query: () => 'questions/tags/popular/',
      providesTags: ['QuestionTag'],
    }),

    createQuestionTag: builder.mutation<QuestionTag, Partial<QuestionTag>>({
      query: (tag) => ({
        url: 'questions/tags/',
        method: 'POST',
        body: tag,
      }),
      invalidatesTags: ['QuestionTag'],
    }),

    updateQuestionTag: builder.mutation<QuestionTag, { id: string; data: Partial<QuestionTag> }>({
      query: ({ id, data }) => ({
        url: `questions/tags/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuestionTag', id }],
    }),

    deleteQuestionTag: builder.mutation<void, string>({
      query: (id) => ({
        url: `questions/tags/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QuestionTag'],
    }),
  }),
});

export const {
  useGetChapterQuestionsQuery,
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useGetRandomQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useBulkCreateQuestionsMutation,
  useGetQuestionStatsQuery,
  useGetQuestionTagsQuery,
  useGetPopularTagsQuery,
  useCreateQuestionTagMutation,
  useUpdateQuestionTagMutation,
  useDeleteQuestionTagMutation,
} = questionsApi;