// hooks/use-exam-session.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetSessionTimerQuery,
  useGetSessionProgressQuery,
  useSubmitExamMutation,
} from '../lib/store/api/examsApi';
import { useToastContext } from '../lib/providers/toast-provider';

interface UseExamSessionProps {
  sessionId: string;
  onAutoSubmit?: () => void;
}

export function useExamSession({ sessionId, onAutoSubmit }: UseExamSessionProps) {
  const router = useRouter();
  const { toast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSubmitTriggered = useRef(false);

  const {
    data: timerData,
    refetch: refetchTimer,
  } = useGetSessionTimerQuery(sessionId, {
    pollingInterval: 1000, // Poll every second
  });

  const {
    data: progressData,
    refetch: refetchProgress,
  } = useGetSessionProgressQuery(sessionId, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const [submitExam] = useSubmitExamMutation();

  // Auto-submit when time is up
  useEffect(() => {
    const timer = timerData?.timer;
    if (
      timer?.is_time_up && 
      timer.status === 'in_progress' && 
      !autoSubmitTriggered.current
    ) {
      autoSubmitTriggered.current = true;
      handleAutoSubmit();
    }
  }, [timerData?.timer?.is_time_up, timerData?.timer?.status]);

  const handleAutoSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await submitExam({ sessionId });
      
      toast({
        title: "Time's Up!",
        description: "Your exam has been automatically submitted.",
        variant: "destructive",
      });

      if (onAutoSubmit) {
        onAutoSubmit();
      } else {
        router.push(`/exams/session/${sessionId}/results`);
      }
    } catch (error) {
      console.error('Auto-submit failed:', error);
      toast({
        title: "Error",
        description: "Failed to auto-submit exam. Please submit manually.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, submitExam, toast, onAutoSubmit, router]);

  const handleManualSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await submitExam({ sessionId });
      
      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully.",
        variant: "success",
      });

      router.push(`/exams/session/${sessionId}/results`);
    } catch (error: any) {
      console.error('Manual submit failed:', error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to submit exam",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, submitExam, toast, router]);

  return {
    timer: timerData?.timer,
    progress: progressData?.progress,
    isSubmitting,
    handleManualSubmit,
    refetchTimer,
    refetchProgress,
  };
}

// hooks/use-exam-navigation.ts
export function useExamNavigation(
  totalQuestions: number,
  onNavigate?: (index: number) => void
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
      if (onNavigate) {
        onNavigate(index);
      }
    }
  }, [totalQuestions, onNavigate]);

  const goToPrevious = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const goToNext = useCallback(() => {
    goToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, goToQuestion]);

  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < totalQuestions - 1;

  return {
    currentQuestionIndex,
    goToQuestion,
    goToPrevious,
    goToNext,
    canGoPrevious,
    canGoNext,
    setCurrentQuestionIndex,
  };
}

// hooks/use-exam-answers.ts
export function useExamAnswers(sessionId: string) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerTimes, setAnswerTimes] = useState<Record<string, number>>({});

  const selectAnswer = useCallback((questionId: string, optionId: string, timeSpent?: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (timeSpent !== undefined) {
      setAnswerTimes(prev => ({ ...prev, [questionId]: timeSpent }));
    }
  }, []);

  const clearAnswer = useCallback((questionId: string) => {
    setSelectedAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  }, []);

  const getSelectedAnswer = useCallback((questionId: string) => {
    return selectedAnswers[questionId];
  }, [selectedAnswers]);

  const isAnswered = useCallback((questionId: string) => {
    return !!selectedAnswers[questionId];
  }, [selectedAnswers]);

  const getAnsweredCount = useCallback(() => {
    return Object.keys(selectedAnswers).length;
  }, [selectedAnswers]);

  return {
    selectedAnswers,
    answerTimes,
    selectAnswer,
    clearAnswer,
    getSelectedAnswer,
    isAnswered,
    getAnsweredCount,
    setSelectedAnswers,
  };
}

// hooks/use-exam-keyboard.ts
export function useExamKeyboard(
  isActive: boolean,
  handlers: {
    onPrevious?: () => void;
    onNext?: () => void;
    onSelectOption?: (optionIndex: number) => void;
    onToggleFlag?: () => void;
    onSubmit?: () => void;
    onPause?: () => void;
  }
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default for exam-specific shortcuts
      const { key, ctrlKey, altKey, metaKey } = event;

      // Navigation shortcuts
      if (key === 'ArrowLeft' && handlers.onPrevious) {
        event.preventDefault();
        handlers.onPrevious();
      } else if (key === 'ArrowRight' && handlers.onNext) {
        event.preventDefault();
        handlers.onNext();
      }
      
      // Option selection (1-4 or A-D)
      else if (/^[1-4]$/.test(key) && handlers.onSelectOption) {
        event.preventDefault();
        handlers.onSelectOption(parseInt(key) - 1);
      } else if (/^[a-dA-D]$/.test(key) && handlers.onSelectOption) {
        event.preventDefault();
        const optionIndex = key.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        handlers.onSelectOption(optionIndex);
      }
      
      // Flag for review
      else if ((key === 'f' || key === 'F') && handlers.onToggleFlag) {
        event.preventDefault();
        handlers.onToggleFlag();
      }
      
      // Submit exam
      else if (ctrlKey && key === 'Enter' && handlers.onSubmit) {
        event.preventDefault();
        handlers.onSubmit();
      }
      
      // Pause/Resume
      else if (key === ' ' && handlers.onPause) {
        event.preventDefault();
        handlers.onPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handlers]);
}

// hooks/use-exam-visibility.ts
export function useExamVisibility(onVisibilityChange?: (isVisible: boolean) => void) {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [tabSwitches, setTabSwitches] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const newIsVisible = !document.hidden;
      setIsVisible(newIsVisible);
      
      if (!newIsVisible) {
        setTabSwitches(prev => prev + 1);
      }
      
      if (onVisibilityChange) {
        onVisibilityChange(newIsVisible);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange]);

  return { isVisible, tabSwitches };
}

// hooks/use-exam-prevention.ts
export function useExamPrevention(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    // Prevent page refresh/close
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // Prevent context menu
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // Prevent certain key combinations
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey, metaKey, shiftKey } = event;
      
      // Prevent F12 (DevTools)
      if (key === 'F12') {
        event.preventDefault();
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (ctrlKey && shiftKey && key === 'I') {
        event.preventDefault();
      }
      
      // Prevent Ctrl+U (View Source)
      if (ctrlKey && key === 'u') {
        event.preventDefault();
      }
      
      // Prevent Alt+Tab (might be too restrictive)
      // if (altKey && key === 'Tab') {
      //   event.preventDefault();
      // }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}