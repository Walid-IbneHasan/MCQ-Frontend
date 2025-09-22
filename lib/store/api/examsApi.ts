// lib/store/api/examsApi.ts - Enhanced with result calculation
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

// Enhanced types for detailed results
export interface DetailedExamResult {
  success: boolean;
  session: ExamSession;
  result: ExamResultData | null;
  question_analysis: QuestionAnalysis[];
  performance_summary: PerformanceSummary;
}

export interface QuestionAnalysis {
  question_id: string;
  question_text: string;
  question_number: number;
  user_answer_id: string | null;
  user_answer_text: string | null;
  correct_answer_id: string;
  correct_answer_text: string;
  is_correct: boolean;
  marks_awarded: number;
  time_spent_seconds: number;
  difficulty: string;
  chapter_name: string;
  subject_name: string;
  explanation?: string;
  all_options: Array<{
    id: string;
    text: string;
    is_correct: boolean;
    order: number;
  }>;
}

export interface PerformanceSummary {
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  accuracy_percentage: number;
  completion_percentage: number;
  average_time_per_question: number;
  difficulty_breakdown: {
    easy: { attempted: number; correct: number };
    medium: { attempted: number; correct: number };
    hard: { attempted: number; correct: number };
  };
  subject_breakdown: {
    [subject: string]: {
      attempted: number;
      correct: number;
      total_marks: number;
      obtained_marks: number;
    };
  };
}

export interface ExamResultData {
  id: string;
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  total_marks: number;
  marks_obtained: number;
  negative_marks: number;
  score_percentage: number;
  is_passed: boolean;
  grade: string;
  time_taken_seconds: number;
}

// Existing interfaces...
export interface Exam {
  id: string;
  title: string;
  description: string;
  exam_type: 'self_paced' | 'scheduled' | 'practice';
  question_selection_method?: 'random' | 'manual' | 'mixed';
  selected_questions?: string[];
  random_questions_count?: number;
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
    chapter_name?: string;
    subject_name?: string;
    tags: any[];
    options?: Array<{
      id: string;
      option_text: string;
      is_correct: boolean;
      option_order: number;
    }>;
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

export interface BulkSubmitResponse {
  success: boolean;
  message: string;
  successful_submissions: number;
  failed_submissions: number;
  errors: string[];
  answer_details: Array<{
    question_id: string;
    question_text: string;
    selected_option_id: string;
    selected_option_text: string;
    chapter_name: string;
    subject_name: string;
    time_spent_seconds: number;
  }>;
  session_progress: {
    total_questions: number;
    answered_questions: number;
    progress_percentage: number;
  };
}

// Rest of existing interfaces...
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

export interface NewQuestionData {
  question_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  chapter?: string;
  options: {
    option_text: string;
    is_correct: boolean;
    option_order: number;
  }[];
}

export interface ExamCreateData {
  title: string;
  description: string;
  exam_type: 'self_paced' | 'scheduled' | 'practice';
  chapters: string[];
  question_selection_method?: 'random' | 'manual' | 'mixed';
  selected_questions?: string[];
  new_questions?: NewQuestionData[];
  random_questions_count?: number;
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

export interface ChapterQuestionsResponse {
  success: boolean;
  chapters_questions: {
    [chapterId: string]: {
      questions: Question[];
      count: number;
    };
  };
}

export interface Question {
  id: string;
  question_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  chapter_name: string;
  subject_name: string;
  options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    option_order: number;
  }>;
}

export interface QuestionValidationResponse {
  success: boolean;
  validation: {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    summary: {
      [key: string]: any;
    };
  };
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

    // Question selection endpoints
    getChapterQuestions: builder.mutation<ChapterQuestionsResponse, { chapter_ids: string[] }>({
      query: ({ chapter_ids }) => ({
        url: 'exams/get_chapter_questions/',
        method: 'POST',
        body: { chapter_ids },
      }),
    }),

    validateQuestionSelection: builder.mutation<QuestionValidationResponse, {
      question_selection_method: string;
      selected_questions: string[];
      new_questions: NewQuestionData[];
      total_questions: number;
      chapters: string[];
      random_questions_count?: number;
    }>({
      query: (data) => ({
        url: 'exams/validate_question_selection/',
        method: 'POST',
        body: data,
      }),
    }),

