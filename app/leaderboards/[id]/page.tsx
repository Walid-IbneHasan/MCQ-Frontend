// app/leaderboards/[id]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useGetLeaderboardDetailQuery } from "../../../lib/store/api/leaderboardsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarInitials,
} from "../../../components/ui/avatar";
import { Progress } from "../../../components/ui/progress";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Award,
  Calendar,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function LeaderboardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  if (!requireAuth()) {
    return null;
  }

  const {
    data: detailResponse,
    isLoading,
    error,
  } = useGetLeaderboardDetailQuery(id as string);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold">{rank}</span>
          </div>
        );
    }
  };

  const getRankChange = (rankChange: number) => {
    if (rankChange > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-sm">+{rankChange}</span>
        </div>
      );
    } else if (rankChange < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-sm">{rankChange}</span>
        </div>
      );
    }
    return (
      <div className="text-muted-foreground">
        <span className="text-sm">-</span>
      </div>
    );
  };

  const getPerformanceTrend = (trend: string) => {
    switch (trend) {
      case "improving":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Improving
          </Badge>
        );
      case "declining":
        return <Badge variant="destructive">Declining</Badge>;
      case "stable":
        return <Badge variant="secondary">Stable</Badge>;
      default:
        return <Badge variant="outline">New</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !detailResponse) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              Failed to load leaderboard details
            </p>
            <Button
              onClick={() => router.push("/leaderboards")}
              className="mt-4"
            >
              Back to Leaderboards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { leaderboard, entries, user_entry, statistics } = detailResponse;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/leaderboards">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leaderboards
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {leaderboard.name}
          </h1>
          <p className="text-muted-foreground">
            {leaderboard.exam_title || "Global Rankings"} • {leaderboard.period}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {leaderboard.total_participants}
          </div>
          <div className="text-sm text-muted-foreground">Participants</div>
        </div>
      </div>

      {/* Leaderboard Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Period</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(leaderboard.period_start).toLocaleDateString()} -{" "}
                  {new Date(leaderboard.period_end).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Scoring</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {leaderboard.score_method.replace("_", " ")} score
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Average Score</div>
                <div className="text-sm text-muted-foreground">
                  {statistics.avg_score.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Total Exams</div>
                <div className="text-sm text-muted-foreground">
                  {statistics.total_exams_played}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Position (if in leaderboard) */}
      {user_entry && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Your Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(user_entry.rank)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    <AvatarInitials
                      name={user?.first_name || user?.phone_number || ""}
                    />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold">You</div>
                  <div className="text-sm text-muted-foreground">
                    {user_entry.total_exams} exams completed
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-2xl font-bold">
                  {user_entry.score.toFixed(1)}%
                </div>
                <div className="flex items-center space-x-4">
                  {getRankChange(user_entry.rank_change)}
                  {getPerformanceTrend(user_entry.performance_trend)}
                </div>
              </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="font-bold">
                  {user_entry.accuracy_rate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Best Score</div>
                <div className="font-bold">
                  {user_entry.best_score.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Consistency</div>
                <div className="font-bold">
                  {user_entry.consistency_score.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="font-bold">
                  {Math.round(
                    user_entry.total_time_minutes / user_entry.total_exams
                  )}
                  m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
          <CardDescription>
            Complete leaderboard for {leaderboard.period} period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.user_name}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  entry.user_name === user?.get_full_name?.() ||
                  entry.user_name.includes(user?.first_name || "")
                    ? "bg-primary/10 border-primary/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <AvatarInitials name={entry.user_name} />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{entry.user_name}</div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{entry.total_exams} exams</span>
                      <span>{entry.accuracy_rate.toFixed(1)}% accuracy</span>
                      {entry.total_time_minutes > 0 && (
                        <span>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {Math.round(
                            entry.total_time_minutes / entry.total_exams
                          )}
                          m avg
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    {entry.badges && entry.badges.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        {entry.badges.slice(0, 3).map((badge, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs px-2 py-0"
                            style={{ backgroundColor: badge.color + "20" }}
                          >
                            {badge.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="text-xl font-bold">
                    {entry.score.toFixed(1)}%
                  </div>
                  <div className="flex items-center space-x-3">
                    {getRankChange(entry.rank_change)}
                    {getPerformanceTrend(entry.performance_trend)}
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Best: {entry.best_score.toFixed(1)}%</span>
                    <span>Avg: {entry.average_score.toFixed(1)}%</span>
                  </div>

                  {/* Consistency Bar */}
                  <div className="w-20">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Consistency</span>
                      <span>{entry.consistency_score.toFixed(0)}%</span>
                    </div>
                    <Progress value={entry.consistency_score} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {entries.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Participants Yet
              </h3>
              <p className="text-muted-foreground">
                Be the first to participate in this leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {statistics.top_score.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Highest Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {statistics.avg_score.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {statistics.total_exams_played}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Exams Taken
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Information */}
      <Card>
        <CardHeader>
          <CardTitle>Period Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Period:</span>
              <Badge variant={leaderboard.is_current ? "default" : "secondary"}>
                {leaderboard.is_current ? "Active" : "Completed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span>
                {new Date(leaderboard.period_start).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span>
                {new Date(leaderboard.period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(leaderboard.last_updated).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
