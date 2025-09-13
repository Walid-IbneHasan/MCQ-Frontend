// lib/utils/exam-utils.ts

export interface ExamValidationError {
  field: string;
  message: string;
}

export function validateExamData(examData: any): ExamValidationError[] {
  const errors: ExamValidationError[] = [];

  // Title validation
  if (!examData.title || examData.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Exam title is required' });
  } else if (examData.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Exam title must be at least 3 characters' });
  }

  // Chapters validation
  if (!examData.chapters || examData.chapters.length === 0) {
    errors.push({ field: 'chapters', message: 'At least one chapter must be selected' });
  }

  // Questions validation
  if (!examData.total_questions || examData.total_questions < 1) {
    errors.push({ field: 'total_questions', message: 'Total questions must be at least 1' });
  } else if (examData.total_questions > 200) {
    errors.push({ field: 'total_questions', message: 'Total questions cannot exceed 200' });
  }

  // Duration validation
  if (!examData.duration_minutes || examData.duration_minutes < 1) {
    errors.push({ field: 'duration_minutes', message: 'Duration must be at least 1 minute' });
  } else if (examData.duration_minutes > 480) {
    errors.push({ field: 'duration_minutes', message: 'Duration cannot exceed 8 hours' });
  }

  // Passing percentage validation
  if (examData.passing_percentage < 0 || examData.passing_percentage > 100) {
    errors.push({ field: 'passing_percentage', message: 'Passing percentage must be between 0-100' });
  }

  // Scheduled exam validation
  if (examData.exam_type === 'scheduled') {
    if (!examData.scheduled_start) {
      errors.push({ field: 'scheduled_start', message: 'Start time is required for scheduled exams' });
    }
    if (!examData.scheduled_end) {
      errors.push({ field: 'scheduled_end', message: 'End time is required for scheduled exams' });
    }
    if (examData.scheduled_start && examData.scheduled_end) {
      const startDate = new Date(examData.scheduled_start);
      const endDate = new Date(examData.scheduled_end);
      if (startDate >= endDate) {
        errors.push({ field: 'scheduled_end', message: 'End time must be after start time' });
      }
      if (startDate <= new Date()) {
        errors.push({ field: 'scheduled_start', message: 'Start time must be in the future' });
      }
    }
  }

  // Negative marking validation
  if (examData.negative_marking_enabled && examData.negative_marks < 0) {
    errors.push({ field: 'negative_marks', message: 'Negative marks cannot be negative' });
  }

  return errors;
}

export function calculateExamDuration(totalQuestions: number, timePerQuestion: number = 1.2): number {
  return Math.max(totalQuestions * timePerQuestion, 10); // Minimum 10 minutes
}

export function formatExamDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function getExamTypeLabel(type: string): string {
  switch (type) {
    case 'self_paced':
      return 'Self Paced';
    case 'scheduled':
      return 'Scheduled';
    case 'practice':
      return 'Practice';
    default:
      return type;
  }
}

export function getExamStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'auto_submitted':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'abandoned':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  if (percentage >= 30) return 'D';
  return 'F';
}

export function getPerformanceLevel(percentage: number): {
  level: string;
  color: string;
  description: string;
} {
  if (percentage >= 90) {
    return {
      level: 'Excellent',
      color: 'text-green-600',
      description: 'Outstanding performance!'
    };
  }
  if (percentage >= 80) {
    return {
      level: 'Very Good',
      color: 'text-blue-600',
      description: 'Great job!'
    };
  }
  if (percentage >= 70) {
    return {
      level: 'Good',
      color: 'text-indigo-600',
      description: 'Well done!'
    };
  }
  if (percentage >= 60) {
    return {
      level: 'Satisfactory',
      color: 'text-yellow-600',
      description: 'You passed!'
    };
  }
  if (percentage >= 40) {
    return {
      level: 'Below Average',
      color: 'text-orange-600',
      description: 'Needs improvement'
    };
  }
  return {
    level: 'Poor',
    color: 'text-red-600',
    description: 'Consider retaking'
  };
}

export function shouldShowRetakeRecommendation(
  percentage: number,
  passingPercentage: number,
  attempts: number
): boolean {
  return percentage < passingPercentage || (percentage < 70 && attempts < 3);
}

export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getTimeRemainingText(seconds: number): string {
  if (seconds <= 0) return 'Time\'s up!';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

export function isExamAvailable(exam: any): boolean {
  if (!exam.is_active) return false;
  
  if (exam.exam_type === 'scheduled') {
    const now = new Date();
    const start = new Date(exam.scheduled_start);
    const end = new Date(exam.scheduled_end);
    return now >= start && now <= end;
  }
  
  return true;
}

export function canUserAttemptExam(
  exam: any,
  userAttempts: number,
  hasActiveSubscription: boolean
): { canAttempt: boolean; reason: string } {
  if (!isExamAvailable(exam)) {
    return { canAttempt: false, reason: 'Exam is not available' };
  }
  
  if (exam.requires_subscription && !hasActiveSubscription) {
    return { canAttempt: false, reason: 'Active subscription required' };
  }
  
  if (exam.max_attempts > 0 && userAttempts >= exam.max_attempts) {
    return { canAttempt: false, reason: `Maximum ${exam.max_attempts} attempts reached` };
  }
  
  return { canAttempt: true, reason: 'Can start exam' };
}

export function generateExamSummary(result: any): string {
  const { total_questions, correct_answers, wrong_answers, unanswered_questions, score_percentage } = result;
  
  const accuracy = total_questions > 0 ? (correct_answers / total_questions * 100).toFixed(1) : '0';
  const completion = total_questions > 0 ? ((total_questions - unanswered_questions) / total_questions * 100).toFixed(1) : '0';
  
  return `Scored ${score_percentage.toFixed(1)}% | ${correct_answers}/${total_questions} correct | ${accuracy}% accuracy | ${completion}% completion`;
}

export const EXAM_KEYBOARD_SHORTCUTS = {
  'Arrow Left': 'Previous question',
  'Arrow Right': 'Next question',
  '1-4': 'Select option A-D',
  'F': 'Flag for review',
  'Ctrl+Enter': 'Submit exam',
  'Space': 'Pause/Resume (if allowed)',
} as const;