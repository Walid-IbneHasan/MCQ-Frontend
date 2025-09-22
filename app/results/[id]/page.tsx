"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useGetDetailedAnalysisQuery } from "../../../lib/store/api/resultsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  BarChart3,
  User,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../lib/providers/toast-provider";

export default function ResultDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();
  const [showAnswers, setShowAnswers] = useState(false);

  if (!requireAuth()) {
    return null;
  }

  const {
    data: analysisResponse,
    isLoading,
    error,
  } = useGetDetailedAnalysisQuery(id as string);

  const handleExportResult = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Result export will be available soon",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !analysisResponse) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Result Not Found</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load exam result details.
            </p>
            <Button asChild>
              <Link href="/results">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { result, question_analysis, session_stats } = analysisResponse;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/results">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Exam Result Analysis
          </h1>
          <p className="text-muted-foreground">{result.exam_detail.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportResult}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Result Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Final Score
                </p>
                <p
                  className={`text-2xl font-bold ${
                    result.is_passed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {result.percentage_score.toFixed(1)}%
                </p>
              </div>
              <Trophy
                className={`h-8 w-8 ${
                  result.is_passed ? "text-green-600" : "text-red-600"
                }`}
              />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Grade: {result.grade}
              </p>
              <Badge
                variant={result.is_passed ? "default" : "destructive"}
                className="mt-1"
              >
                {result.is_passed ? "PASSED" : "FAILED"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Questions Answered
                </p>
                <p className="text-2xl font-bold">
                  {result.questions_attempted}/{result.total_questions}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress
                value={
                  (result.questions_attempted / result.total_questions) * 100
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(
                  (result.questions_attempted / result.total_questions) *
                  100
                ).toFixed(1)}
                % completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Time Taken
                </p>
                <p className="text-2xl font-bold">
                  {result.time_taken_minutes}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Avg: {result.average_time_per_question.toFixed(0)}s per question
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Accuracy Rate
                </p>
                <p className="text-2xl font-bold">
                  {result.accuracy_rate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Rank: #{result.rank}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Information */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Exam Type</p>
              <Badge variant="outline" className="capitalize mt-1">
                {result.exam_detail.exam_type.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">
                {result.exam_detail.duration_minutes} minutes
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Passing Score</p>
              <p className="font-medium">
                {result.exam_detail.passing_percentage}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Attempt Date</p>
              <p className="font-medium">
                {new Date(result.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="session">Session Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Correct Answers</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600">
                        {result.correct_answers}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (result.correct_answers / result.total_questions) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span>Wrong Answers</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-600">
                        {result.wrong_answers}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (result.wrong_answers / result.total_questions) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-gray-600" />
                      <span>Unanswered</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-600">
                        {result.unanswered_questions}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (result.unanswered_questions /
                            result.total_questions) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Marks Obtained</span>
                      <span className="font-bold">
                        {result.marks_obtained}/{result.total_marks}
                      </span>
                    </div>
                    {result.negative_marks > 0 && (
                      <div className="flex items-center justify-between text-red-600">
                        <span className="text-sm">Negative Marks</span>
                        <span className="text-sm font-medium">
                          -{result.negative_marks}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject & Chapter Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(result.subject_wise_scores).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(result.subject_wise_scores).map(
                      ([subject, scores]: [string, any]) => (
                        <div key={subject}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              {subject}
                            </span>
                            <span className="text-sm font-bold">
                              {scores.percentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <Progress
                            value={scores.percentage || 0}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>
                              {scores.correct || 0}/{scores.questions || 0}{" "}
                              correct
                            </span>
                            <span>
                              {scores.obtained_marks || 0}/
                              {scores.total_marks || 0} marks
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No subject breakdown available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.strong_areas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Strong Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.strong_areas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        ✓ {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.weak_areas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.weak_areas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-red-100 text-red-800"
                      >
                        ⚠ {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Suggested Retakes */}
          {result.suggested_retakes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Suggested Focus Areas</CardTitle>
                <CardDescription>
                  Topics recommended for additional study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.suggested_retakes.map((retake) => (
                    <Badge
                      key={retake}
                      variant="outline"
                      className="border-orange-300 text-orange-700"
                    >
                      📚 {retake}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Toggle to show/hide answers */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Question-by-Question Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed breakdown of each question attempted
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Answers
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Answers
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <div className="space-y-4">
            {question_analysis.map((question, index) => (
              <Card
                key={question.question_id}
                className={`${
                  question.is_correct
                    ? "border-green-200 bg-green-50/30"
                    : question.selected_option !== null
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-200 bg-gray-50/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge
                        variant="secondary"
                        className={
                          question.difficulty === "easy"
                            ? "bg-green-100 text-green-800"
                            : question.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {question.marks_awarded > 0
                          ? `+${question.marks_awarded}`
                          : question.marks_awarded < 0
                          ? `${question.marks_awarded}`
                          : "0"}{" "}
                        marks
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {question.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : question.selected_option !== null ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.floor(question.time_spent / 60)}m{" "}
                        {question.time_spent % 60}s
                      </span>
                    </div>
                  </div>

                  <p className="text-sm mb-3 leading-relaxed">
                    {question.question_text}
                  </p>

                  {showAnswers && (
                    <div className="space-y-2 text-sm border-t pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium text-green-700">
                            Correct Answer:
                          </span>
                          <p className="text-green-600 mt-1">
                            {question.correct_answer || "Not available"}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`font-medium ${
                              question.is_correct
                                ? "text-green-700"
                                : question.selected_option !== null
                                ? "text-red-700"
                                : "text-gray-700"
                            }`}
                          ></span>
                          <p
                            className={`mt-1 ${
                              question.is_correct
                                ? "text-green-600"
                                : question.selected_option !== null
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {question.selected_option || "Not answered"}
                          </p>
                        </div>
                      </div>

                      {question.explanation && (
                        <div className="mt-3 pt-2 border-t">
                          <span className="font-medium text-blue-700">
                            Explanation:
                          </span>
                          <p className="text-blue-600 mt-1 text-xs">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
                    <span>
                      {question.subject} • {question.chapter}
                    </span>
                    <span>
                      Time: {Math.floor(question.time_spent / 60)}m{" "}
                      {question.time_spent % 60}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Difficulty Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(result.difficulty_wise_scores).map(
                    ([difficulty, count]: [string, any]) => {
                      const totalQuestions = question_analysis.filter(
                        (q) => q.difficulty === difficulty
                      ).length;
                      const percentage =
                        totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;

                      return (
                        <div key={difficulty}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">
                              {difficulty}
                            </span>
                            <span className="text-sm font-bold">
                              {count}/{totalQuestions} ({percentage.toFixed(0)}
                              %)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Time Used:</span>
                    <span className="font-bold">
                      {result.time_taken_minutes}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average per Question:</span>
                    <span className="font-bold">
                      {result.average_time_per_question.toFixed(1)}s
                    </span>
                  </div>

                  {question_analysis.length > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Fastest Question:</span>
                        <span className="font-bold text-green-600">
                          {Math.min(
                            ...question_analysis.map((q) => q.time_spent)
                          )}
                          s
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Slowest Question:</span>
                        <span className="font-bold text-red-600">
                          {Math.max(
                            ...question_analysis.map((q) => q.time_spent)
                          )}
                          s
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chapter Performance */}
          {Object.keys(result.chapter_wise_scores).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chapter Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(result.chapter_wise_scores).map(
                    ([chapter, scores]: [string, any]) => (
                      <div key={chapter}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{chapter}</span>
                          <span className="text-sm font-bold">
                            {scores.percentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <Progress
                          value={scores.percentage || 0}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>
                            {scores.correct || 0}/{scores.questions || 0}{" "}
                            correct
                          </span>
                          <span>
                            {scores.obtained_marks || 0}/
                            {scores.total_marks || 0} marks
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Information */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-medium">{result.user_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exam Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {result.exam_detail.exam_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <span className="font-medium">
                      {new Date(result.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration Allowed:</span>
                    <span className="font-medium">
                      {result.exam_detail.duration_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Used:</span>
                    <span className="font-medium">
                      {result.time_taken_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab Switches:</span>
                    <span
                      className={`font-medium ${
                        session_stats.tab_switches > 5
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {session_stats.tab_switches}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Rating */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div
                    className={`text-4xl font-bold ${
                      result.performance_rating === "Excellent"
                        ? "text-green-600"
                        : result.performance_rating === "Very Good" ||
                          result.performance_rating === "Good"
                        ? "text-blue-600"
                        : result.performance_rating === "Average"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.performance_rating}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Score:</span>
                      <span className="font-medium">
                        {result.percentage_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Passing Score:</span>
                      <span className="font-medium">
                        {result.exam_detail.passing_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your Rank:</span>
                      <span className="font-medium">#{result.rank}</span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      result.is_passed
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        result.is_passed ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.is_passed
                        ? "Congratulations! You passed."
                        : "Better luck next time."}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        result.is_passed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {result.is_passed
                        ? `You scored ${(
                            result.percentage_score -
                            result.exam_detail.passing_percentage
                          ).toFixed(1)} points above the passing score.`
                        : `You need ${(
                            result.exam_detail.passing_percentage -
                            result.percentage_score
                          ).toFixed(1)} more points to pass.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-3">Question Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <span className="font-medium">
                        {result.total_questions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attempted:</span>
                      <span className="font-medium">
                        {result.questions_attempted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correct:</span>
                      <span className="font-medium text-green-600">
                        {result.correct_answers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wrong:</span>
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
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Scoring</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <span className="font-medium">{result.total_marks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marks Obtained:</span>
                      <span className="font-medium text-green-600">
                        {result.marks_obtained}
                      </span>
                    </div>
                    {result.negative_marks > 0 && (
                      <div className="flex justify-between">
                        <span>Negative Marks:</span>
                        <span className="font-medium text-red-600">
                          -{result.negative_marks}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Percentage:</span>
                      <span className="font-medium">
                        {result.percentage_score.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grade:</span>
                      <span className="font-medium">{result.grade}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Accuracy Rate:</span>
                      <span className="font-medium">
                        {result.accuracy_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Efficiency:</span>
                      <span className="font-medium">
                        {(
                          (result.time_taken_minutes /
                            result.exam_detail.duration_minutes) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Time/Question:</span>
                      <span className="font-medium">
                        {result.average_time_per_question.toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Rating:</span>
                      <span className="font-medium">
                        {result.performance_rating}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rank:</span>
                      <span className="font-medium">#{result.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
