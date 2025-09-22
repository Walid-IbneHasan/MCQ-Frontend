// lib/store/api/resultsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Types for results and analytics
export interface ExamResult {
  id: string;
  exam: string;
  exam_detail: {
    id: string;
    title: string;
    description: string;
    exam_type: string;
    total_questions: number;
    duration_minutes: number;
    marks_per_question: number;
    negative_marking_enabled: boolean;
    negative_marks: number;
    passing_percentage: number;
    created_at: string;
  };
  user_name: string;
  total_questions: number;
  questions_attempted: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  total_marks: number;
  marks_obtained: number;
  negative_marks: number;
  percentage_score: number;
  is_passed: boolean;
  grade: string;
  rank: number;
  time_taken_minutes: number;
  time_taken_seconds: number;
  average_time_per_question: number;
  accuracy_rate: number;
  performance_rating: string;
  subject_wise_scores: Record<string, any>;
  chapter_wise_scores: Record<string, any>;
  difficulty_wise_scores: Record<string, any>;
  weak_areas: string[];
  strong_areas: string[];
  suggested_retakes: string[];
  created_at: string;
}

export interface UserPerformanceAnalytics {
  id: string;
  user_name: string;
  total_exams_taken: number;
  total_exams_passed: number;
  pass_rate: number;
  total_time_spent_hours: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  score_variance: number;
  consistency_rating: string;
  subject_strengths: string[];
  subject_weaknesses: string[];
  subject_wise_averages: Record<string, number>;
  improvement_trend: string;
  progress_rate: number;
  preferred_difficulty: string;
  average_attempt_time: number;
  peak_performance_hours: number[];
  study_recommendations: Array<{
    type: string;
    priority: string;
    message: string;
    subjects?: string[];
    suggestion?: string;
  }>;
  next_level_suggestions: Array<{
    type: string;
    message: string;
    action: string;
  }>;
  last_calculated: string;
}

export interface SubjectPerformance {
  id: string;
  subject_detail: {
    id: string;
    name: string;
    code: string;
    description: string;
  };
  user_name: string;
  exams_taken: number;
  exams_passed: number;
  pass_rate: number;
  average_score: number;
  best_score: number;
  latest_score: number;
  first_attempt_score: number;
  improvement: number;
  trend: string;
  chapter_scores: Record<string, number>;
  weak_chapters: string[];
  strong_chapters: string[];
  difficulty_performance: Record<string, number>;
  average_time_per_exam: number;
  total_time_spent: number;
  recommended_chapters: string[];
  study_priority: string;
  created_at: string;
  updated_at: string;
}

export interface UserDashboard {
  user_info: {
    phone_number: string;
    full_name: string;
    role: string;
    join_date: string;
    is_verified: boolean;
  };
  performance_summary: UserPerformanceAnalytics;
  recent_results: ExamResult[];
  subject_performance: SubjectPerformance[];
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
  progress_chart: Array<{
    date: string;
    score: number;
    exam_title: string;
  }>;
}

export interface DetailedResultAnalysis {
  result: ExamResult;
  question_analysis: Array<{
    question_id: string;
    question_text: string;
    selected_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
    marks_awarded: number;
    time_spent_seconds: number;
    difficulty: string;
    chapter: string;
    subject: string;
    explanation?: string;
  }>;
  session_stats: {
    total_time: number;
    tab_switches: number;
    suspicious_activities: number;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://127.0.0.1:8000/api/results/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const resultsApi = createApi({
  reducerPath: 'resultsApi',
  baseQuery,
  tagTypes: ['ExamResult', 'UserAnalytics', 'SubjectPerformance'],
  endpoints: (builder) => ({
    // Get user's exam results
    getMyResults: builder.query<{
      success: boolean;
      summary: {
        total_exams: number;
        passed_exams: number;
        pass_rate: number;
        average_score: number;
      };
      subject_performance: SubjectPerformance[];
      results: ExamResult[];
    }, {
      page?: number;
      exam?: string;
      start_date?: string;
      end_date?: string;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.exam) searchParams.append('exam', params.exam);
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        
        return `exam-results/my_results/?${searchParams.toString()}`;
      },
      providesTags: ['ExamResult'],
    }),

    // Get user dashboard
    getUserDashboard: builder.query<{
      success: boolean;
      dashboard: UserDashboard;
    }, void>({
      query: () => 'exam-results/dashboard/',
      providesTags: ['UserAnalytics', 'ExamResult', 'SubjectPerformance'],
    }),

    // Get detailed analysis for a specific result
    getDetailedAnalysis: builder.query<{
      success: boolean;
      result: ExamResult;
      question_analysis: Array<{
        question_id: string;
        question_text: string;
        selected_option: string | null;
        is_correct: boolean;
        marks_awarded: number;
        time_spent: number;
        difficulty: string;
        chapter: string;
        subject: string;
        correct_answer?: string;
        explanation?: string;
      }>;
      session_stats: {
        total_time: number;
        tab_switches: number;
        suspicious_activities: number;
      };
    }, string>({
      query: (resultId) => `exam-results/${resultId}/detailed_analysis/`,
      providesTags: (result, error, resultId) => [{ type: 'ExamResult', id: resultId }],
    }),

    // Get user analytics
    getMyAnalytics: builder.query<{
      success: boolean;
      analytics: UserPerformanceAnalytics;
      is_new: boolean;
    }, void>({
      query: () => 'user-analytics/my_analytics/',
      providesTags: ['UserAnalytics'],
    }),

    // Refresh user analytics
    refreshAnalytics: builder.mutation<{
      success: boolean;
      message: string;
      task_id: string;
    }, void>({
      query: () => ({
        url: 'user-analytics/refresh_analytics/',
        method: 'POST',
      }),
      invalidatesTags: ['UserAnalytics'],
    }),

    // Get subject performance
    getMySubjects: builder.query<{
      success: boolean;
      subjects: SubjectPerformance[];
    }, void>({
      query: () => 'subject-performance/my_subjects/',
      providesTags: ['SubjectPerformance'],
    }),

    // Get all results (for teachers/admins)
    getAllResults: builder.query<{
      success: boolean;
      results: ExamResult[];
    }, {
      exam?: string;
      user?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.exam) searchParams.append('exam', params.exam);
        if (params.user) searchParams.append('user', params.user);
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `exam-results/?${searchParams.toString()}`;
      },
      providesTags: ['ExamResult'],
    }),
  }),
});

export const {
  useGetMyResultsQuery,
  useGetUserDashboardQuery,
  useGetDetailedAnalysisQuery,
  useGetMyAnalyticsQuery,
  useRefreshAnalyticsMutation,
  useGetMySubjectsQuery,
  useGetAllResultsQuery,
} = resultsApi;