    previewExamQuestions: builder.query<{
      success: boolean;
      questions: any[];
      total: number;
      selection_method: string;
    }, string>({
      query: (examId) => `exams/${examId}/preview_questions/`,
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

    // Enhanced bulk submit with detailed response
    bulkSubmitAnswers: builder.mutation<BulkSubmitResponse, {
      sessionId: string;
      answers: Array<{
        question_id: string;
        selected_option_id: string | null;
        time_spent_seconds: number;
      }>;
    }>({
      query: ({ sessionId, answers }) => ({
        url: `sessions/${sessionId}/bulk_submit_answers/`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: ['ExamAnswer'],
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
      providesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
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
      providesTags: (result, error, sessionId) => [{ type: 'ExamSession', id: sessionId }],
    }),

    // Enhanced submit exam with immediate result calculation
    submitExam: builder.mutation<{
      success: boolean;
      message: string;
      session_id: string;
      result?: ExamResultData;
    }, {
      sessionId: string;
    }>({
      query: ({ sessionId }) => ({
        url: `sessions/${sessionId}/submit_exam/`,
        method: 'POST',
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

    // Enhanced session report with detailed analysis
    generateSessionReport: builder.query<{
      success: boolean;
      session: ExamSession;
      result: ExamResultData | null;
    }, string>({
      query: (sessionId) => `sessions/${sessionId}/generate_report/`,
    }),

    // New endpoint for detailed result analysis
    getDetailedResults: builder.query<DetailedExamResult, string>({
      queryFn: async (sessionId, api, extraOptions, baseQuery) => {
        try {
          // Get session report
          const reportResult = await baseQuery(`sessions/${sessionId}/generate_report/`);
          if (reportResult.error) return { error: reportResult.error };

          // Get session answers
          const answersResult = await baseQuery(`sessions/${sessionId}/answer/`);
          if (answersResult.error) return { error: answersResult.error };

          // Get session questions
          const questionsResult = await baseQuery(`sessions/${sessionId}/questions/`);
          if (questionsResult.error) return { error: questionsResult.error };

          const report = reportResult.data as any;
          const answers = answersResult.data as any;
          const questions = questionsResult.data as any;

          // Process detailed results
          const questionAnalysis: QuestionAnalysis[] = questions.questions.map((question: any, index: number) => {
            const userAnswer = answers.answers.find((a: any) => a.question === question.question_detail.id);
            const correctOption = question.question_detail.options?.find((opt: any) => opt.is_correct) || 
                                  question.options.find((opt: any) => opt.is_correct);
            const userSelectedOption = question.options.find((opt: any) => opt.id === userAnswer?.selected_option);

            return {
              question_id: question.question_detail.id,
              question_text: question.question_detail.question_text,
              question_number: index + 1,
              user_answer_id: userAnswer?.selected_option || null,
              user_answer_text: userSelectedOption?.option_text || null,
              correct_answer_id: correctOption?.id || '',
              correct_answer_text: correctOption?.option_text || '',
              is_correct: userAnswer?.is_correct || false,
              marks_awarded: userAnswer?.marks_awarded || 0,
              time_spent_seconds: userAnswer?.time_spent_seconds || 0,
              difficulty: question.question_detail.difficulty,
              chapter_name: question.question_detail.chapter_name || 'Unknown Chapter',
              subject_name: question.question_detail.subject_name || 'Unknown Subject',
              explanation: question.question_detail.explanation,
              all_options: question.options.map((opt: any) => ({
                id: opt.id,
                text: opt.option_text,
                is_correct: question.question_detail.options?.find((o: any) => o.id === opt.id)?.is_correct || false,
                order: opt.option_order,
              })),
            };
          });

          // Calculate performance summary
          const correctAnswers = questionAnalysis.filter(q => q.is_correct).length;
          const wrongAnswers = questionAnalysis.filter(q => !q.is_correct && q.user_answer_id !== null).length;
          const unanswered = questionAnalysis.filter(q => q.user_answer_id === null).length;

          const performanceSummary: PerformanceSummary = {
            total_questions: questionAnalysis.length,
            attempted_questions: correctAnswers + wrongAnswers,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            unanswered,
            accuracy_percentage: correctAnswers + wrongAnswers > 0 ? (correctAnswers / (correctAnswers + wrongAnswers)) * 100 : 0,
            completion_percentage: (correctAnswers + wrongAnswers) / questionAnalysis.length * 100,
            average_time_per_question: report.session.time_spent_seconds / questionAnalysis.length,
            difficulty_breakdown: {
              easy: { attempted: 0, correct: 0 },
              medium: { attempted: 0, correct: 0 },
              hard: { attempted: 0, correct: 0 },
            },
            subject_breakdown: {},
          };

          // Calculate difficulty and subject breakdowns
          questionAnalysis.forEach(q => {
            // Difficulty breakdown
            if (q.user_answer_id !== null) {
              performanceSummary.difficulty_breakdown[q.difficulty as keyof typeof performanceSummary.difficulty_breakdown].attempted++;
              if (q.is_correct) {
                performanceSummary.difficulty_breakdown[q.difficulty as keyof typeof performanceSummary.difficulty_breakdown].correct++;
              }
            }

            // Subject breakdown
            if (!performanceSummary.subject_breakdown[q.subject_name]) {
              performanceSummary.subject_breakdown[q.subject_name] = {
                attempted: 0,
                correct: 0,
                total_marks: 0,
                obtained_marks: 0,
              };
            }
            
            if (q.user_answer_id !== null) {
              performanceSummary.subject_breakdown[q.subject_name].attempted++;
              performanceSummary.subject_breakdown[q.subject_name].obtained_marks += q.marks_awarded;
              if (q.is_correct) {
                performanceSummary.subject_breakdown[q.subject_name].correct++;
              }
            }
            performanceSummary.subject_breakdown[q.subject_name].total_marks += q.marks_awarded > 0 ? q.marks_awarded : 1;
          });

          return {
            data: {
              success: true,
              session: report.session,
              result: report.result,
              question_analysis: questionAnalysis,
              performance_summary: performanceSummary,
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
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
  useGetChapterQuestionsMutation,
  useValidateQuestionSelectionMutation,
  usePreviewExamQuestionsQuery,
  useStartExamMutation,
  useGetMySessionsQuery,
  useGetSessionStatusQuery,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useAbandonSessionMutation,
  useGetSessionQuestionsQuery,
  useGetSessionQuestionQuery,
  useSubmitAnswerMutation,
  useBulkSubmitAnswersMutation,
  useGetSessionAnswersQuery,
  useGetSessionTimerQuery,
  useGetSessionProgressQuery,
  useSubmitExamMutation,
  useMarkForReviewMutation,
  useClearReviewMutation,
  useNavigateToQuestionMutation,
  useGenerateSessionReportQuery,
  useGetDetailedResultsQuery,
} = examsApi;