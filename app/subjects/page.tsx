// app/subjects/page.tsx
"use client";

import React from "react";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetSubjectsQuery,
  useGetPopularSubjectsQuery,
} from "../../lib/store/api/subjectsApi";
import { SubjectCard } from "../../components/subjects/subject-card";
import { SubjectFilters } from "../../components/subjects/subject-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BookOpen, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../lib/utils/constants";

export default function SubjectsPage() {
  const { user, requireAuth } = useAuth();
  const [search, setSearch] = React.useState("");
  const [ordering, setOrdering] = React.useState("sort_order");

  if (!requireAuth()) {
    return null;
  }

  const {
    data: subjectsResponse,
    isLoading: isLoadingSubjects,
    error: subjectsError,
  } = useGetSubjectsQuery({ search, ordering });

  const { data: popularSubjectsResponse, isLoading: isLoadingPopular } =
    useGetPopularSubjectsQuery();

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Subjects
          </h1>
          <p className="text-muted-foreground">
            Explore subjects and their chapters to start learning
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/subjects/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Link>
          </Button>
        )}
      </div>

      {/* Popular Subjects */}
      {popularSubjectsResponse?.subjects &&
        popularSubjectsResponse.subjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Popular Subjects
              </CardTitle>
              <CardDescription>
                Most studied subjects based on exam participation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularSubjectsResponse.subjects.slice(0, 3).map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} isCompact />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Filters */}
      <SubjectFilters
        search={search}
        onSearchChange={setSearch}
        ordering={ordering}
        onOrderingChange={setOrdering}
      />

      {/* Subjects Grid */}
      {isLoadingSubjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : subjectsError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              Failed to load subjects. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : subjectsResponse?.subjects && subjectsResponse.subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectsResponse.subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              showActions={canManage}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No subjects found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "No subjects match your search criteria."
                : "No subjects available yet."}
            </p>
            {canManage && !search && (
              <Button asChild>
                <Link href="/subjects/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Subject
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
