"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useGetChapterQuery } from "../../../lib/store/api/subjectsApi";
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
  ArrowLeft,
  BookOpen,
  FileText,
  Users,
  Plus,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";

export default function ChapterDetailPage() {
  const { id } = useParams();
  const { user, requireAuth } = useAuth();

  if (!requireAuth()) {
    return null;
  }

  const { data: chapter, isLoading, error } = useGetChapterQuery(id as string);

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load chapter details.</p>
            <Button asChild className="mt-4">
              <Link href="/subjects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href={`/subjects/${chapter.subject}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {chapter.subject_detail?.name || "Subject"}
        </Link>
      </Button>

      {/* Chapter Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Chapter {chapter.chapter_number}: {chapter.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {chapter.subject_detail?.name} -{" "}
                    {chapter.subject_detail?.code}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/chapters/${chapter.id}/edit`}>Edit</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/chapters/${chapter.id}/questions/create`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Badge
                  variant="outline"
                  className={`${getDifficultyColor(chapter.difficulty_level)}`}
                >
                  {chapter.difficulty_level}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {chapter.questions_count} questions
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {chapter.exams_count} exams
                </span>
              </div>
              {chapter.description && (
                <CardDescription className="mt-4">
                  {chapter.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chapter Content */}
      {chapter.content && (
        <Card>
          <CardHeader>
            <CardTitle>Chapter Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{chapter.content}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Questions
            </CardTitle>
            <CardDescription>
              View and manage questions for this chapter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">{chapter.questions_count}</p>
            <Button asChild className="w-full">
              <Link href={`/chapters/${chapter.id}/questions`}>
                View Questions
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Exams
            </CardTitle>
            <CardDescription>
              View exams that include this chapter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">{chapter.exams_count}</p>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/chapters/${chapter.id}/exams`}>View Exams</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistics
            </CardTitle>
            <CardDescription>
              View performance statistics for this chapter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">Stats</p>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/chapters/${chapter.id}/stats`}>View Stats</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
