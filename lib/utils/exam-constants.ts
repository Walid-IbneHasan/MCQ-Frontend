// lib/utils/exam-constants.ts - Centralized constants for exam management
export const EXAM_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress', 
  PAUSED: 'paused',
  COMPLETED: 'completed',
  AUTO_SUBMITTED: 'auto_submitted',
  ABANDONED: 'abandoned'
} as const;

export const QUESTION_STATUS = {
  NOT_VISITED: 'not-visited',
  VISITED: 'visited', 
  ANSWERED: 'answered',
  MARKED: 'marked'
} as const;

export const KEYBOARD_SHORTCUTS = {
  PREVIOUS_QUESTION: 'ArrowLeft',
  NEXT_QUESTION: 'ArrowRight',
  OPTION_1: '1',
  OPTION_2: '2', 
  OPTION_3: '3',
  OPTION_4: '4',
  FLAG_QUESTION: 'f',
  SUBMIT_EXAM: 'Ctrl+Enter'
} as const;