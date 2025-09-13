// lib/store/api/examsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Types for Exams
export interface Exam {
  id: string;
  title: string;
  description: string;
  exam_type: 'self_paced' | 'scheduled' | 'practice';
  total_questions: number;
  duration_minutes: number;
  scheduled_start?: string;
  scheduled_end?: string;
  marks_per_question: number;
  negative_marking_enabled: boolean;
  negative_marks: number;
  passing_percentage: number;
  is_active: boolean;
  is_public: boolean;
  requires_subscription: boolean;
  allow_retakes: boolean;
  max_attempts: number;
  created_by_name: string;
  chapters_count: number;
  can_start_now: boolean;
  is_scheduled_active: boolean;
  total_attempts: number;
  average_score: number;
  created_at: string;
  chapters?: any[];
  questions_per_chapter?: Record<string, number>;
  difficulty_distribution?: Record<string, number>;
}

export interface ExamSession {
  id: string;
  exam: string;
  exam_detail: Exam;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'auto_submitted' | 'abandoned';
  started_at?: string;
  ended_at?: string;
  submitted_at?: string;
  current_question_index: number;
  answers_submitted: number;
  time_spent_seconds: number;
  duration_minutes: number;
  time_remaining_seconds: number;
  is_time_up: boolean;
  total_score: number;
  percentage_score: number;
  is_passed: boolean;
  tab_switches: number;
  created_at: string;
}

export interface ExamQuestion {
  question_number: number;
  question_detail: {
    id: string;
    question_text: string;
    question_image?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    negative_marks: number;
    explanation?: string;
    tags: any[];
  };
  options: {
    id: string;
    option_text: string;
    option_image?: string;
    option_order: number;
  }[];
  visited_count: number;
  time_spent_seconds: number;
}

export interface ExamAnswer {
  id: string;
  question: string;
  question_text: string;
  selected_option?: string;
  selected_option_text?: string;
  is_correct: boolean;
  marks_awarded: number;
  time_spent_seconds: number;
  is_marked_for_review: boolean;
  answered_at: string;
}

export interface ExamsResponse {
  success: boolean;
  exams: Exam[];
  count?: number;
  next?: string;
  previous?: string;
}

export interface PaginatedExamsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExamsResponse;
}

