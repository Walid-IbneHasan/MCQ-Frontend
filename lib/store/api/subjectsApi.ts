// lib/store/api/subjectsApi.ts (FIXED VERSION)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type { 
  Subject, 
  Chapter, 
  SubjectsResponse, 
  ChaptersResponse, 
  SubjectChaptersResponse 
} from '../../../types/subjects';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace('/auth', '/subjects') || 'http://127.0.0.1:8000/api/subjects/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const subjectsApi = createApi({
  reducerPath: 'subjectsApi',
  baseQuery,
  tagTypes: ['Subject', 'Chapter'],
  endpoints: (builder) => ({
    // Subjects endpoints
    getSubjects: builder.query<SubjectsResponse, { search?: string; ordering?: string }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append('search', params.search);
        if (params.ordering) searchParams.append('ordering', params.ordering);
        
        return `subjects/?${searchParams.toString()}`;
      },
      providesTags: ['Subject'],
    }),

    getSubject: builder.query<Subject, string>({
      query: (id) => `subjects/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Subject', id }],
    }),

    getPopularSubjects: builder.query<SubjectsResponse, void>({
      query: () => 'subjects/popular/',
      providesTags: ['Subject'],
    }),

    getSubjectChapters: builder.query<SubjectChaptersResponse, string>({
      query: (subjectId) => `subjects/${subjectId}/chapters/`,
      providesTags: (result, error, subjectId) => [
        { type: 'Subject', id: subjectId },
        'Chapter'
      ],
    }),

    createSubject: builder.mutation<Subject, Partial<Subject>>({
      query: (subject) => ({
        url: 'subjects/',
        method: 'POST',
        body: subject,
      }),
      invalidatesTags: ['Subject'],
    }),

    updateSubject: builder.mutation<Subject, { id: string; data: Partial<Subject> }>({
      query: ({ id, data }) => ({
        url: `subjects/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subject', id }],
    }),

    deleteSubject: builder.mutation<void, string>({
      query: (id) => ({
        url: `subjects/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subject'],
    }),

    // Chapters endpoints
    getChapters: builder.query<ChaptersResponse, { 
      subject?: string; 
      search?: string; 
      ordering?: string;
      page?: number;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.subject) searchParams.append('subject', params.subject);
        if (params.search) searchParams.append('search', params.search);
        if (params.ordering) searchParams.append('ordering', params.ordering);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `chapters/?${searchParams.toString()}`;
      },
      providesTags: ['Chapter'],
    }),

    getChapter: builder.query<Chapter, string>({
      query: (id) => `chapters/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Chapter', id }],
    }),

    // FIXED: Get chapter questions endpoint
    getChapterQuestions: builder.query<{
      success: boolean;
      chapter: Chapter;
      questions: any[];
    }, string>({
      query: (chapterId) => `chapters/${chapterId}/questions/`,
      providesTags: (result, error, chapterId) => [
        { type: 'Chapter', id: chapterId },
        'Question'
      ],
    }),

    // FIXED: Get chapter stats endpoint
    getChapterStats: builder.query<{
      success: boolean;
      chapter: Chapter;
      stats: {
        questions_count: number;
        exams_count: number;
        average_score: number;
      };
    }, string>({
      query: (chapterId) => `chapters/${chapterId}/stats/`,
      providesTags: (result, error, chapterId) => [{ type: 'Chapter', id: chapterId }],
    }),

    createChapter: builder.mutation<Chapter, Partial<Chapter>>({
      query: (chapter) => ({
        url: 'chapters/',
        method: 'POST',
        body: chapter,
      }),
      invalidatesTags: ['Chapter', 'Subject'],
    }),

    updateChapter: builder.mutation<Chapter, { id: string; data: Partial<Chapter> }>({
      query: ({ id, data }) => ({
        url: `chapters/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Chapter', id }],
    }),

    deleteChapter: builder.mutation<void, string>({
      query: (id) => ({
        url: `chapters/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chapter', 'Subject'],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useGetSubjectQuery,
  useGetPopularSubjectsQuery,
  useGetSubjectChaptersQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useGetChaptersQuery,
  useGetChapterQuery,
  useGetChapterQuestionsQuery,
  useGetChapterStatsQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
} = subjectsApi;