// app/leaderboards/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetExamLeaderboardsQuery,
  useGetUserLeaderboardSummaryQuery,
  useGetAvailablePeriodsQuery,
} from "../../lib/store/api/leaderboardsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarInitials,
} from "../../components/ui/avatar";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { LeaderboardEntry } from "../../lib/store/api/leaderboardsApi";

export default function LeaderboardsPage() {
  const { user, requireAuth } = useAuth();
  const [examType, setExamType] = useState<string>("scheduled");
  const [period, setPeriod] = useState<string>("weekly");

  if (!requireAuth()) {
    return null;
  }

  const {
    data: leaderboardsResponse,
    isLoading: isLoadingLeaderboards,
    error: leaderboardsError,
  } = useGetExamLeaderboardsQuery({ exam_type: examType, period });

  const { data: summaryResponse, isLoading: isLoadingSummary } =
    useGetUserLeaderboardSummaryQuery();

  const { data: periodsResponse } = useGetAvailablePeriodsQuery();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankChange = (rankChange: number) => {
    if (rankChange > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="text-xs">+{rankChange}</span>
        </div>
      );
    } else if (rankChange < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="text-xs">{rankChange}</span>
        </div>
      );
    }
    return null;
  };

  const LeaderboardCard: React.FC<{
    title: string;
    entries: LeaderboardEntry[];
    userEntry?: any;
    totalParticipants?: number;
    period: string;
    leaderboardId?: string;
  }> = ({
    title,
    entries,
    userEntry,
    totalParticipants,
    period,
    leaderboardId,
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {period.charAt(0).toUpperCase() + period.slice(1)} rankings
            </CardDescription>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm">
              {totalParticipants || entries.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.slice(0, 10).map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.user_id === user?.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <AvatarInitials name={entry.user_name} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{entry.user_name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {entry.total_exams} exams
                    </span>
                    {entry.badges?.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        <Award className="h-3 w-3 mr-1" />
                        {entry.badges[0].name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {entry.score.toFixed(1)}%
                </div>
                {getRankChange(entry.rank_change)}
              </div>
            </div>
          ))}

          {/* User's position if not in top 10 */}
          {userEntry && userEntry.rank > 10 && (
            <>
              <div className="border-t pt-3 mt-3">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  Your position
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      <span className="text-sm font-bold">
                        #{userEntry.rank}
                      </span>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <AvatarInitials
                          name={user?.first_name || user?.phone_number || ""}
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">You</p>
                      <span className="text-xs text-muted-foreground">
                        {userEntry.total_exams} exams
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {userEntry.score.toFixed(1)}%
                    </div>
                    {getRankChange(userEntry.rank_change)}
                  </div>
                </div>
              </div>
            </>
          )}

          {leaderboardId && (
            <div className="pt-3 border-t">
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/leaderboards/${leaderboardId}`}>
                  View Full Leaderboard
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboards
          </h1>
          <p className="text-muted-foreground">
            Compete with others and track your progress
          </p>
        </div>
      </div>

      {/* User Summary Card */}
      {summaryResponse?.summary && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Your Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {summaryResponse.overall_stats.total_leaderboards}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Leaderboards
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  #{summaryResponse.overall_stats.best_rank || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Best Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summaryResponse.overall_stats.total_achievements}
                </div>
                <div className="text-sm text-muted-foreground">
                  Achievements
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summaryResponse.overall_stats.total_badges}
                </div>
                <div className="text-sm text-muted-foreground">
                  Badges Earned
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {leaderboardsResponse?.exam_type_options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      {option.is_default && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Default
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {leaderboardsResponse?.period_options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Rankings</TabsTrigger>
          <TabsTrigger value="my-performance">My Performance</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {isLoadingLeaderboards ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : leaderboardsError ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load leaderboards</p>
              </CardContent>
            </Card>
          ) : leaderboardsResponse?.leaderboards &&
            leaderboardsResponse.leaderboards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {leaderboardsResponse.leaderboards.map((leaderboard) => (
                <LeaderboardCard
                  key={leaderboard.id}
                  title={leaderboard.exam_title}
                  entries={leaderboard.top_entries}
                  userEntry={leaderboard.user_entry}
                  totalParticipants={leaderboard.total_participants}
                  period={leaderboard.period}
                  leaderboardId={leaderboard.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Leaderboards Found
                </h3>
                <p className="text-muted-foreground">
                  No leaderboards available for {examType} exams in the {period}{" "}
                  period.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-performance" className="space-y-6">
          {isLoadingSummary ? (
            <div className="space-y-6">
              <div className="h-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-96 bg-muted animate-pulse rounded-lg" />
            </div>
          ) : summaryResponse?.summary ? (
            <div className="space-y-6">
              {/* Scheduled Exams Performance */}
              {summaryResponse.summary.scheduled_exams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scheduled Exams Performance</CardTitle>
                    <CardDescription>
                      Your rankings in scheduled exams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summaryResponse.summary.scheduled_exams.map((entry) => (
                        <div
                          key={entry.leaderboard_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{entry.exam_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.period} • {entry.total_exams} exams
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">#{entry.rank}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.score.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Practice Exams Performance */}
              {summaryResponse.summary.practice_exams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Exams Performance</CardTitle>
                    <CardDescription>
                      Your rankings in practice exams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summaryResponse.summary.practice_exams.map((entry) => (
                        <div
                          key={entry.leaderboard_id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{entry.exam_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.period} • {entry.total_exams} exams
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">#{entry.rank}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.score.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Trends */}
              {summaryResponse.summary.performance_trends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>
                      Your ranking changes over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summaryResponse.summary.performance_trends.map(
                        (trend, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{trend.period}</p>
                              <p className="text-sm text-muted-foreground">
                                {trend.trend.charAt(0).toUpperCase() +
                                  trend.trend.slice(1)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">#{trend.rank}</div>
                              <div className="text-sm text-muted-foreground">
                                {trend.score.toFixed(1)}% •{" "}
                                {trend.total_participants} participants
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No performance data available yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {summaryResponse?.summary.recent_achievements &&
          summaryResponse.summary.recent_achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaryResponse.summary.recent_achievements.map(
                (achievement, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {achievement.earned_from}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                achievement.earned_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Achievements Yet
                </h3>
                <p className="text-muted-foreground">
                  Complete exams to start earning achievements and climbing the
                  leaderboards!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