export interface ExamCreateData {
  title: string;
  description: string;
  exam_type: 'self_paced' | 'scheduled' | 'practice';
  chapters: string[];
  total_questions: number;
  duration_minutes: number;
  time_per_question?: number;
  allow_custom_duration?: boolean;
  max_duration_minutes?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  marks_per_question?: number;
  negative_marking_enabled?: boolean;
  negative_marks?: number;
  passing_percentage?: number;
  is_public?: boolean;
  requires_subscription?: boolean;
  allow_retakes?: boolean;
  max_attempts?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  auto_submit_on_time_up?: boolean;
  grace_period_seconds?: number;
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

export const examsApi = createApi({
  reducerPath: 'examsApi',
  baseQuery,
  tagTypes: ['Exam', 'ExamSession', 'ExamAnswer'],
  endpoints: (builder) => ({
    // Exam endpoints
    getExams: builder.query<PaginatedExamsResponse | ExamsResponse, {
  type?: string;
  subject?: string;
  chapter?: string;
  search?: string;
  page?: number;
}>({
  query: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.append('type', params.type);
    if (params.subject) searchParams.append('subject', params.subject);
    if (params.chapter) searchParams.append('chapter', params.chapter);
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    
    return `exams/?${searchParams.toString()}`;
  },
  providesTags: ['Exam'],
}),

    getExam: builder.query<{
      success: boolean;
      exam: Exam;
      user_attempts: ExamSession[];
      can_attempt: {
        can_attempt: boolean;
        reason: string;
        active_session_id?: string;
      };
    }, string>({
      query: (id) => `exams/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Exam', id }],
    }),

    createExam: builder.mutation<Exam, ExamCreateData>({
      query: (exam) => ({
        url: 'exams/',
        method: 'POST',
        body: exam,
      }),
      invalidatesTags: ['Exam'],
    }),

    updateExam: builder.mutation<Exam, { id: string; data: Partial<ExamCreateData> }>({
      query: ({ id, data }) => ({
        url: `exams/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Exam', id }],
    }),

    deleteExam: builder.mutation<void, string>({
      query: (id) => ({
        url: `exams/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),

    getMyExams: builder.query<{
      success: boolean;
      exam_history: Array<{
        exam: Exam;
        attempts: number;
        best_score: number;
        last_attempt: string;
      }>;
    }, void>({
      query: () => 'exams/my_exams/',
      providesTags: ['Exam'],
    }),

    getUpcomingExams: builder.query<{
      success: boolean;
      upcoming_exams: Exam[];
    }, void>({
      query: () => 'exams/upcoming_exams/',
      providesTags: ['Exam'],
    }),

    // Exam session endpoints
    startExam: builder.mutation<{
      success: boolean;
      message: string;
      session: ExamSession;
    }, { examId: string; customDuration?: number }>({
      query: ({ examId, customDuration }) => ({
        url: `exams/${examId}/start_exam/`,
        method: 'POST',
        body: customDuration ? { custom_duration: customDuration } : {},
      }),
      invalidatesTags: ['ExamSession'],
    }),

    getMySessions: builder.query<{
      success: boolean;
      sessions: ExamSession[];
    }, { status?: string; page?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.append('status', params.status);
        if (params.page) searchParams.append('page', params.page.toString());
        
        return `sessions/my_sessions/?${searchParams.toString()}`;
      },
      providesTags: ['ExamSession'],
    }),

    getSessionStatus: builder.query<{
      success: boolean;
      status: string;
      started_at?: string;
      time_remaining: number;
      answers_submitted: number;
      total_questions: number;
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/status/`,
      providesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
    }),

    pauseSession: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}/pause/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
    }),

    resumeSession: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}/resume/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
    }),

    abandonSession: builder.mutation<{
      success: boolean;
      message: string;
    }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}/abandon/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
    }),

    // Exam questions during session
    getSessionQuestions: builder.query<{
      success: boolean;
      questions: ExamQuestion[];
      total: number;
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/questions/`,
    }),

    getSessionQuestion: builder.query<{
      success: boolean;
      question: ExamQuestion;
    }, { sessionId: string; questionNumber: number }>({
      query: ({ sessionId, questionNumber }) => 
        `sessions/${sessionId}/questions/${questionNumber}/`,
    }),

    // Answer submission
    submitAnswer: builder.mutation<{
      success: boolean;
      message: string;
      answer: ExamAnswer;
    }, {
      sessionId: string;
      questionId: string;
      selectedOptionId?: string;
      timeSpent?: number;
    }>({
      query: ({ sessionId, questionId, selectedOptionId, timeSpent }) => ({
        url: `sessions/${sessionId}/answer/`,
        method: 'POST',
        body: {
          question_id: questionId,
          selected_option_id: selectedOptionId,
          time_spent_seconds: timeSpent || 0,
        },
      }),
      invalidatesTags: ['ExamAnswer'],
    }),

    getSessionAnswers: builder.query<{
      success: boolean;
      answers: ExamAnswer[];
      total_answered: number;
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/answer/`,
      providesTags: ['ExamAnswer'],
    }),

    // Timer and progress
    getSessionTimer: builder.query<{
      success: boolean;
      timer: {
        started_at?: string;
        duration_minutes: number;
        time_remaining_seconds: number;
        is_time_up: boolean;
        status: string;
      };
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/timer/`,
    }),

    getSessionProgress: builder.query<{
      success: boolean;
      progress: {
        total_questions: number;
        answered: number;
        unanswered: number;
        marked_for_review: number;
        percentage_complete: number;
        current_question_index: number;
        time_spent_seconds: number;
      };
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/progress/`,
    }),

    // Final submission
    submitExam: builder.mutation<{
      success: boolean;
      message: string;
      session_id: string;
    }, { sessionId: string; answers?: any[] }>({
      query: ({ sessionId, answers }) => ({
        url: `sessions/${sessionId}/submit_exam/`,
        method: 'POST',
        body: answers ? { answers } : {},
      }),
      invalidatesTags: ['ExamSession', 'ExamAnswer'],
    }),

    // Mark for review
    markForReview: builder.mutation<{
      success: boolean;
      message: string;
    }, { sessionId: string; questionId: string }>({
      query: ({ sessionId, questionId }) => ({
        url: `sessions/${sessionId}/mark_for_review/`,
        method: 'POST',
        body: { question_id: questionId },
      }),
      invalidatesTags: ['ExamAnswer'],
    }),

    clearReview: builder.mutation<{
      success: boolean;
      message: string;
    }, { sessionId: string; questionId: string }>({
      query: ({ sessionId, questionId }) => ({
        url: `sessions/${sessionId}/clear_review/`,
        method: 'POST',
        body: { question_id: questionId },
      }),
      invalidatesTags: ['ExamAnswer'],
    }),

    // Navigation
    navigateToQuestion: builder.mutation<{
      success: boolean;
      current_question: number;
    }, { sessionId: string; questionNumber: number }>({
      query: ({ sessionId, questionNumber }) => ({
        url: `sessions/${sessionId}/navigate_to_question/`,
        method: 'POST',
        body: { question_number: questionNumber },
      }),
      invalidatesTags: (result, error, { sessionId }) => [{ type: 'ExamSession', id: sessionId }],
    }),

    // Session report
    generateSessionReport: builder.query<{
      success: boolean;
      session: ExamSession;
      result: any;
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/generate_report/`,
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetMyExamsQuery,
  useGetUpcomingExamsQuery,
  useStartExamMutation,
  useGetMySessionsQuery,
  useGetSessionStatusQuery,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useAbandonSessionMutation,
  useGetSessionQuestionsQuery,
  useGetSessionQuestionQuery,
  useSubmitAnswerMutation,
  useGetSessionAnswersQuery,
  useGetSessionTimerQuery,
  useGetSessionProgressQuery,
  useSubmitExamMutation,
  useMarkForReviewMutation,
  useClearReviewMutation,
  useNavigateToQuestionMutation,
  useGenerateSessionReportQuery,
} = examsApi;