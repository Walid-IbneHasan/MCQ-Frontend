"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import {
  BookOpen,
  Trophy,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Users,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  Star,
  Activity,
  Brain,
  Zap,
  Timer,
  Medal,
  BookmarkCheck,
  GraduationCap,
  UserCheck,
  TrendingDown,
  ArrowRight,
  Plus,
  Eye,
  Search,
  HelpCircle,
  PieChart,
  BarChart2,
} from "lucide-react";

// Import API hooks with correct names
import { useGetMyExamsQuery } from "../../lib/store/api/examsApi";
import { useGetMySessionsQuery } from "../../lib/store/api/examsApi";
import { useGetUserLeaderboardSummaryQuery } from "../../lib/store/api/leaderboardsApi";
import { useGetSubjectsQuery } from "../../lib/store/api/subjectsApi";
import { useGetExamsQuery } from "../../lib/store/api/examsApi";
import { useGetUpcomingExamsQuery } from "../../lib/store/api/examsApi";

// Results API - using correct hook names
import {
  useGetUserDashboardQuery,
  useGetMyAnalyticsQuery,
  useGetMyResultsQuery,
  useGetMySubjectsQuery,
} from "../../lib/store/api/resultsApi";

// Student Dashboard Component
function StudentDashboard({ user }: { user: any }) {
  const router = useRouter();

  // Fetch student-specific data using real APIs
  const { data: myExams, isLoading: examsLoading } = useGetMyExamsQuery();
  const { data: mySessions, isLoading: sessionsLoading } =
    useGetMySessionsQuery({});
  const { data: leaderboardSummary, isLoading: leaderboardLoading } =
    useGetUserLeaderboardSummaryQuery();
  const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsQuery(
    {}
  );
  const { data: upcomingExams, isLoading: upcomingLoading } =
    useGetUpcomingExamsQuery();

  // Results API calls with correct hook names
  const { data: userDashboard, isLoading: dashboardLoading } =
    useGetUserDashboardQuery();
  const { data: myAnalytics, isLoading: analyticsLoading } =
    useGetMyAnalyticsQuery();
  const { data: myResults, isLoading: resultsLoading } = useGetMyResultsQuery(
    {}
  );
  const { data: mySubjects, isLoading: subjectsPerformanceLoading } =
    useGetMySubjectsQuery();

  // Process real data
  const recentSessions = mySessions?.sessions?.slice(0, 5) || [];
  const completedExams =
    mySessions?.sessions?.filter((s) =>
      ["completed", "auto_submitted"].includes(s.status)
    ) || [];

  // Use real performance data from user dashboard
  const performanceSummary = userDashboard?.dashboard?.performance_summary;
  const recentResults =
    userDashboard?.dashboard?.recent_results || myResults?.results || [];
  const progressChart = userDashboard?.dashboard?.progress_chart || [];

  // Calculate stats from real data
  const thisWeekExams = completedExams.filter((session) => {
    const sessionDate = new Date(session.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length;

  const averageScore =
    performanceSummary?.average_score ||
    myAnalytics?.analytics?.average_score ||
    0;
  const totalExamsTaken =
    performanceSummary?.total_exams_taken ||
    myAnalytics?.analytics?.total_exams_taken ||
    completedExams.length;
  const bestScore =
    performanceSummary?.best_score || myAnalytics?.analytics?.best_score || 0;

  // Get current rank from leaderboard
  const currentRank = leaderboardSummary?.dashboard?.global_rank?.rank || null;
  const totalParticipants =
    leaderboardSummary?.dashboard?.global_rank?.total_participants || null;

  const studentStats = [
    {
      title: "Exams This Week",
      value: thisWeekExams.toString(),
      description: "Completed exams",
      icon: Trophy,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Average Score",
      value: `${Math.round(averageScore)}%`,
      description:
        totalExamsTaken > 0
          ? `From ${totalExamsTaken} attempts`
          : "No attempts yet",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Best Score",
      value: `${Math.round(bestScore)}%`,
      description: "Personal best",
      icon: BookmarkCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Current Rank",
      value: currentRank ? `#${currentRank}` : "N/A",
      description: totalParticipants
        ? `of ${totalParticipants} students`
        : "Global leaderboard",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.first_name || "Student"}!
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your learning journey?
          </p>
          {user?.is_verified && (
            <div className="mt-2">
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/subjects")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Subjects
          </Button>
          <Button onClick={() => router.push("/exams?type=practice")}>
            <Trophy className="h-4 w-4 mr-2" />
            Start Practice Test
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {studentStats.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest exam attempts</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/results")}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.slice(0, 5).map((result, index) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          result.is_passed
                            ? "bg-green-100 dark:bg-green-900/20"
                            : result.percentage_score > 50
                            ? "bg-yellow-100 dark:bg-yellow-900/20"
                            : "bg-red-100 dark:bg-red-900/20"
                        }`}
                      >
                        {result.is_passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : result.percentage_score > 50 ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {result.exam_detail?.title || "Exam"}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>
                            {new Date(result.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {result.exam_detail?.exam_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {Math.round(result.percentage_score)}%
                      </div>
                      <Badge
                        variant={result.is_passed ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No recent activity. Start your first exam!
                </p>
                <Button onClick={() => router.push("/exams")}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Browse Exams
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Leaderboard Position */}
          {!leaderboardLoading &&
            leaderboardSummary?.dashboard?.global_rank && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Position</CardTitle>
                  <CardDescription>Global leaderboard ranking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      #{leaderboardSummary.dashboard.global_rank.rank}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      out of{" "}
                      {
                        leaderboardSummary.dashboard.global_rank
                          .total_participants
                      }{" "}
                      students
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <Medal className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        Score:{" "}
                        {Math.round(
                          leaderboardSummary.dashboard.global_rank.score
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        leaderboardSummary.dashboard.global_rank.percentile || 0
                      }
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Subject Performance */}
          {!subjectsPerformanceLoading &&
            mySubjects?.subjects &&
            mySubjects.subjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Your progress by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mySubjects.subjects.slice(0, 3).map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {subject.subject_detail?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {subject.exams_taken} exams •{" "}
                            {Math.round(subject.average_score)}% avg
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              subject.pass_rate >= 70 ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {Math.round(subject.pass_rate)}%
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {subject.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Upcoming Exams */}
          {!upcomingLoading && upcomingExams?.upcoming_exams?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Exams</CardTitle>
                <CardDescription>Scheduled exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingExams.upcoming_exams.slice(0, 3).map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium text-sm">{exam.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {exam.scheduled_start
                            ? new Date(
                                exam.scheduled_start
                              ).toLocaleDateString()
                            : "TBA"}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {exam.total_questions}Q
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/subjects")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Subjects
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/exams?type=practice")}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Take Practice Test
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/results")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => router.push("/leaderboards")}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Leaderboards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Staff Dashboard Component (Admin/Teacher/Moderator)
function StaffDashboard({ user }: { user: any }) {
  const router = useRouter();

  // Fetch staff-specific data using real APIs
  const { data: allExams, isLoading: examsLoading } = useGetExamsQuery({});
  const { data: subjects, isLoading: subjectsLoading } = useGetSubjectsQuery(
    {}
  );

  // Calculate staff stats from real data
  const examsData = allExams?.results?.exams || allExams?.exams || [];
  const totalExams = allExams?.count || examsData.length;
  const activeExams = examsData.filter?.((exam) => exam.is_active)?.length || 0;
  const scheduledExams =
    examsData.filter?.(
      (exam) => exam.exam_type === "scheduled" && exam.is_active
    )?.length || 0;
  const practiceExams =
    examsData.filter?.(
      (exam) => exam.exam_type === "practice" && exam.is_active
    )?.length || 0;

  const subjectsData = subjects?.results || subjects?.subjects || [];
  const totalSubjects = subjects?.count || subjectsData.length;

  const staffStats = [
    {
      title: "Total Exams",
      value: totalExams.toString(),
      description: `${activeExams} active`,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Subjects",
      value: totalSubjects.toString(),
      description: "Available subjects",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Scheduled Exams",
      value: scheduledExams.toString(),
      description: "Active scheduled",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Practice Exams",
      value: practiceExams.toString(),
      description: "Available practice",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  // Get recent exams from real data
  const recentExams = examsData.slice(0, 5);

  const quickActions = [
    {
      title: "Create New Exam",
      icon: Plus,
      description: "Design a new exam",
      route: "/exams/create",
    },
    {
      title: "Manage Questions",
      icon: Brain,
      description: "Add or edit questions",
      route: "/questions",
    },
    {
      title: "View Analytics",
      icon: BarChart3,
      description: "Exam performance data",
      route: "/analytics",
    },
    {
      title: "Manage Subjects",
      icon: BookOpen,
      description: "Subject and chapters",
      route: "/subjects",
    },
    {
      title: "Leaderboards",
      icon: Trophy,
      description: "View rankings",
      route: "/leaderboards",
    },
    {
      title: "Results Analysis",
      icon: PieChart,
      description: "Student performance",
      route: "/results",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {user?.first_name || "Admin"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your educational platform efficiently
          </p>
          <div className="mt-2">
            <Badge variant="outline">
              {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1) ||
                "Staff"}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
          <Button onClick={() => router.push("/exams/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staffStats.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exams */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Exams</CardTitle>
                <CardDescription>Latest created exams</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/exams")}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          exam.exam_type === "scheduled"
                            ? "bg-blue-100 dark:bg-blue-900/20"
                            : exam.exam_type === "practice"
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-orange-100 dark:bg-orange-900/20"
                        }`}
                      >
                        {exam.exam_type === "scheduled" ? (
                          <Calendar className="h-4 w-4 text-blue-600" />
                        ) : exam.exam_type === "practice" ? (
                          <Target className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {exam.exam_type}
                          </Badge>
                          <span>{exam.total_questions} questions</span>
                          <span>{exam.duration_minutes}min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {exam.total_attempts || 0} attempts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {Math.round(exam.average_score || 0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No exams created yet. Create your first exam!
                </p>
                <Button onClick={() => router.push("/exams/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Platform overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Exams</span>
                  <span className="text-sm font-medium">{totalExams}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Exams</span>
                  <span className="text-sm font-medium text-green-600">
                    {activeExams}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Subjects</span>
                  <span className="text-sm font-medium">{totalSubjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 flex-col"
                    onClick={() => router.push(action.route)}
                  >
                    <action.icon className="h-4 w-4 mb-1" />
                    <span className="text-xs text-center">{action.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function DashboardPage() {
  const { user, requireAuth } = useAuth();

  // Handle auth check without causing router setState during render
  React.useEffect(() => {
    if (!requireAuth()) {
      return;
    }
  }, []);

  if (!user) {
    return null; // or loading spinner
  }

  // Determine if user is staff (admin, teacher, moderator)
  const isStaff =
    user?.is_teacher_or_above ||
    ["admin", "teacher", "moderator"].includes(user?.role?.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      {isStaff ? (
        <StaffDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
    </div>
  );
}
