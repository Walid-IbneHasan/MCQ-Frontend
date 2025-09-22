// app/exams/session/[sessionId]/results/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../hooks/use-auth";
import {
  useGenerateSessionReportQuery,
  useGetSessionAnswersQuery,
} from "../../../../../lib/store/api/examsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import { Progress } from "../../../../../components/ui/progress";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Home,
  Download,
  Share2,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../../lib/providers/toast-provider";

interface QuestionResult {
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

export default function ExamResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);

  if (!requireAuth()) {
    return null;
  }

  const {
    data: reportResponse,
    isLoading: reportLoading,
    error: reportError,
  } = useGenerateSessionReportQuery(sessionId as string);

  const { data: answersResponse, isLoading: answersLoading } =
    useGetSessionAnswersQuery(sessionId as string);

  // Process question results when both data are available
  useEffect(() => {
    if (reportResponse?.session && answersResponse?.answers) {
      processQuestionResults();
    }
  }, [reportResponse, answersResponse]);

  const processQuestionResults = async () => {
    if (!reportResponse?.session || !answersResponse?.answers) return;

    setLoading(true);
    try {
      // Try to get questions from localStorage first (stored during exam session)
      const storedQuestionsKey = `exam_questions_${sessionId}`;
      const storedQuestionsData = localStorage.getItem(storedQuestionsKey);

      let questions = [];

      if (storedQuestionsData) {
        // Use stored questions data
        const parsedData = JSON.parse(storedQuestionsData);
        questions = parsedData.questions || [];
        console.log("Using stored questions data from localStorage");
      } else {
        // Fallback: try to fetch from API (might not work for completed sessions)
        try {
          const questionsResponse = await fetch(
            `http://127.0.0.1:8000/api/exams/sessions/${sessionId}/questions/`,
            {
              headers: {
                Authorization: `Bearer ${user?.accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            questions = questionsData.questions || [];
            console.log("Fetched questions data from API");
          } else {
            throw new Error("API fetch failed");
          }
        } catch (apiError) {
          console.warn(
            "Could not fetch questions from API, session might be completed"
          );
          toast({
            title: "Limited Results",
            description:
              "Some detailed question analysis may not be available.",
            variant: "default",
          });
          // Set basic results without detailed question analysis
          setQuestionResults([]);
          setLoading(false);
          return;
        }
      }

      // Map answers with questions to create detailed results
      const results: QuestionResult[] = questions.map(
        (question: any, index: number) => {
          // Find user's answer for this question
          const userAnswer = answersResponse.answers.find(
            (answer: any) => answer.question === question.question_detail.id
          );

          // Find correct option from question options
          const correctOption =
            question.question_detail.options?.find(
              (opt: any) => opt.is_correct
            ) || question.options.find((opt: any) => opt.is_correct);

          // Find user's selected option text
          const userSelectedOption = question.options.find(
            (opt: any) => opt.id === userAnswer?.selected_option
          );

          return {
            question_id: question.question_detail.id,
            question_text: question.question_detail.question_text,
            question_number: index + 1,
            user_answer_id: userAnswer?.selected_option || null,
            user_answer_text: userSelectedOption?.option_text || null,
            correct_answer_id: correctOption?.id || "",
            correct_answer_text: correctOption?.option_text || "",
            is_correct: userAnswer?.is_correct || false,
            marks_awarded: userAnswer?.marks_awarded || 0,
            time_spent_seconds: userAnswer?.time_spent_seconds || 0,
            difficulty: question.question_detail.difficulty,
            chapter_name:
              question.question_detail.chapter_name || "Unknown Chapter",
            subject_name:
              question.question_detail.subject_name || "Unknown Subject",
            explanation: question.question_detail.explanation,
            all_options: question.options.map((opt: any) => ({
              id: opt.id,
              text: opt.option_text,
              is_correct:
                question.question_detail.options?.find(
                  (o: any) => o.id === opt.id
                )?.is_correct || false,
              order: opt.option_order,
            })),
          };
        }
      );

      setQuestionResults(results);
    } catch (error) {
      console.error("Error processing question results:", error);
      toast({
        title: "Error",
        description: "Failed to load detailed question results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareResults = async () => {
    if (!reportResponse?.session) return;

    const shareData = {
      title: `Exam Results - ${reportResponse.session.exam_detail.title}`,
      text: `I scored ${reportResponse.session.percentage_score.toFixed(
        1
      )}% on ${reportResponse.session.exam_detail.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        toast({
          title: "Copied to clipboard",
          description: "Results link copied to clipboard",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share results",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C+";
    if (percentage >= 40) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (reportLoading || answersLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto" />
          <p>Generating your detailed results...</p>
        </div>
      </div>
    );
  }

  if (reportError || !reportResponse) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">
              Results Not Available
            </h3>
            <p className="text-muted-foreground mb-4">
              Unable to load exam results. Please try again later.
            </p>
            <Button onClick={() => router.push("/exams")}>
              <Home className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session } = reportResponse;
  const correctAnswers = questionResults.filter((q) => q.is_correct).length;
  const wrongAnswers = questionResults.filter(
    (q) => !q.is_correct && q.user_answer_id !== null
  ).length;
  const unanswered = questionResults.filter(
    (q) => q.user_answer_id === null
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div
          className={`text-6xl font-bold ${getScoreColor(
            session.percentage_score
          )}`}
        >
          {session.percentage_score.toFixed(1)}%
        </div>
        <div className="flex items-center justify-center gap-2">
          {session.is_passed ? (
            <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
              <Trophy className="h-5 w-5 mr-2" />
              PASSED
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <XCircle className="h-5 w-5 mr-2" />
              FAILED
            </Badge>
          )}
          <Badge variant="outline" className="text-lg px-4 py-2">
            Grade: {getGradeFromPercentage(session.percentage_score)}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{session.exam_detail.title}</h1>
        <p className="text-muted-foreground">
          Completed on{" "}
          {new Date(
            session.submitted_at || session.ended_at || ""
          ).toLocaleDateString()}
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{session.total_score}</div>
            <p className="text-sm text-muted-foreground">Total Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              {correctAnswers}
            </div>
            <p className="text-sm text-muted-foreground">Correct</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">
              {wrongAnswers}
            </div>
            <p className="text-sm text-muted-foreground">Incorrect</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(session.time_spent_seconds)}
            </div>
            <p className="text-sm text-muted-foreground">Time Taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-medium">{questionResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attempted:</span>
                  <span className="font-medium">
                    {correctAnswers + wrongAnswers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Correct Answers:</span>
                  <span className="font-medium text-green-600">
                    {correctAnswers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Wrong Answers:</span>
                  <span className="font-medium text-red-600">
                    {wrongAnswers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered:</span>
                  <span className="font-medium text-gray-600">
                    {unanswered}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Marks Obtained:</span>
                  <span className="font-medium">{session.total_score}</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accuracy</span>
                    <span>
                      {correctAnswers + wrongAnswers > 0
                        ? (
                            (correctAnswers / (correctAnswers + wrongAnswers)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      correctAnswers + wrongAnswers > 0
                        ? (correctAnswers / (correctAnswers + wrongAnswers)) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion Rate</span>
                    <span>
                      {(
                        ((correctAnswers + wrongAnswers) /
                          questionResults.length) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((correctAnswers + wrongAnswers) /
                        questionResults.length) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Score</span>
                    <span>{session.percentage_score.toFixed(1)}%</span>
                  </div>
                  <Progress value={session.percentage_score} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question-wise Analysis Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Question Analysis
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                >
                  {showQuestionDetails ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show Details
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            {showQuestionDetails && (
              <CardContent>
                <div className="space-y-4">
                  {questionResults.map((result) => (
                    <Card
                      key={result.question_id}
                      className="border-l-4 border-l-gray-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Q{result.question_number}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getDifficultyColor(
                                result.difficulty
                              )}`}
                            >
                              {result.difficulty}
                            </Badge>
                            {result.is_correct ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            ) : result.user_answer_id ? (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Wrong
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Unanswered
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.marks_awarded > 0
                              ? `+${result.marks_awarded}`
                              : result.marks_awarded < 0
                              ? `${result.marks_awarded}`
                              : "0"}{" "}
                            marks
                          </div>
                        </div>

                        <p className="text-sm mb-3 leading-relaxed">
                          {result.question_text}
                        </p>

                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium text-green-700">
                                Correct Answer:
                              </span>
                              <p className="text-green-600 mt-1">
                                {result.correct_answer_text}
                              </p>
                            </div>
                            {result.user_answer_text && (
                              <div>
                                <span
                                  className={`font-medium ${
                                    result.is_correct
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  Your Answer:
                                </span>
                                <p
                                  className={`mt-1 ${
                                    result.is_correct
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {result.user_answer_text}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                            <span>
                              {result.subject_name} • {result.chapter_name}
                            </span>
                            <span>
                              Time: {Math.floor(result.time_spent_seconds / 60)}
                              m {result.time_spent_seconds % 60}s
                            </span>
                          </div>

                          {result.explanation && (
                            <div className="pt-2 border-t">
                              <span className="font-medium text-blue-700">
                                Explanation:
                              </span>
                              <p className="text-blue-600 mt-1 text-xs">
                                {result.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Actions Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleShareResults} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>

              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>

              {session.exam_detail.allow_retakes && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/exams/${session.exam_detail.id}`}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Exam
                  </Link>
                </Button>
              )}

              <Button asChild variant="ghost" className="w-full">
                <Link href="/exams">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Exams
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {session.percentage_score <
                session.exam_detail.passing_percentage && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    💡 Recommendation
                  </p>
                  <p className="text-yellow-700 mt-1">
                    You need {session.exam_detail.passing_percentage}% to pass.
                    Consider reviewing the topics and retaking the exam.
                  </p>
                </div>
              )}

              {correctAnswers / questionResults.length >= 0.8 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎉 Great Performance!
                  </p>
                  <p className="text-green-700 mt-1">
                    You answered{" "}
                    {((correctAnswers / questionResults.length) * 100).toFixed(
                      0
                    )}
                    % of questions correctly. Keep up the good work!
                  </p>
                </div>
              )}

              {unanswered > questionResults.length * 0.2 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    ⏰ Time Management
                  </p>
                  <p className="text-blue-700 mt-1">
                    You left {unanswered} questions unanswered. Try to manage
                    your time better in future attempts.
                  </p>
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800 font-medium">📊 Statistics</p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Average time per question:</span>
                    <span>
                      {questionResults.length > 0
                        ? (
                            session.time_spent_seconds / questionResults.length
                          ).toFixed(0)
                        : 0}
                      s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions per minute:</span>
                    <span>
                      {session.time_spent_seconds > 0
                        ? (
                            questionResults.length /
                            (session.time_spent_seconds / 60)
                          ).toFixed(1)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
