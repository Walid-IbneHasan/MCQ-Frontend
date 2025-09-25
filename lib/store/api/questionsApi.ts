// lib/store/api/questionsApi.ts (UPDATED WITH IMAGE SUPPORT)
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
    // Don't set Content-Type for FormData - let the browser set it
    return headers;
  },
});

export const questionsApi = createApi({
  reducerPath: 'questionsApi',
  baseQuery,
  tagTypes: ['Question', 'QuestionTag', 'Chapter', 'Subject'],
  endpoints: (builder) => ({
    getChapterQuestions: builder.query<ChapterQuestionsResponse, string>({
      query: (chapterId) => `subjects/chapters/${chapterId}/questions/`,
      providesTags: ['Question'],
    }),

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

    // UPDATED: Create question with image support
    createQuestion: builder.mutation<Question, QuestionCreateData>({
      query: (question) => {
        // Create FormData for file uploads
        const formData = new FormData();
        
        // Add basic fields
        formData.append('chapter', question.chapter);
        formData.append('question_text', question.question_text);
        formData.append('difficulty', question.difficulty);
        formData.append('marks', question.marks.toString());
        formData.append('negative_marks', question.negative_marks.toString());
        formData.append('allow_negative_marking', question.allow_negative_marking.toString());
        
        if (question.explanation) {
          formData.append('explanation', question.explanation);
        }
        
        if (question.question_image) {
          formData.append('question_image', question.question_image);
        }
        
        // Add options as JSON string
        formData.append('options', JSON.stringify(question.options));
        
        // Add tags as JSON string
        if (question.tags && question.tags.length > 0) {
          formData.append('tags', JSON.stringify(question.tags));
        }

        return {
          url: 'questions/questions/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Question', 'Chapter', 'Subject'],
    }),

    updateQuestion: builder.mutation<Question, { id: string; data: Partial<QuestionCreateData> }>({
      query: ({ id, data }) => {
        // Create FormData for file uploads
        const formData = new FormData();
        
        // Add fields that are provided
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'question_image' && value instanceof File) {
              formData.append(key, value);
            } else if (key === 'options') {
              formData.append(key, JSON.stringify(value));
            } else if (key === 'tags') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        return {
          url: `questions/questions/${id}/`,
          method: 'PATCH',
          body: formData,
        };
      },
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