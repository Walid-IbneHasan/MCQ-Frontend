// lib/store/api/leaderboardsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  total_exams: number;
  rank_change: number;
  performance_trend: 'improving' | 'declining' | 'stable' | 'new';
  badges: Array<{
    name: string;
    description: string;
    color: string;
  }>;
  exam_date?: string;
}

export interface LeaderboardData {
  id: string;
  exam_title: string;
  exam_type: 'scheduled' | 'practice' | 'self_paced';
  period: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  period_start: string;
  period_end: string;
  total_participants: number;
  top_entries: LeaderboardEntry[];
  user_entry?: {
    rank: number;
    score: number;
    total_exams: number;
    rank_change: number;
  };
  last_updated: string;
}

export interface LeaderboardDetail {
  id: string;
  name: string;
  description: string;
  exam_title?: string;
  exam_type: string;
  period: string;
  period_start: string;
  period_end: string;
  total_participants: number;
  is_current: boolean;
  score_method: string;
  last_updated: string;
}

export interface DetailedLeaderboardEntry {
  rank: number;
  previous_rank?: number;
  rank_change: number;
  user_name: string;
  user_phone: string;
  score: number;
  total_exams: number;
  total_questions: number;
  correct_answers: number;
  average_score: number;
  best_score: number;
  total_time_minutes: number;
  consistency_score: number;
  accuracy_rate: number;
  improvement_rate: number;
  performance_trend: string;
  achievements: Array<{
    title: string;
    description: string;
    icon: string;
    type: string;
  }>;
  badges: Array<{
    name: string;
    description: string;
    color: string;
  }>;
}

export interface UserLeaderboardSummary {
  scheduled_exams: LeaderboardEntry[];
  practice_exams: LeaderboardEntry[];
  global_rankings: LeaderboardEntry[];
  recent_achievements: Array<{
    title: string;
    description: string;
    icon: string;
    earned_from: string;
    earned_at: string;
  }>;
  performance_trends: Array<{
    period: string;
    rank: number;
    score: number;
    trend: string;
    total_participants: number;
  }>;
}

export interface PeriodOption {
  value: string;
  label: string;
  description: string;
}

export interface ExamTypeOption {
  value: string;
  label: string;
  is_default: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://127.0.0.1:8000/api/leaderboards/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const leaderboardsApi = createApi({
  reducerPath: 'leaderboardsApi',
  baseQuery,
  tagTypes: ['Leaderboard', 'LeaderboardEntry', 'UserSummary'],
  endpoints: (builder) => ({
    getExamLeaderboards: builder.query<{
      success: boolean;
      leaderboards: LeaderboardData[];
      period_options: PeriodOption[];
      exam_type_options: ExamTypeOption[];
    }, {
      exam_type?: string;
      period?: string;
      limit?: number;
    }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.exam_type) searchParams.append('exam_type', params.exam_type);
        if (params.period) searchParams.append('period', params.period);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        
        return `exam-leaderboards/?${searchParams.toString()}`;
      },
      providesTags: ['Leaderboard'],
    }),

    getLeaderboardDetail: builder.query<{
      success: boolean;
      leaderboard: LeaderboardDetail;
      entries: DetailedLeaderboardEntry[];
      user_entry?: DetailedLeaderboardEntry;
      statistics: {
        avg_score: number;
        top_score: number;
        total_exams_played: number;
      };
    }, string>({
      query: (leaderboardId) => `leaderboards/${leaderboardId}/detail/`,
      providesTags: (result, error, leaderboardId) => [
        { type: 'Leaderboard', id: leaderboardId },
        'LeaderboardEntry'
      ],
    }),

    getUserLeaderboardSummary: builder.query<{
      success: boolean;
      summary: UserLeaderboardSummary;
      overall_stats: {
        total_leaderboards: number;
        best_rank?: number;
        total_achievements: number;
        total_badges: number;
      };
    }, void>({
      query: () => 'my-summary/',
      providesTags: ['UserSummary'],
    }),

    getAvailablePeriods: builder.query<{
      success: boolean;
      periods: PeriodOption[];
      exam_types: ExamTypeOption[];
      scopes: Array<{
        value: string;
        label: string;
      }>;
    }, void>({
      query: () => 'available-periods/',
    }),

    // Legacy endpoints for compatibility
    getLeaderboards: builder.query<any, any>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined) {
            searchParams.append(key, params[key].toString());
          }
        });
        return `leaderboards/?${searchParams.toString()}`;
      },
      providesTags: ['Leaderboard'],
    }),

    getGlobalRankings: builder.query<{
      success: boolean;
      rankings: LeaderboardData[];
    }, void>({
      query: () => 'leaderboards/global_rankings/',
      providesTags: ['Leaderboard'],
    }),

    getMyRankings: builder.query<{
      success: boolean;
      my_rankings: Record<string, LeaderboardEntry[]>;
    }, void>({
      query: () => 'leaderboards/my_rankings/',
      providesTags: ['UserSummary'],
    }),

    getSubjectRankings: builder.query<{
      success: boolean;
      subject_rankings: LeaderboardData[];
    }, string>({
      query: (subjectId) => `leaderboards/subject_rankings/?subject_id=${subjectId}`,
      providesTags: ['Leaderboard'],
    }),
  }),
});

export const {
  useGetExamLeaderboardsQuery,
  useGetLeaderboardDetailQuery,
  useGetUserLeaderboardSummaryQuery,
  useGetAvailablePeriodsQuery,
  useGetLeaderboardsQuery,
  useGetGlobalRankingsQuery,
  useGetMyRankingsQuery,
  useGetSubjectRankingsQuery,
} = leaderboardsApi;