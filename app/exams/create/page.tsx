// app/exams/create/page.tsx - Enhanced version with question selection
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { ExamCreationForm } from "../../../components/exams/ExamCreationForm";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";

export default function CreateExamPage() {
  const { user, requireAuth } = useAuth();

  if (!requireAuth()) {
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
