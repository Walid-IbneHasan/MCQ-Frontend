// app/exams/session/[sessionId]/results/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../hooks/use-auth";
import { useGenerateSessionReportQuery } from "../../../../../lib/store/api/examsApi";
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
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../../lib/providers/toast-provider";

export default function ExamResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  if (!requireAuth()) {
    return null;
  }

  const {
    data: reportResponse,
    isLoading,
    error,
  } = useGenerateSessionReportQuery(sessionId as string);

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto" />
          <p>Generating your results...</p>
        </div>
      </div>
    );
  }

  if (error || !reportResponse) {
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

  const { session, result } = reportResponse;

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
              {result?.correct_answers || 0}
            </div>
            <p className="text-sm text-muted-foreground">Correct</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">
              {result?.wrong_answers || 0}
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

      {/* Detailed Results */}
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
              {result && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <span className="font-medium">
                        {result.total_questions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attempted:</span>
                      <span className="font-medium">
                        {result.attempted_questions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correct Answers:</span>
                      <span className="font-medium text-green-600">
                        {result.correct_answers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wrong Answers:</span>
                      <span className="font-medium text-red-600">
                        {result.wrong_answers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unanswered:</span>
                      <span className="font-medium text-gray-600">
                        {result.unanswered_questions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marks Obtained:</span>
                      <span className="font-medium">
                        {result.marks_obtained}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <span className="font-medium">{result.total_marks}</span>
                    </div>
                    {result.negative_marks > 0 && (
                      <div className="flex justify-between">
                        <span>Negative Marks:</span>
                        <span className="font-medium text-red-600">
                          -{result.negative_marks}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Accuracy</span>
                        <span>
                          {result.attempted_questions > 0
                            ? (
                                (result.correct_answers /
                                  result.attempted_questions) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          result.attempted_questions > 0
                            ? (result.correct_answers /
                                result.attempted_questions) *
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
                            (result.attempted_questions /
                              result.total_questions) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (result.attempted_questions /
                            result.total_questions) *
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
                      <Progress
                        value={session.percentage_score}
                        className="h-2"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Exam Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Exam Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span>Exam Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {session.exam_detail.exam_type.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {session.duration_minutes} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-medium">
                    {session.exam_detail.passing_percentage}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge
                    variant={
                      session.status === "completed" ? "default" : "secondary"
                    }
                    className="capitalize"
                  >
                    {session.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span>Started At:</span>
                  <span className="font-medium">
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Submitted At:</span>
                  <span className="font-medium">
                    {session.submitted_at
                      ? new Date(session.submitted_at).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
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
              {result && (
                <>
                  {session.percentage_score <
                    session.exam_detail.passing_percentage && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">
                        💡 Recommendation
                      </p>
                      <p className="text-yellow-700 mt-1">
                        You need {session.exam_detail.passing_percentage}% to
                        pass. Consider reviewing the topics and retaking the
                        exam.
                      </p>
                    </div>
                  )}

                  {result.correct_answers / result.total_questions >= 0.8 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        🎉 Great Performance!
                      </p>
                      <p className="text-green-700 mt-1">
                        You answered{" "}
                        {(
                          (result.correct_answers / result.total_questions) *
                          100
                        ).toFixed(0)}
                        % of questions correctly. Keep up the good work!
                      </p>
                    </div>
                  )}

                  {result.unanswered_questions >
                    result.total_questions * 0.2 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 font-medium">
                        ⏰ Time Management
                      </p>
                      <p className="text-blue-700 mt-1">
                        You left {result.unanswered_questions} questions
                        unanswered. Try to manage your time better in future
                        attempts.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800 font-medium">📊 Statistics</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Average time per question:</span>
                        <span>
                          {(
                            session.time_spent_seconds / result.total_questions
                          ).toFixed(0)}
                          s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions per minute:</span>
                        <span>
                          {(
                            result.total_questions /
                            (session.time_spent_seconds / 60)
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
