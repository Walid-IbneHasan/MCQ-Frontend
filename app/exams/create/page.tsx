// app/exams/create/page.tsx - FIXED VERSION
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { ExamCreationForm } from "../../../components/exams/ExamCreationForm";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";

export default function CreateExamPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Handle auth check in useEffect instead of during render
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">
              You don't have permission to create exams.
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/exams">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exams
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Create New Exam
        </h1>
        <p className="text-muted-foreground">
          Set up a new exam with question selection options
        </p>
      </div>

      {/* Enhanced Form with Question Selection */}
      <ExamCreationForm />
    </div>
  );
}
