"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useGetMyResultsQuery } from "../../lib/store/api/resultsApi";
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
  Trophy,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

// A generic loading component to avoid repetition
const LoadingSkeleton = () => (
  <div className="container mx-auto p-6">
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-32 bg-muted rounded" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded" />
        ))}
      </div>
    </div>
  </div>
);

export default function ResultsPage() {
  // ✅ FIX 1: Assume your useAuth hook provides an `isLoading` state.
  // We'll rename it to avoid conflicting with the data query's isLoading.
  const { user, requireAuth, isLoading: isAuthLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const {
    data: resultsResponse,
    isLoading: isResultsLoading, // Renamed for clarity
    error,
  } = useGetMyResultsQuery({
    page,
  });

  // ✅ FIX 2: Modify the useEffect to wait for the auth check to finish.
  useEffect(() => {
    // Only call requireAuth() AFTER the loading state is false.
    if (!isAuthLoading) {
      requireAuth();
    }
  }, [isAuthLoading, requireAuth]);

  const {
    summary = {},
    subject_performance = [],
    results = [],
  } = resultsResponse || {};

  const filteredResults = useMemo(() => {
    if (!results) return [];

    let filtered = results;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((result) =>
        result.exam_detail.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((result) => {
        switch (filterStatus) {
          case "passed":
            return result.is_passed;
          case "failed":
            return !result.is_passed;
          case "excellent":
            return result.percentage_score >= 90;
          case "good":
            return (
              result.percentage_score >= 70 && result.percentage_score < 90
            );
          case "needs_improvement":
            return result.percentage_score < 50;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [results, searchTerm, filterStatus]);

  // ✅ FIX 3: Combine both loading states for a smoother UI.
  if (isAuthLoading || isResultsLoading) {
    return <LoadingSkeleton />;
  }

  // Now that loading is done, we can safely check for the user.
  if (!user) {
    // This will be caught by requireAuth, but this prevents rendering anything before the redirect.
    return null;
  }

  if (error || !resultsResponse || !results || results.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't taken any exams yet, or there was an error loading
              your results.
            </p>
            <Button asChild>
              <Link href="/exams">Start Taking Exams</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Results</h1>
          <p className="text-muted-foreground">
            Your complete exam history and performance analytics
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Dashboard
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Exams
                </p>
                <p className="text-2xl font-bold">
                  {summary?.total_exams ?? 0}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {summary?.passed_exams ?? 0} passed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pass Rate
                </p>
                <p className="text-2xl font-bold">
                  {(summary?.pass_rate ?? 0).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              {(summary?.pass_rate ?? 0) >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (summary?.pass_rate ?? 0) < 60 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <p className="text-xs text-muted-foreground">
                {(summary?.pass_rate ?? 0) >= 80
                  ? "Excellent"
                  : (summary?.pass_rate ?? 0) >= 60
                  ? "Good"
                  : "Needs improvement"}
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
                  {(summary?.average_score ?? 0).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Subjects
                </p>
                <p className="text-2xl font-bold">
                  {subject_performance?.length ?? 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Different subjects
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance Summary */}
      {(subject_performance?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>
              Your performance breakdown by subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject_performance.map((subject) => (
                <div key={subject.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {subject.subject_detail.name}
                    </h4>
                    <Badge variant="outline">
                      {subject.subject_detail.code}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Score:</span>
                      <span className="font-medium">
                        {subject.average_score.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exams Taken:</span>
                      <span className="font-medium">{subject.exams_taken}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pass Rate:</span>
                      <span className="font-medium">
                        {subject.pass_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {subject.trend === "Improving" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : subject.trend === "Declining" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className="text-sm">{subject.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                <SelectItem value="good">Good (70-89%)</SelectItem>
                <SelectItem value="needs_improvement">
                  Needs Improvement (&lt;50%)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>Exam History</CardTitle>
          <CardDescription>
            {filteredResults.length} results found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">
                        {result.exam_detail.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.created_at).toLocaleDateString()} •
                        <span className="capitalize ml-1">
                          {result.exam_detail.exam_type.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            result.is_passed ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {result.percentage_score.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Grade {result.grade}
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-full ${
                          result.is_passed ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {result.is_passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/results/${result.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Questions</p>
                      <p className="font-medium">{result.total_questions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Correct</p>
                      <p className="font-medium text-green-600">
                        {result.correct_answers}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wrong</p>
                      <p className="font-medium text-red-600">
                        {result.wrong_answers}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Accuracy</p>
                      <p className="font-medium">
                        {result.accuracy_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {result.time_taken_minutes}m
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rank</p>
                      <p className="font-medium">#{result.rank}</p>
                    </div>
                  </div>

                  {(result.strong_areas.length > 0 ||
                    result.weak_areas.length > 0) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-2">
                        {result.strong_areas.slice(0, 3).map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="bg-green-100 text-green-800 text-xs"
                          >
                            ✓ {area}
                          </Badge>
                        ))}
                        {result.weak_areas.slice(0, 3).map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="bg-red-100 text-red-800 text-xs"
                          >
                            ⚠ {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results match your criteria</p>
              <p className="text-sm">
                Try adjusting your search or filter settings
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
