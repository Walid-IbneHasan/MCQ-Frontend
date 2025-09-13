// app/exams/session/[sessionId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import {
  useGetSessionQuestionsQuery,
  useGetSessionProgressQuery,
  useGetSessionTimerQuery,
  useSubmitAnswerMutation,
  useSubmitExamMutation,
  useMarkForReviewMutation,
  useClearReviewMutation,
  useNavigateToQuestionMutation,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useAbandonSessionMutation,
  useGetSessionAnswersQuery,
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
  Clock,
  BookOpen,
  Flag,
  FlagOff,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  Send,
  X,
  Home,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useToastContext } from "../../../../lib/providers/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";

export default function ExamSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<string, string>
  >({});
  const [timeSpent, setTimeSpent] = React.useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = React.useState<number>(
    Date.now()
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = React.useState(false);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = React.useState(false);

  if (!requireAuth()) {
    return null;
  }

  const { data: questionsResponse, isLoading: isLoadingQuestions } =
    useGetSessionQuestionsQuery(sessionId as string);

  const { data: progressResponse, refetch: refetchProgress } =
    useGetSessionProgressQuery(sessionId as string, {
      pollingInterval: 30000, // Poll every 30 seconds
    });

  const { data: timerResponse } = useGetSessionTimerQuery(sessionId as string, {
    pollingInterval: 1000, // Poll every second for timer
  });

  const { data: answersResponse, refetch: refetchAnswers } =
    useGetSessionAnswersQuery(sessionId as string, {
      pollingInterval: 10000, // Poll every 10 seconds
    });

  const [submitAnswer, { isLoading: isSubmittingAnswer }] =
    useSubmitAnswerMutation();
  const [submitExam, { isLoading: isSubmitting }] = useSubmitExamMutation();
  const [markForReview] = useMarkForReviewMutation();
  const [clearReview] = useClearReviewMutation();
  const [navigateToQuestion] = useNavigateToQuestionMutation();
  const [pauseSession] = usePauseSessionMutation();
  const [resumeSession] = useResumeSessionMutation();
  const [abandonSession] = useAbandonSessionMutation();

  const questions = questionsResponse?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = progressResponse?.progress;
  const timer = timerResponse?.timer;

  // Auto-submit when time is up
  React.useEffect(() => {
    if (
      timer?.is_time_up &&
      timer.status === "in_progress" &&
      !autoSubmitTriggered
    ) {
      setAutoSubmitTriggered(true);
      handleSubmitExam(true);
    }
  }, [timer?.is_time_up, timer?.status, autoSubmitTriggered]);

  // Track time spent on current question
  React.useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion?.question_detail.id]);

  // Load saved answers
  React.useEffect(() => {
    if (answersResponse?.answers) {
      const savedAnswers: Record<string, string> = {};
      answersResponse.answers.forEach((answer) => {
        if (answer.selected_option) {
          savedAnswers[answer.question] = answer.selected_option;
        }
      });
      setSelectedAnswers(savedAnswers);
    }
  }, [answersResponse]);

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

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (timer?.status !== "in_progress") return;

      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
        handleNavigateToQuestion(currentQuestionIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        currentQuestionIndex < questions.length - 1
      ) {
        handleNavigateToQuestion(currentQuestionIndex + 1);
      } else if (e.key >= "1" && e.key <= "4") {
        const optionIndex = parseInt(e.key) - 1;
        if (currentQuestion?.options[optionIndex]) {
          handleAnswerSelect(
            currentQuestion.question_detail.id,
            currentQuestion.options[optionIndex].id
          );
        }
      } else if (e.key === "f" || e.key === "F") {
        handleToggleReview();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestionIndex, questions.length, currentQuestion, timer?.status]);

  const handleAnswerSelect = async (questionId: string, optionId: string) => {
    // Calculate time spent on this question
    const timeSpentOnQuestion = Math.floor(
      (Date.now() - questionStartTime) / 1000
    );

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setTimeSpent((prev) => ({ ...prev, [questionId]: timeSpentOnQuestion }));

    try {
      await submitAnswer({
        sessionId: sessionId as string,
        questionId,
        selectedOptionId: optionId,
        timeSpent: timeSpentOnQuestion,
      });

      refetchProgress();
      refetchAnswers();
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToQuestion = async (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);

      try {
        await navigateToQuestion({
          sessionId: sessionId as string,
          questionNumber: questionIndex + 1,
        });
      } catch (error) {
        console.error("Failed to navigate to question:", error);
      }
    }
  };

  const handleToggleReview = async () => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.question_detail.id;
    const isMarkedForReview = answersResponse?.answers?.find(
      (a) => a.question === questionId
    )?.is_marked_for_review;

    try {
      if (isMarkedForReview) {
        await clearReview({
          sessionId: sessionId as string,
          questionId,
        });
        toast({
          title: "Review cleared",
          description: "Question unmarked for review",
          variant: "success",
        });
      } else {
        await markForReview({
          sessionId: sessionId as string,
          questionId,
        });
        toast({
          title: "Marked for review",
          description: "Question marked for review",
          variant: "success",
        });
      }
      refetchAnswers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      });
    }
  };

  const handleSubmitExam = async (autoSubmit = false) => {
    try {
      await submitExam({
        sessionId: sessionId as string,
      });

      toast({
        title: "Exam submitted",
        description: autoSubmit
          ? "Exam auto-submitted due to time limit"
          : "Exam submitted successfully",
        variant: "success",
      });

      router.push(`/exams/session/${sessionId}/results`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to submit exam",
        variant: "destructive",
      });
    }
  };

  const handlePauseResume = async () => {
    try {
      if (timer?.status === "in_progress") {
        await pauseSession(sessionId as string);
        toast({
          title: "Exam paused",
          description: "You can resume anytime",
          variant: "success",
        });
      } else if (timer?.status === "paused") {
        await resumeSession(sessionId as string);
        toast({
          title: "Exam resumed",
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
        title: "Exam abandoned",
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

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return "not-visited";

    const questionId = question.question_detail.id;
    const answer = answersResponse?.answers?.find(
      (a) => a.question === questionId
    );

    if (answer?.is_marked_for_review) return "marked";
    if (answer?.selected_option) return "answered";
    if (question.visited_count > 0) return "visited";
    return "not-visited";
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-500 border-green-600 text-white hover:bg-green-600";
      case "marked":
        return "bg-yellow-500 border-yellow-600 text-white hover:bg-yellow-600";
      case "visited":
        return "bg-blue-500 border-blue-600 text-white hover:bg-blue-600";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200";
    }
  };

  if (isLoadingQuestions || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto" />
          <p>Loading exam session...</p>
        </div>
      </div>
    );
  }

  // Check if session is still valid
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
                <h1 className="text-lg font-semibold">
                  {currentQuestion?.question_detail?.chapter?.name ||
                    "Exam Session"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-4">
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
                {timer?.status === "in_progress" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseResume}
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
                ) : null}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mt-4">
              <Progress value={progress.percentage_complete} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  {progress.answered} answered
                </span>
                <span>
                  <Flag className="h-3 w-3 inline mr-1" />
                  {progress.marked_for_review} for review
                </span>
                <span>
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {progress.unanswered} remaining
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Question */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      Question {currentQuestionIndex + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="capitalize">
                        {currentQuestion.question_detail.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        {currentQuestion.question_detail.marks} mark
                        {currentQuestion.question_detail.marks !== 1 ? "s" : ""}
                      </Badge>
                      {currentQuestion.question_detail.negative_marks > 0 && (
                        <Badge variant="destructive">
                          -{currentQuestion.question_detail.negative_marks} for
                          wrong
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleReview}
                    disabled={timer?.status !== "in_progress"}
                  >
                    {answersResponse?.answers?.find(
                      (a) => a.question === currentQuestion.question_detail.id
                    )?.is_marked_for_review ? (
                      <>
                        <FlagOff className="h-4 w-4 mr-1" />
                        Unmark
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-1" />
                        Mark for Review
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {currentQuestion.question_detail.question_text}
                </CardDescription>
                {currentQuestion.question_detail.question_image && (
                  <div className="mt-4">
                    <img
                      src={currentQuestion.question_detail.question_image}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      timer?.status !== "in_progress"
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50"
                    } ${
                      selectedAnswers[currentQuestion.question_detail.id] ===
                      option.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border"
                    }`}
                    onClick={() => {
                      if (timer?.status === "in_progress") {
                        handleAnswerSelect(
                          currentQuestion.question_detail.id,
                          option.id
                        );
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAnswers[
                            currentQuestion.question_detail.id
                          ] === option.id
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedAnswers[currentQuestion.question_detail.id] ===
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

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() =>
                  handleNavigateToQuestion(currentQuestionIndex - 1)
                }
                disabled={
                  currentQuestionIndex === 0 || timer?.status !== "in_progress"
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                Use keyboard: ← → for navigation, 1-4 for answers, F to flag
              </div>

              <Button
                onClick={() =>
                  handleNavigateToQuestion(currentQuestionIndex + 1)
                }
                disabled={
                  currentQuestionIndex === questions.length - 1 ||
                  timer?.status !== "in_progress"
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigation Panel */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Question Grid */}
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5" />
                    Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {questions.map((_, index) => {
                      const status = getQuestionStatus(index);
                      return (
                        <Button
                          key={index}
                          variant={
                            currentQuestionIndex === index
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={`h-10 w-10 p-0 text-xs font-medium ${
                            currentQuestionIndex !== index
                              ? getQuestionStatusColor(status)
                              : ""
                          }`}
                          onClick={() => handleNavigateToQuestion(index)}
                          disabled={timer?.status !== "in_progress"}
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span>For Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span>Visited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-300"></div>
                      <span>Not Visited</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAbandonConfirm(true)}
                    disabled={timer?.status !== "in_progress"}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Abandon Exam
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
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
              {progress && (
                <div className="mt-2 text-sm">
                  <p>
                    Answered: {progress.answered} / {progress.total_questions}
                  </p>
                  <p>Marked for review: {progress.marked_for_review}</p>
                </div>
              )}
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
              disabled={isSubmitting}
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
