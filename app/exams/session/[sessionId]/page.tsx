// app/exams/session/[sessionId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import {
  useGetSessionQuestionsQuery,
  useGetSessionTimerQuery,
  useBulkSubmitAnswersMutation,
  useSubmitExamMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useAbandonSessionMutation,
} from "../../../../lib/store/api/examsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  Home,
  RotateCcw,
  XCircle,
  Pause,
  Play,
  Save,
} from "lucide-react";
import { useToastContext } from "../../../../lib/providers/toast-provider";

export default function ExamSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  // State management
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<string, string>
  >({});
  const [timeSpent, setTimeSpent] = React.useState<Record<string, number>>({});
  const [questionStartTimes, setQuestionStartTimes] = React.useState<
    Record<string, number>
  >({});
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = React.useState(false);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  if (!requireAuth()) {
    return null;
  }

  // API hooks
  const { data: questionsResponse, isLoading: isLoadingQuestions } =
    useGetSessionQuestionsQuery(sessionId as string);

  const { data: timerResponse } = useGetSessionTimerQuery(sessionId as string, {
    pollingInterval: 1000, // Poll every second for timer
  });

  // ---------------------
  // FIX: move data extraction ABOVE any effects that use `timer`
  // ---------------------
  const questions = questionsResponse?.questions || [];
  const timer = timerResponse?.timer;
  const examType = questionsResponse?.exam_type || "self_paced";

  // Store questions data in localStorage when questions are loaded
  React.useEffect(() => {
    if (
      questionsResponse?.questions &&
      questionsResponse.questions.length > 0
    ) {
      const storageKey = `exam_questions_${sessionId}`;
      const dataToStore = {
        questions: questionsResponse.questions,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        console.log(
          "Stored questions data in localStorage for session:",
          sessionId
        );
      } catch (error) {
        console.warn("Failed to store questions data in localStorage:", error);
      }
    }
  }, [questionsResponse, sessionId]);

  // Clean up localStorage when component unmounts or session ends
  React.useEffect(() => {
    return () => {
      // Only clean up if session is completed (not if user just navigates away during exam)
      if (timer?.status === "completed" || timer?.status === "auto_submitted") {
        const storageKey = `exam_questions_${sessionId}`;
        // Don't remove immediately, keep it for results page
        setTimeout(() => {
          localStorage.removeItem(storageKey);
          console.log("Cleaned up stored questions data from localStorage");
        }, 5 * 60 * 1000); // Remove after 5 minutes
      }
    };
  }, [sessionId, timer?.status]);

  // Mutations
  const [bulkSubmitAnswers] = useBulkSubmitAnswersMutation();
  const [submitExam, { isLoading: isSubmitting }] = useSubmitExamMutation();
  const [pauseSession] = usePauseSessionMutation();
  const [resumeSession] = useResumeSessionMutation();
  const [abandonSession] = useAbandonSessionMutation();

  // Calculate progress
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Auto-submit when time is up
  React.useEffect(() => {
    if (
      timer?.is_time_up &&
      timer.status === "in_progress" &&
      !autoSubmitTriggered
    ) {
      setAutoSubmitTriggered(true);
      handleAutoSubmit();
    }
  }, [timer?.is_time_up, timer?.status, autoSubmitTriggered]);

  // Initialize question start times
  React.useEffect(() => {
    if (questions.length > 0) {
      const startTimes: Record<string, number> = {};
      questions.forEach((q) => {
        startTimes[q.question_detail.id] = Date.now();
      });
      setQuestionStartTimes(startTimes);
    }
  }, [questions]);

  // Prevent page refresh/close during exam
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timer?.status === "in_progress") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [timer?.status]);

  // Auto-save answers periodically
  React.useEffect(() => {
    if (Object.keys(selectedAnswers).length === 0) return;

    const saveInterval = setInterval(() => {
      if (timer?.status === "in_progress") {
        saveAllAnswers(false); // Auto-save without showing toast
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [selectedAnswers, timer?.status]);

  // Handler functions
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    // Calculate time spent on this question
    const timeSpentOnQuestion = Math.floor(
      (Date.now() - (questionStartTimes[questionId] || Date.now())) / 1000
    );

    // Update local state immediately for better UX
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setTimeSpent((prev) => ({ ...prev, [questionId]: timeSpentOnQuestion }));

    // Update start time for this question for future calculations
    setQuestionStartTimes((prev) => ({ ...prev, [questionId]: Date.now() }));
  };

  const saveAllAnswers = async (showToast = true) => {
    if (isSaving || Object.keys(selectedAnswers).length === 0) return;

    setIsSaving(true);

    try {
      const answers = Object.entries(selectedAnswers).map(
        ([questionId, optionId]) => ({
          question_id: questionId,
          selected_option_id: optionId,
          time_spent_seconds: timeSpent[questionId] || 0,
        })
      );

      const response = await bulkSubmitAnswers({
        sessionId: sessionId as string,
        answers,
      }).unwrap();

      setLastSaved(new Date());

      if (showToast) {
        toast({
          title: "Answers Saved",
          description: `${response.successful_submissions} answers saved successfully`,
          variant: "success",
        });
      }

      return response;
    } catch (error: any) {
      console.error("Failed to save answers:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to save answers. Please try again.",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      // First save all current answers
      await saveAllAnswers(false);

      // Then submit the exam
      await submitExam({
        sessionId: sessionId as string,
      }).unwrap();

      toast({
        title: "Time's Up!",
        description:
          "Your exam has been automatically submitted with your current answers.",
        variant: "destructive",
      });

      // Navigate to results page
      router.push(`/exams/session/${sessionId}/results`);
    } catch (error: any) {
      console.error("Auto-submit failed:", error);
      toast({
        title: "Error",
        description:
          "Failed to auto-submit exam. Please try submitting manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitExam = async () => {
    try {
      // First save all current answers
      const saveResponse = await saveAllAnswers(false);

      if (saveResponse) {
        toast({
          title: "Answers Saved",
          description: `${saveResponse.successful_submissions} answers processed`,
          variant: "success",
        });
      }

      // Then submit the exam
      await submitExam({
        sessionId: sessionId as string,
      }).unwrap();

      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully.",
        variant: "success",
      });

      // Navigate to results page
      router.push(`/exams/session/${sessionId}/results`);
    } catch (error: any) {
      console.error("Submit failed:", error);
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to submit exam",
        variant: "destructive",
      });
    }
  };

  const handlePauseResume = async () => {
    // Only allow pause/resume for self_paced and practice exams
    if (examType === "scheduled") return;

    try {
      if (timer?.status === "in_progress") {
        // Save answers before pausing
        await saveAllAnswers(false);

        await pauseSession(sessionId as string);
        toast({
          title: "Exam Paused",
          description: "Your answers have been saved. You can resume anytime.",
          variant: "success",
        });
      } else if (timer?.status === "paused") {
        await resumeSession(sessionId as string);
        toast({
          title: "Exam Resumed",
          description: "Timer is now running",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update session status",
        variant: "destructive",
      });
    }
  };

  const handleAbandonExam = async () => {
    try {
      await abandonSession(sessionId as string);
      toast({
        title: "Exam Abandoned",
        description: "You can start a new attempt if allowed",
        variant: "success",
      });
      router.push("/exams");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to abandon exam",
        variant: "destructive",
      });
    }
  };

  const handleManualSave = async () => {
    await saveAllAnswers(true);
  };

  // Utility functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (isLoadingQuestions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading exam questions...</p>
        </div>
      </div>
    );
  }

  // Check if session is completed
  if (
    timer?.status === "completed" ||
    timer?.status === "auto_submitted" ||
    timer?.status === "abandoned"
  ) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Exam Completed</h3>
            <p className="text-muted-foreground mb-4">
              This exam session has been completed.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() =>
                  router.push(`/exams/session/${sessionId}/results`)
                }
              >
                View Results
              </Button>
              <Button variant="outline" onClick={() => router.push("/exams")}>
                <Home className="h-4 w-4 mr-2" />
                Back to Exams
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Exam Info */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold">Exam Session</h1>
                <p className="text-sm text-muted-foreground">
                  {totalQuestions} questions total
                </p>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-4">
              {/* Save Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSaving ? (
                  <>
                    <RotateCcw className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>

              {/* Timer Display */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
                  timer && timer.time_remaining_seconds < 300
                    ? "bg-red-100 text-red-800 border border-red-200 animate-pulse"
                    : timer && timer.time_remaining_seconds < 900
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-bold">
                  {timer ? formatTime(timer.time_remaining_seconds) : "00:00"}
                </span>
              </div>

              {/* Session Controls */}
              <div className="flex gap-2">
                {/* Manual Save Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={isSaving || timer?.status !== "in_progress"}
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>

                {/* Pause/Resume only for self_paced and practice exams */}
                {examType !== "scheduled" &&
                  (timer?.status === "in_progress" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePauseResume}
                      disabled={isSaving}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : timer?.status === "paused" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePauseResume}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : null)}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={isSubmitting || isSaving}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Submit Exam
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {answeredCount} of {totalQuestions} questions answered
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>
                <CheckCircle className="h-3 w-3 inline mr-1" />
                {answeredCount} answered
              </span>
              <span>
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {totalQuestions - answeredCount} remaining
              </span>
              <span>{progressPercentage.toFixed(1)}% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - All Questions */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {questions.map((question, questionIndex) => (
            <Card
              key={question.question_detail.id}
              className={`${
                selectedAnswers[question.question_detail.id]
                  ? "ring-2 ring-green-200 bg-green-50/30"
                  : "hover:shadow-md"
              } transition-all duration-200`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {questionIndex + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {question.question_detail.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          {question.question_detail.marks} mark
                          {question.question_detail.marks !== 1 ? "s" : ""}
                        </Badge>
                        {question.question_detail.negative_marks > 0 && (
                          <Badge variant="destructive">
                            -{question.question_detail.negative_marks} for wrong
                          </Badge>
                        )}
                        {selectedAnswers[question.question_detail.id] && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed pl-11">
                  {question.question_detail.question_text}
                </CardDescription>
                {question.question_detail.question_image && (
                  <div className="mt-4 pl-11">
                    <img
                      src={question.question_detail.question_image}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pl-11">
                {question.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      timer?.status !== "in_progress"
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50"
                    } ${
                      selectedAnswers[question.question_detail.id] === option.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border"
                    }`}
                    onClick={() => {
                      if (timer?.status === "in_progress") {
                        handleAnswerSelect(
                          question.question_detail.id,
                          option.id
                        );
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAnswers[question.question_detail.id] ===
                          option.id
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedAnswers[question.question_detail.id] ===
                        option.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          {option.option_text}
                        </p>
                        {option.option_image && (
                          <img
                            src={option.option_image}
                            alt={`Option ${String.fromCharCode(65 + index)}`}
                            className="mt-2 max-w-xs h-auto rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Final Submit Section */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to Submit?</h3>
              <p className="text-muted-foreground mb-4">
                You have answered {answeredCount} out of {totalQuestions}{" "}
                questions.
                {totalQuestions - answeredCount > 0 && (
                  <span className="block text-orange-600 font-medium mt-1">
                    {totalQuestions - answeredCount} questions remain
                    unanswered.
                  </span>
                )}
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={isSaving || timer?.status !== "in_progress"}
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Progress
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAbandonConfirm(true)}
                  disabled={timer?.status !== "in_progress"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Abandon Exam
                </Button>
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={
                    isSubmitting || isSaving || timer?.status !== "in_progress"
                  }
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Exam
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be
              undone.
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Questions answered:</strong> {answeredCount} of{" "}
                    {totalQuestions}
                  </p>
                  <p>
                    <strong>Questions unanswered:</strong>{" "}
                    {totalQuestions - answeredCount}
                  </p>
                  <p>
                    <strong>Progress:</strong> {progressPercentage.toFixed(1)}%
                    complete
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your answers will be saved automatically before submission.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSubmitConfirm(false);
                handleSubmitExam();
              }}
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Exam"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Abandon Confirmation Dialog */}
      <Dialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abandon Exam</DialogTitle>
            <DialogDescription>
              Are you sure you want to abandon this exam? You will lose your
              current attempt and all answers will be lost. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAbandonConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowAbandonConfirm(false);
                handleAbandonExam();
              }}
            >
              Abandon Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
