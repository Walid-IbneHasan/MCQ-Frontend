// lib/store/api/examAnalyticsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Updated types based on the actual API response
export interface DetailedExamAnalytics {
  summary: {
    exam_title: string;
    total_attempts: number;
    unique_students: number;
    pass_rate: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
    average_time: number;
    total_questions: number;
    exam_duration: number;
    passing_percentage: number;
    created_at: string;
    created_by: string;
  };
  participants: ParticipantDetail[];
  question_analytics: QuestionAnalyticsDetail[];
  subject_performance: Record<string, SubjectPerformance>;
  chapter_performance: Record<string, ChapterPerformance>;
  recommendations: Recommendation[];
  generated_at: string;
}

export interface ParticipantDetail {
  user_id: string;
  user_name: string;
  user_phone: string;
  score_percentage: number;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  rank: number;
  is_passed: boolean;
  time_taken_minutes: number;
  correct_answers: number;
  wrong_answers_count: number;
  unanswered_count: number;
  accuracy_rate: number;
  subject_wise_scores: Record<string, any>;
  chapter_wise_scores: Record<string, any>;
  weak_areas: string[];
  strong_areas: string[];
  wrong_answers_detail: WrongAnswerDetail[];
  unanswered_detail: UnansweredDetail[];
  attempt_date: string;
  session_details: {
    tab_switches: number;
    duration_minutes: number;
    ip_address: string;
    started_at: string;
    ended_at: string;
  };
}

export interface QuestionAnalyticsDetail {
  question_number: number;
  question_id: string;
  question_text: string;
  chapter: string;
  subject: string;
  difficulty: string;
  marks: number;
  total_attempts: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  success_rate: number;
  average_time_spent: number;
  option_breakdown: Record<string, OptionBreakdown>;
  needs_review: boolean;
}

export interface OptionBreakdown {
  option_text: string;
  is_correct: boolean;
  selections: number;
  percentage: number;
}

export interface WrongAnswerDetail {
  question_id: string;
  question_text: string;
  selected_answer: string;
  correct_answer: string;
  chapter: string;
  subject: string;
  difficulty: string;
  marks_lost: number;
}

export interface UnansweredDetail {
  question_id: string;
  question_text: string;
  chapter: string;
  subject: string;
  difficulty: string;
  marks_lost: number;
}

export interface SubjectPerformance {
  total_students: number;
  total_score: number;
  scores: number[];
  average_score: number;
  min_score: number;
  max_score: number;
  is_weak: boolean;
}

export interface ChapterPerformance {
  total_students: number;
  total_score: number;
  scores: number[];
  average_score: number;
  min_score: number;
  max_score: number;
  is_weak: boolean;
}

export interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
}

export interface UserExamDetail {
  user_info: {
    id: string;
    name: string;
    phone_number: string;
    role: string;
  };
  session_info: {
    id: string;
    status: string;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
    time_spent_seconds: number;
    tab_switches: number;
    ip_address: string;
  };
  overall_performance: {
    total_questions: number;
    attempted_questions: number;
    correct_answers: number;
    wrong_answers: number;
    unanswered_questions: number;
    marks_obtained: number;
    score_percentage: number;
    grade: string;
    is_passed: boolean;
    time_taken_seconds: number;
  };
  question_by_question: Array<{
    question_number: number;
    question_text: string;
    difficulty: string;
    marks: number;
    chapter_name: string;
    subject_name: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    marks_awarded: number;
    time_spent_seconds: number;
    explanation?: string;
  }>;
  time_analysis: {
    total_time_seconds: number;
    average_time_per_question: number;
    fastest_question: number;
    slowest_question: number;
  };
  comparison_with_others: {
    rank: number;
    total_participants: number;
    percentile: number;
    average_score: number;
    performance_vs_average: number;
  };
  recommendations: Recommendation[];
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

export const examAnalyticsApi = createApi({
  reducerPath: 'examAnalyticsApi',
  baseQuery,
  tagTypes: ['ExamAnalytics', 'UserAnalytics'],
  endpoints: (builder) => ({
    // Use the detailed analytics endpoint that actually returns data
    getExamAnalytics: builder.query<{
      success: boolean;
      analytics: DetailedExamAnalytics | null;
      message?: string;
      debug_info?: any;
    }, string>({
      query: (examId) => `exams/${examId}/detailed_analytics/`,
      providesTags: (result, error, examId) => [{ type: 'ExamAnalytics', id: examId }],
    }),

    getUserExamDetail: builder.query<{
      success: boolean;
      analysis: UserExamDetail;
    }, { examId: string; userId: string }>({
      query: ({ examId, userId }) => `exams/${examId}/participants/${userId}/`,
      providesTags: (result, error, { examId, userId }) => [
        { type: 'UserAnalytics', id: `${examId}-${userId}` }
      ],
    }),

    compareExamParticipants: builder.mutation<{
      success: boolean;
      comparison: any;
    }, {
      examId: string;
      comparison_type: 'users' | 'attempts';
      participant_ids: string[];
    }>({
      query: ({ examId, ...body }) => ({
        url: `exams/${examId}/compare/`,
        method: 'POST',
        body,
      }),
    }),

    // Refresh analytics (force recalculation)
    refreshExamAnalytics: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (examId) => ({
        url: `exams/${examId}/analytics/refresh/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, examId) => [{ type: 'ExamAnalytics', id: examId }],
    }),

    exportExamAnalytics: builder.mutation<Blob, {
      examId: string;
      format: 'pdf' | 'excel' | 'csv';
      include_participants?: boolean;
      include_questions?: boolean;
    }>({
      query: ({ examId, ...params }) => ({
        url: `exams/${examId}/analytics/export/`,
        method: 'POST',
        body: params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetExamAnalyticsQuery,
  useGetUserExamDetailQuery,
  useCompareExamParticipantsMutation,
  useRefreshExamAnalyticsMutation,
  useExportExamAnalyticsMutation,
} = examAnalyticsApi;