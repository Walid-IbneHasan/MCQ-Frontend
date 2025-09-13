// app/exams/[id]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import {
  useGetExamQuery,
  useStartExamMutation,
} from "../../../lib/store/api/examsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Trophy,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../lib/utils/constants";

export default function ExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  const [customDuration, setCustomDuration] = React.useState<
    number | undefined
  >(undefined);
  const [showCustomDuration, setShowCustomDuration] = React.useState(false);

  if (!requireAuth()) {
    return null;
  }

  const {
    data: examResponse,
    isLoading,
    error,
  } = useGetExamQuery(id as string);

  const [startExam, { isLoading: isStarting }] = useStartExamMutation();

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  const handleStartExam = async () => {
    if (!examResponse?.exam) return;

    try {
      const result = await startExam({
        examId: examResponse.exam.id,
        customDuration,
      }).unwrap();

      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });

      // Navigate to exam session
      router.push(`/exams/session/${result.session.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to start exam",
        variant: "destructive",
      });
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "self_paced":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-green-100 text-green-800 border-green-200";
      case "practice":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "auto_submitted":
        return "bg-orange-100 text-orange-800";
      case "abandoned":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !examResponse) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load exam details.</p>
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

  const { exam, user_attempts, can_attempt } = examResponse;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/exams">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Link>
      </Button>

      {/* Exam Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${getExamTypeColor(exam.exam_type)}`}
                >
                  {exam.exam_type === "self_paced"
                    ? "Self Paced"
                    : exam.exam_type === "scheduled"
                    ? "Scheduled"
                    : "Practice"}
                </Badge>
                {exam.requires_subscription && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
                {!exam.can_start_now && (
                  <Badge variant="destructive" className="text-xs">
                    {exam.exam_type === "scheduled"
                      ? "Not Available"
                      : "Inactive"}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{exam.title}</CardTitle>
              <CardDescription className="text-base">
                {exam.description}
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/exams/${exam.id}/edit`}>Edit</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/exams/${exam.id}/analytics`}>Analytics</Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Information */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{exam.total_questions}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">
                    {formatDuration(exam.duration_minutes)}
                  </p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">
                    {exam.passing_percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">To Pass</p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{exam.total_attempts}</p>
                  <p className="text-sm text-muted-foreground">Attempts</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Marks per question:</span>
                  <span className="font-medium">{exam.marks_per_question}</span>
                </div>
                <div className="flex justify-between">
                  <span>Negative marking:</span>
                  <span className="font-medium">
                    {exam.negative_marking_enabled
                      ? `Yes (-${exam.negative_marks} marks)`
                      : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max attempts:</span>
                  <span className="font-medium">
                    {exam.max_attempts === 0 ? "Unlimited" : exam.max_attempts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Retakes allowed:</span>
                  <span className="font-medium">
                    {exam.allow_retakes ? "Yes" : "No"}
                  </span>
                </div>
                {exam.average_score > 0 && (
                  <div className="flex justify-between">
                    <span>Average score:</span>
                    <span className="font-medium">
                      {exam.average_score.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Exam Info */}
          {exam.exam_type === "scheduled" &&
            exam.scheduled_start &&
            exam.scheduled_end && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Start time:</span>
                      <span className="font-medium">
                        {new Date(exam.scheduled_start).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>End time:</span>
                      <span className="font-medium">
                        {new Date(exam.scheduled_end).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge
                        variant={
                          exam.is_scheduled_active ? "default" : "secondary"
                        }
                      >
                        {exam.is_scheduled_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Chapters Covered */}
          {exam.chapters && exam.chapters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chapters Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exam.chapters.map((chapter: any) => (
                    <div key={chapter.id} className="p-2 border rounded">
                      <p className="font-medium text-sm">{chapter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.subject_detail?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Attempts History */}
          {user_attempts && user_attempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Previous Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user_attempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            attempt.status === "completed"
                              ? "bg-green-100"
                              : attempt.status === "auto_submitted"
                              ? "bg-orange-100"
                              : attempt.status === "abandoned"
                              ? "bg-red-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {attempt.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : attempt.status === "abandoned" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {attempt.percentage_score > 0
                              ? `${attempt.percentage_score.toFixed(1)}%`
                              : "N/A"}
                            {attempt.is_passed && (
                              <Badge variant="default" className="ml-2 text-xs">
                                Passed
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(attempt.status)}`}
                      >
                        {attempt.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Start Exam Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Exam
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Availability Status */}
              {can_attempt.can_attempt ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">Ready to start</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      Cannot start
                    </p>
                    <p className="text-xs text-red-700">{can_attempt.reason}</p>
                  </div>
                </div>
              )}

              {/* Active Session Warning */}
              {can_attempt.active_session_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 mb-2">
                    You have an active session for this exam.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link
                      href={`/exams/session/${can_attempt.active_session_id}`}
                    >
                      Continue Session
                    </Link>
                  </Button>
                </div>
              )}

              {/* Custom Duration */}
              {exam.allow_custom_duration && can_attempt.can_attempt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Custom Duration
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomDuration(!showCustomDuration)}
                    >
                      {showCustomDuration ? "Use Default" : "Customize"}
                    </Button>
                  </div>

                  {showCustomDuration && (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder={`Default: ${exam.duration_minutes} minutes`}
                        value={customDuration || ""}
                        onChange={(e) =>
                          setCustomDuration(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        min="1"
                        max={exam.max_duration_minutes}
                      />
                      <p className="text-xs text-muted-foreground">
                        Max: {exam.max_duration_minutes} minutes
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Start Button */}
              <Button
                onClick={handleStartExam}
                disabled={
                  !can_attempt.can_attempt ||
                  isStarting ||
                  !!can_attempt.active_session_id
                }
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>

              {/* Exam Instructions */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>• Ensure stable internet connection</p>
                <p>• Do not refresh or close the browser</p>
                <p>• Exam will auto-submit when time expires</p>
                {exam.negative_marking_enabled && (
                  <p>• Wrong answers carry negative marks</p>
                )}
                <p>
                  • You can review and change answers before final submission
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
