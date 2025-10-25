// app/exams/page.tsx - Complete code using existing endpoint
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetExamsQuery,
  useGetMyExamsQuery,
  useGetMySessionsQuery,
} from "../../lib/store/api/examsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Users,
  Trophy,
  Calendar,
  Filter,
  TrendingUp,
  History,
  Award,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../lib/utils/constants";
import type { Exam } from "../../lib/store/api/examsApi";
import { useToast } from "../../components/ui/use-toast";

export default function ExamsPage() {
  const { user, requireAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [examType, setExamType] = React.useState("all");
  const [page, setPage] = React.useState(1);

  if (!requireAuth()) {
    return null;
  }

  const {
    data: examsResponse,
    isLoading: isLoadingExams,
    error: examsError,
  } = useGetExamsQuery({
    search,
    type: examType === "all" ? undefined : examType,
    page,
  });

  const { data: myExamsData, isLoading: isLoadingHistory } =
    useGetMyExamsQuery();

  // Use existing endpoint with empty params to get all sessions
  const { data: mySessionsData } = useGetMySessionsQuery({});

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMostRecentSessionId = (examId: string) => {
    if (!mySessionsData) return null;

    const sessions =
      mySessionsData?.results?.sessions || mySessionsData?.sessions || [];

    console.log("All sessions:", sessions);
    console.log("Looking for exam:", examId);

    const examSessions = sessions.filter(
      (s: any) =>
        s.exam === examId &&
        (s.status === "completed" || s.status === "auto_submitted")
    );

    console.log("Filtered exam sessions:", examSessions);

    if (examSessions.length > 0) {
      examSessions.sort((a: any, b: any) => {
        const dateA = new Date(a.submitted_at || a.ended_at || a.created_at);
        const dateB = new Date(b.submitted_at || b.ended_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Found session:", examSessions[0].id, "for exam:", examId);
      return examSessions[0].id;
    } else {
      console.log("No completed sessions found for exam:", examId);
    }

    return null;
  };

  const handleViewResults = (examId: string) => {
    const sessionId = getMostRecentSessionId(examId);
    if (sessionId) {
      router.push(`/exams/session/${sessionId}/results`);
    } else {
      toast({
        title: "No Results Found",
        description:
          "No completed session found for this exam. The exam might still be in progress.",
        variant: "destructive",
      });
    }
  };

  const ExamCard: React.FC<{ exam: Exam }> = ({ exam }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
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
                  Unavailable
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate">{exam.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {exam.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{exam.total_questions} questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(exam.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span>{exam.passing_percentage}% to pass</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{exam.total_attempts} attempts</span>
          </div>
        </div>

        {exam.exam_type === "scheduled" && exam.scheduled_start && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(exam.scheduled_start).toLocaleDateString()} at{" "}
              {new Date(exam.scheduled_start).toLocaleTimeString()}
            </span>
          </div>
        )}

        {exam.average_score > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Average: {exam.average_score.toFixed(1)}%</span>
          </div>
        )}

        <div className="pt-2">
          <Link href={`/exams/${exam.id}`}>
            <Button
              asChild
              className="w-full hover:cursor-pointer"
              disabled={!exam.can_start_now}
            >
              {exam.can_start_now ? "View Details" : "View Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const exams = React.useMemo(() => {
    if (!examsResponse) return [];
    if (examsResponse.results && examsResponse.results.exams) {
      return examsResponse.results.exams;
    }
    if (examsResponse.exams) {
      return examsResponse.exams;
    }
    if (Array.isArray(examsResponse)) {
      return examsResponse;
    }
    return [];
  }, [examsResponse]);

  const hasNextPage = React.useMemo(() => {
    if (!examsResponse) return false;
    if (examsResponse.next) return !!examsResponse.next;
    if (examsResponse.results && examsResponse.results.next) {
      return !!examsResponse.results.next;
    }
    return false;
  }, [examsResponse]);

  const examHistory = myExamsData?.exam_history || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Exams
          </h1>
          <p className="text-muted-foreground">
            Test your knowledge and track your progress
          </p>
        </div>
        {canManage && (
          <Link href="/exams/create">
            <Button asChild className="flex items-center hover:cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </Link>
        )}
      </div>

      {/* My Exam History Section - Only for students */}
      {!canManage && examHistory.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>My Exam History</CardTitle>
            </div>
            <CardDescription>
              Your previous exam attempts and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {examHistory.map((item: any) => (
                  <Card
                    key={item.exam.id}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold truncate">
                              {item.exam.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getExamTypeColor(
                                item.exam.exam_type
                              )}`}
                            >
                              {item.exam.exam_type}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">
                                Best: {item.best_score}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span>
                                {item.attempts}{" "}
                                {item.attempts === 1 ? "attempt" : "attempts"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                Last:{" "}
                                {new Date(
                                  item.last_attempt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <BookOpen className="h-4 w-4" />
                              <span>{item.exam.total_questions} questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Badge
                            className={
                              item.best_score >= item.exam.passing_percentage
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {item.best_score >= item.exam.passing_percentage
                              ? "Passed"
                              : "Failed"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleViewResults(item.exam.id)}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger className="w-full sm:w-48 hover:cursor-pointer">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:cursor-pointer">
                  All Types
                </SelectItem>
                <SelectItem value="self_paced" className="hover:cursor-pointer">
                  Self Paced
                </SelectItem>
                <SelectItem value="scheduled" className="hover:cursor-pointer">
                  Scheduled
                </SelectItem>
                <SelectItem value="practice" className="hover:cursor-pointer">
                  Practice
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Available Exams Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Exams</h2>
        {isLoadingExams ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : examsError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                Failed to load exams. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : exams && exams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam: Exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isLoadingExams}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No exams found</h3>
              <p className="text-muted-foreground mb-4">
                {search || examType !== "all"
                  ? "No exams match your search criteria."
                  : "No exams are available at the moment."}
              </p>
              {canManage && !search && examType === "all" && (
                <Button asChild>
                  <Link href="/exams/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Exam
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
