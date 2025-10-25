// app/exams/[id]/edit/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import {
  useGetExamQuery,
  useUpdateExamMutation,
} from "../../../../lib/store/api/examsApi";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../../lib/utils/constants";
import { ExamEditForm } from "../../../../components/exams/ExamEditForm";

export default function EditExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // API hooks before conditional returns
  const {
    data: examResponse,
    isLoading: examLoading,
    error,
  } = useGetExamQuery(id as string, {
    skip: !user,
  });

  // Auth redirect in useEffect
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  // Loading state
  if (authLoading || examLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    return null;
  }

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              You don't have permission to edit exams.
            </p>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href={`/exams/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exam Details
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Edit Exam
        </h1>
        <p className="text-muted-foreground">
          Update exam details and configuration
        </p>
      </div>

      {/* Edit Form */}
      <ExamEditForm exam={examResponse.exam} />
    </div>
  );
}
