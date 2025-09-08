// app/subjects/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useGetSubjectChaptersQuery } from "../../../lib/store/api/subjectsApi";
import { ChapterCard } from "../../../components/subjects/chapter-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, BookOpen, Plus, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { USER_ROLES } from "../../../lib/utils/constants";

export default function SubjectDetailPage() {
  const { id } = useParams();
  const { user, requireAuth } = useAuth();

  if (!requireAuth()) {
    return null;
  }

  const {
    data: response,
    isLoading,
    error,
  } = useGetSubjectChaptersQuery(id as string);

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load subject details.</p>
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

  const { subject, chapters } = response;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/subjects">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Link>
      </Button>

      {/* Subject Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {subject.image ? (
                <Image
                  src={subject.image}
                  alt={subject.name}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              ) : (
                <BookOpen className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{subject.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Code: {subject.code}
                  </p>
                </div>
                {canManage && (
                  <Button asChild>
                    <Link href={`/subjects/${subject.id}/chapters/create`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter
                    </Link>
                  </Button>
                )}
              </div>
              <CardDescription className="mt-2">
                {subject.description || "No description available"}
              </CardDescription>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {subject.chapters_count} chapters
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {subject.questions_count} questions
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chapters */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Chapters</h2>
        {chapters && chapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                showActions={canManage}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
              <p className="text-muted-foreground mb-4">
                This subject doesn't have any chapters yet.
              </p>
              {canManage && (
                <Button asChild>
                  <Link href={`/subjects/${subject.id}/chapters/create`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Chapter
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
