// app/exams/[id]/analytics/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import {
  useGetExamAnalyticsQuery,
  useRefreshExamAnalyticsMutation,
  useExportExamAnalyticsMutation,
} from "../../../../lib/store/api/examAnalyticsApi";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Input } from "../../../../components/ui/input";
import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  BarChart3,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../../lib/utils/constants";

export default function ExamAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  const [participantSearch, setParticipantSearch] = useState("");
  const [participantFilter, setParticipantFilter] = useState("all");

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
              You don't have permission to view exam analytics.
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
    data: analyticsResponse,
    isLoading,
    error,
    refetch,
  } = useGetExamAnalyticsQuery(id as string);

  const [refreshAnalytics, { isLoading: isRefreshing }] =
    useRefreshExamAnalyticsMutation();

  const [exportAnalytics, { isLoading: isExporting }] =
    useExportExamAnalyticsMutation();

  const handleRefresh = async () => {
    try {
      await refreshAnalytics(id as string).unwrap();
      await refetch();
      toast({
        title: "Success",
        description: "Analytics refreshed successfully",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh analytics",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      const result = await exportAnalytics({
        examId: id as string,
        format,
        include_participants: true,
        include_questions: true,
      }).unwrap();

      // Create download link
      const url = window.URL.createObjectURL(result);
      const link = document.createElement("a");
      link.href = url;
      link.download = `exam-analytics-${id}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Analytics exported as ${format.toUpperCase()}`,
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  const filteredParticipants = React.useMemo(() => {
    if (!analyticsResponse?.analytics?.participants) return [];

    let filtered = analyticsResponse.analytics.participants;

    // Search filter
    if (participantSearch) {
      filtered = filtered.filter(
        (p) =>
          p.user_name.toLowerCase().includes(participantSearch.toLowerCase()) ||
          p.user_phone.includes(participantSearch)
      );
    }

    // Status filter
    if (participantFilter !== "all") {
      filtered = filtered.filter((p) => {
        switch (participantFilter) {
          case "passed":
            return p.is_passed;
          case "failed":
            return !p.is_passed;
          case "high_performers":
            return p.score_percentage >= 80;
          case "struggling":
            return p.score_percentage < 50;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [
    analyticsResponse?.analytics?.participants,
    participantSearch,
    participantFilter,
  ]);

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

  if (error || !analyticsResponse?.analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">
              Analytics Not Available
            </h3>
            <p className="text-muted-foreground mb-4">
              {analyticsResponse?.message ||
                "Unable to load exam analytics. This exam may not have any attempts yet."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/exams/${id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Exam
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = analyticsResponse.analytics;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/exams/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exam
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Exam Analytics
          </h1>
          <p className="text-muted-foreground">
            {analytics.summary.exam_title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          <Select onValueChange={(value) => handleExport(value as any)}>
            <SelectTrigger className="w-40">
              <Download className="h-4 w-4 mr-2" />
              Export
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="excel">Excel File</SelectItem>
              <SelectItem value="csv">CSV Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Participants
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.unique_students}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {analytics.summary.total_attempts} total attempts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Score
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.average_score.toFixed(1)}%
                </p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {analytics.summary.average_score >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">
                Pass rate: {analytics.summary.pass_rate.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Time Taken
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.average_time.toFixed(0)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Duration: {analytics.summary.exam_duration}m
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Score Range
                </p>
                <p className="text-2xl font-bold">
                  {analytics.summary.lowest_score.toFixed(0)}-
                  {analytics.summary.highest_score.toFixed(0)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Best: {analytics.summary.highest_score.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>
                  Score distribution across all participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const ranges = [
                      { label: "90-100%", count: 0, color: "bg-green-500" },
                      { label: "80-89%", count: 0, color: "bg-blue-500" },
                      { label: "70-79%", count: 0, color: "bg-yellow-500" },
                      { label: "60-69%", count: 0, color: "bg-orange-500" },
                      { label: "Below 60%", count: 0, color: "bg-red-500" },
                    ];

                    analytics.participants.forEach((p) => {
                      if (p.score_percentage >= 90) ranges[0].count++;
                      else if (p.score_percentage >= 80) ranges[1].count++;
                      else if (p.score_percentage >= 70) ranges[2].count++;
                      else if (p.score_percentage >= 60) ranges[3].count++;
                      else ranges[4].count++;
                    });

                    return ranges.map((range, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{range.label}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <Progress
                            value={
                              (range.count / analytics.participants.length) *
                              100
                            }
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

            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.subject_performance).map(
                    ([subject, perf]) => (
                      <div key={subject}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{subject}</span>
                          <span className="text-sm font-bold">
                            {perf.average_score.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={perf.average_score} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{perf.total_students} students</span>
                          <span>
                            {perf.min_score.toFixed(0)}-
                            {perf.max_score.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggestions for improving exam effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recommendations.map((rec, index) => (
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
                          {rec.suggestion && (
                            <p className="text-sm text-blue-600 mt-1">
                              {rec.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          {/* Participant Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={participantFilter}
                  onValueChange={setParticipantFilter}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter participants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Participants</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="high_performers">
                      High Performers (80%+)
                    </SelectItem>
                    <SelectItem value="struggling">
                      Struggling (&lt;50%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <CardTitle>Participant Details</CardTitle>
              <CardDescription>
                {filteredParticipants.length} participants found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredParticipants.map((participant) => (
                  <div
                    key={`${participant.user_id}-${participant.attempt_date}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">
                            {participant.user_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {participant.user_phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              participant.is_passed
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {participant.score_percentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Grade {participant.grade}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/exams/${id}/analytics/participants/${participant.user_id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Correct</p>
                        <p className="font-medium text-green-600">
                          {participant.correct_answers}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wrong</p>
                        <p className="font-medium text-red-600">
                          {participant.wrong_answers_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unanswered</p>
                        <p className="font-medium text-gray-600">
                          {participant.unanswered_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {participant.time_taken_minutes}m
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tab Switches</p>
                        <p className="font-medium">
                          {participant.session_details.tab_switches}
                        </p>
                      </div>
                    </div>

                    {/* Subject Performance */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">
                        Subject Performance:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {Object.entries(participant.subject_wise_scores).map(
                          ([subject, stats]) => (
                            <div key={subject} className="text-xs">
                              <span className="font-medium">{subject}:</span>
                              <span className="ml-1">
                                {stats.correct}/{stats.questions} (
                                {stats.percentage?.toFixed(0) || 0}%)
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Wrong Answers Summary */}
                    {participant.wrong_answers_detail.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2 text-red-600">
                          Common Mistakes:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {participant.wrong_answers_detail
                            .slice(0, 3)
                            .map((wrong, index) => (
                              <Badge
                                key={index}
                                variant="destructive"
                                className="text-xs"
                              >
                                {wrong.subject} - {wrong.difficulty}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Performance Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of how each question performed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics.question_analytics.map((question) => (
                  <div
                    key={question.question_id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                            {question.chapter} • {question.subject}
                          </span>
                          {question.needs_review && (
                            <Badge variant="destructive" className="text-xs">
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {question.question_text}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`text-lg font-bold ${
                            question.success_rate >= 70
                              ? "text-green-600"
                              : question.success_rate >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {question.success_rate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Success Rate
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Attempts</p>
                        <p className="font-medium">{question.total_attempts}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Correct</p>
                        <p className="font-medium text-green-600">
                          {question.correct}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wrong</p>
                        <p className="font-medium text-red-600">
                          {question.wrong}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unanswered</p>
                        <p className="font-medium text-gray-600">
                          {question.unanswered}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Time</p>
                        <p className="font-medium">
                          {question.average_time_spent.toFixed(0)}s
                        </p>
                      </div>
                    </div>

                    {/* Option Statistics */}
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">
                        Option Selection:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(question.option_breakdown).map(
                          ([optionId, stats]) => (
                            <div
                              key={optionId}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    stats.is_correct
                                      ? "bg-green-500"
                                      : "bg-gray-300"
                                  }`}
                                />
                                <span className="text-sm">
                                  {stats.option_text}
                                </span>
                                {stats.is_correct && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={stats.percentage}
                                  className="w-20 h-2"
                                />
                                <span className="text-sm w-16 text-right">
                                  {stats.selections} (
                                  {stats.percentage.toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`p-3 rounded-lg ${
                    analytics.summary.pass_rate >= 70
                      ? "bg-green-50 border border-green-200"
                      : analytics.summary.pass_rate >= 50
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p className="font-medium">Overall Pass Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.summary.pass_rate >= 70
                      ? "Excellent"
                      : analytics.summary.pass_rate >= 50
                      ? "Good"
                      : "Needs Improvement"}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {analytics.summary.pass_rate.toFixed(1)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="font-medium">Score Distribution</p>
                  <p className="text-sm text-muted-foreground">
                    Average score: {analytics.summary.average_score.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Range: {analytics.summary.lowest_score.toFixed(1)}% -{" "}
                    {analytics.summary.highest_score.toFixed(1)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="font-medium">Time Management</p>
                  <p className="text-sm text-muted-foreground">
                    Average completion time:{" "}
                    {analytics.summary.average_time.toFixed(0)} minutes out of{" "}
                    {analytics.summary.exam_duration} minutes allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Question Quality Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Question Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const veryEasy = analytics.question_analytics.filter(
                    (q) => q.success_rate >= 90
                  ).length;
                  const veryHard = analytics.question_analytics.filter(
                    (q) => q.success_rate <= 30
                  ).length;
                  const balanced = analytics.question_analytics.filter(
                    (q) => q.success_rate > 30 && q.success_rate < 90
                  ).length;

                  return (
                    <>
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="font-medium">Well-Balanced Questions</p>
                        <p className="text-sm text-muted-foreground">
                          Success rate between 30-90%
                        </p>
                        <p className="text-lg font-bold">{balanced}</p>
                      </div>

                      {veryEasy > 0 && (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="font-medium">Very Easy Questions</p>
                          <p className="text-sm text-muted-foreground">
                            Success rate above 90% - consider increasing
                            difficulty
                          </p>
                          <p className="text-lg font-bold">{veryEasy}</p>
                        </div>
                      )}

                      {veryHard > 0 && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="font-medium">Very Hard Questions</p>
                          <p className="text-sm text-muted-foreground">
                            Success rate below 30% - may need review
                          </p>
                          <p className="text-lg font-bold">{veryHard}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Exam Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Participation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Attempts:</span>
                      <span>{analytics.summary.total_attempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Students:</span>
                      <span>{analytics.summary.unique_students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pass Rate:</span>
                      <span>{analytics.summary.pass_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <span>{analytics.summary.average_score.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Highest Score:</span>
                      <span>{analytics.summary.highest_score.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lowest Score:</span>
                      <span>{analytics.summary.lowest_score.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Timing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Avg Time Taken:</span>
                      <span>{analytics.summary.average_time.toFixed(0)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Limit:</span>
                      <span>{analytics.summary.exam_duration}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <span>{analytics.summary.total_questions}</span>
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
