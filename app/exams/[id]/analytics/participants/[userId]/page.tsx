// app/exams/[id]/analytics/participants/[userId]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../../hooks/use-auth";
import { useGetUserExamDetailQuery } from "../../../../../../lib/store/api/examAnalyticsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../../components/ui/card";
import { Button } from "../../../../../../components/ui/button";
import { Badge } from "../../../../../../components/ui/badge";
import { Progress } from "../../../../../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../../components/ui/tabs";
import {
  ArrowLeft,
  User,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  BarChart3,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../../../../lib/utils/constants";

export default function ParticipantDetailPage() {
  const { id: examId, userId } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();
  const [showAnswers, setShowAnswers] = React.useState(false);

  if (!requireAuth()) {
    return null;
  }

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              You don't have permission to view participant details.
            </p>
            <Button asChild className="mt-4">
              <Link href="/exams">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exams
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    data: detailResponse,
    isLoading,
    error,
  } = useGetUserExamDetailQuery({
    examId: examId as string,
    userId: userId as string,
  });

  const handleExportReport = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Individual report export will be available soon",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !detailResponse?.analysis) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">
              Participant Details Not Available
            </h3>
            <p className="text-muted-foreground mb-4">
              Unable to load participant details. The user may not have
              attempted this exam.
            </p>
            <Button asChild>
              <Link href={`/exams/${examId}/analytics`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = detailResponse.analysis;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/exams/${examId}/analytics`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            Participant Analysis
          </h1>
          <p className="text-muted-foreground">
            Detailed performance breakdown for {analysis.user_info.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Participant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{analysis.user_info.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{analysis.user_info.phone_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline">{analysis.user_info.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session ID</p>
              <p className="font-mono text-sm">
                {analysis.session_info.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
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
                    analysis.overall_performance.is_passed
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analysis.overall_performance.score_percentage.toFixed(1)}%
                </p>
              </div>
              <Trophy
                className={`h-8 w-8 ${
                  analysis.overall_performance.is_passed
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Grade: {analysis.overall_performance.grade}
              </p>
              <Badge
                variant={
                  analysis.overall_performance.is_passed
                    ? "default"
                    : "destructive"
                }
                className="mt-1"
              >
                {analysis.overall_performance.is_passed ? "PASSED" : "FAILED"}
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
                  {analysis.overall_performance.attempted_questions}/
                  {analysis.overall_performance.total_questions}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress
                value={
                  (analysis.overall_performance.attempted_questions /
                    analysis.overall_performance.total_questions) *
                  100
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(
                  (analysis.overall_performance.attempted_questions /
                    analysis.overall_performance.total_questions) *
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
                  {Math.floor(analysis.time_analysis.total_time_seconds / 60)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Avg:{" "}
                {analysis.time_analysis.average_time_per_question.toFixed(0)}s
                per question
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rank
                </p>
                <p className="text-2xl font-bold">
                  #{analysis.comparison_with_others.rank}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {analysis.comparison_with_others.percentile.toFixed(0)}th
                percentile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {analysis.overall_performance.correct_answers}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (analysis.overall_performance.correct_answers /
                            analysis.overall_performance.total_questions) *
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
                        {analysis.overall_performance.wrong_answers}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (analysis.overall_performance.wrong_answers /
                            analysis.overall_performance.total_questions) *
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
                        {analysis.overall_performance.unanswered_questions}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {(
                          (analysis.overall_performance.unanswered_questions /
                            analysis.overall_performance.total_questions) *
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
                        {analysis.overall_performance.marks_obtained} marks
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">
                      {analysis.session_info.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>
                      {new Date(
                        analysis.session_info.started_at
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>
                      {new Date(
                        analysis.session_info.ended_at
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>
                      {analysis.session_info.duration_minutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab Switches:</span>
                    <span
                      className={
                        analysis.session_info.tab_switches > 5
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {analysis.session_info.tab_switches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IP Address:</span>
                    <span className="font-mono text-xs">
                      {analysis.session_info.ip_address}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
                <CardDescription>
                  Suggestions to help improve performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg ${
                        rec.priority === "high"
                          ? "border-red-200 bg-red-50"
                          : rec.priority === "medium"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "destructive"
                              : rec.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {rec.priority}
                        </Badge>
                        <div>
                          <p className="font-medium capitalize">
                            {rec.type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    </div>
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
            {analysis.question_by_question.map((question) => (
              <Card
                key={question.question_number}
                className={`${
                  question.is_correct
                    ? "border-green-200 bg-green-50/30"
                    : question.user_answer !== "Not answered"
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-200 bg-gray-50/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Q{question.question_number}
                      </Badge>
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
                        {question.marks} mark{question.marks !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {question.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : question.user_answer !== "Not answered" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-gray-600" />
                      )}
                      <span className="text-sm font-medium">
                        {question.marks_awarded > 0
                          ? `+${question.marks_awarded}`
                          : question.marks_awarded < 0
                          ? `${question.marks_awarded}`
                          : "0"}{" "}
                        marks
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
                            {question.correct_answer}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`font-medium ${
                              question.is_correct
                                ? "text-green-700"
                                : question.user_answer !== "Not answered"
                                ? "text-red-700"
                                : "text-gray-700"
                            }`}
                          >
                            Student's Answer:
                          </span>
                          <p
                            className={`mt-1 ${
                              question.is_correct
                                ? "text-green-600"
                                : question.user_answer !== "Not answered"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {question.user_answer}
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
                      {question.subject_name} • {question.chapter_name}
                    </span>
                    <span>
                      Time: {Math.floor(question.time_spent_seconds / 60)}m{" "}
                      {question.time_spent_seconds % 60}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Time Used:</span>
                    <span className="font-bold">
                      {Math.floor(
                        analysis.time_analysis.total_time_seconds / 60
                      )}
                      m {analysis.time_analysis.total_time_seconds % 60}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average per Question:</span>
                    <span className="font-bold">
                      {analysis.time_analysis.average_time_per_question.toFixed(
                        1
                      )}
                      s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fastest Question:</span>
                    <span className="font-bold text-green-600">
                      {analysis.time_analysis.fastest_question}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Slowest Question:</span>
                    <span className="font-bold text-red-600">
                      {analysis.time_analysis.slowest_question}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const timeRanges = [
                      {
                        label: "Quick (0-30s)",
                        count: 0,
                        color: "bg-green-500",
                      },
                      {
                        label: "Normal (30-60s)",
                        count: 0,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Slow (60-120s)",
                        count: 0,
                        color: "bg-yellow-500",
                      },
                      {
                        label: "Very Slow (120s+)",
                        count: 0,
                        color: "bg-red-500",
                      },
                    ];

                    analysis.question_by_question.forEach((q) => {
                      if (q.time_spent_seconds <= 30) timeRanges[0].count++;
                      else if (q.time_spent_seconds <= 60)
                        timeRanges[1].count++;
                      else if (q.time_spent_seconds <= 120)
                        timeRanges[2].count++;
                      else timeRanges[3].count++;
                    });

                    const total = analysis.question_by_question.length;

                    return timeRanges.map((range, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{range.label}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <Progress
                            value={(range.count / total) * 100}
                            className="flex-1 h-2"
                          />
                          <span className="text-sm font-medium w-8">
                            {range.count}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance vs Others</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      #{analysis.comparison_with_others.rank}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      out of{" "}
                      {analysis.comparison_with_others.total_participants}{" "}
                      participants
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Percentile Rank:</span>
                      <span className="font-bold">
                        {analysis.comparison_with_others.percentile.toFixed(0)}
                        th
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Class Average:</span>
                      <span className="font-bold">
                        {analysis.comparison_with_others.average_score.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Score:</span>
                      <span className="font-bold">
                        {analysis.overall_performance.score_percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difference:</span>
                      <span
                        className={`font-bold ${
                          analysis.comparison_with_others
                            .performance_vs_average >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {analysis.comparison_with_others
                          .performance_vs_average >= 0
                          ? "+"
                          : ""}
                        {analysis.comparison_with_others.performance_vs_average.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className={`p-3 rounded-lg ${
                      analysis.overall_performance.score_percentage >=
                      analysis.comparison_with_others.average_score
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p className="font-medium">
                      {analysis.overall_performance.score_percentage >=
                      analysis.comparison_with_others.average_score
                        ? "Above Average Performance"
                        : "Below Average Performance"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Scored{" "}
                      {Math.abs(
                        analysis.comparison_with_others.performance_vs_average
                      ).toFixed(1)}{" "}
                      points{" "}
                      {analysis.comparison_with_others.performance_vs_average >=
                      0
                        ? "above"
                        : "below"}{" "}
                      class average
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      analysis.comparison_with_others.rank <=
                      analysis.comparison_with_others.total_participants * 0.25
                        ? "bg-green-50 border border-green-200"
                        : analysis.comparison_with_others.rank <=
                          analysis.comparison_with_others.total_participants *
                            0.5
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p className="font-medium">
                      {analysis.comparison_with_others.rank <=
                      analysis.comparison_with_others.total_participants * 0.25
                        ? "Top Quartile"
                        : analysis.comparison_with_others.rank <=
                          analysis.comparison_with_others.total_participants *
                            0.5
                        ? "Second Quartile"
                        : analysis.comparison_with_others.rank <=
                          analysis.comparison_with_others.total_participants *
                            0.75
                        ? "Third Quartile"
                        : "Bottom Quartile"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Performance ranking within the class
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      analysis.overall_performance.is_passed
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p className="font-medium">
                      {analysis.overall_performance.is_passed
                        ? "Passed"
                        : "Failed"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Final result based on scoring criteria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
