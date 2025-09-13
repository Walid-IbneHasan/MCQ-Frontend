// app/exams/page.tsx
"use client";

import React from "react";
import { useAuth } from "../../hooks/use-auth";
import { useGetExamsQuery } from "../../lib/store/api/examsApi";
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
} from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../lib/utils/constants";
import type { Exam } from "../../lib/store/api/examsApi";

export default function ExamsPage() {
  const { user, requireAuth } = useAuth();
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

  // DEBUG: Log the response to see its structure
  React.useEffect(() => {
    console.log("=== EXAMS DEBUG ===");
    console.log("Full response:", examsResponse);
    console.log("Is loading:", isLoadingExams);
    console.log("Error:", examsError);

    if (examsResponse) {
      console.log("Response keys:", Object.keys(examsResponse));
      console.log("Has results?", "results" in examsResponse);
      console.log("Has exams directly?", "exams" in examsResponse);

      if ("results" in examsResponse) {
        console.log("Results:", examsResponse.results);
        console.log("Results keys:", Object.keys(examsResponse.results));
      }
    }
    console.log("==================");
  }, [examsResponse, isLoadingExams, examsError]);

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
        {/* Exam Stats */}
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

        {/* Scheduled Time */}
        {exam.exam_type === "scheduled" && exam.scheduled_start && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(exam.scheduled_start).toLocaleDateString()} at{" "}
              {new Date(exam.scheduled_start).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Average Score */}
        {exam.average_score > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Average: {exam.average_score.toFixed(1)}%</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button asChild className="w-full" disabled={!exam.can_start_now}>
            <Link href={`/exams/${exam.id}`}>
              {exam.can_start_now ? "Start Exam" : "View Details"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Extract exams based on the actual response structure
  const exams = React.useMemo(() => {
    if (!examsResponse) return [];

    // Try different possible structures
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

  // Get pagination info
  const hasNextPage = React.useMemo(() => {
    if (!examsResponse) return false;

    if (examsResponse.next) return !!examsResponse.next;
    if (examsResponse.results && examsResponse.results.next) {
      return !!examsResponse.results.next;
    }

    return false;
  }, [examsResponse]);

  console.log("Extracted exams:", exams);
  console.log("Has next page:", hasNextPage);

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
          <Button asChild>
            <Link href="/exams/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Link>
          </Button>
        )}
      </div>

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
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="self_paced">Self Paced</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
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
            <p className="text-sm text-muted-foreground mt-2">
              Error: {JSON.stringify(examsError)}
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

          {/* Pagination */}
          {hasNextPage && (
            <div className="flex justify-center">
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
  );
}
