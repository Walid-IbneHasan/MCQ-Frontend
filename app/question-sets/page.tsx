// app/question-sets/page.tsx (FIXED VERSION)
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetQuestionSetsQuery,
  useDeleteQuestionSetMutation,
} from "../../lib/store/api/questionSetsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Trash2, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../lib/utils/constants";

export default function QuestionSetsPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const { data, isLoading: isLoadingData } = useGetQuestionSetsQuery({});
  const [deleteQuestionSet] = useDeleteQuestionSetMutation();

  // Handle auth check in useEffect instead of during render
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push("/login");
    }
  }, [user, isLoadingAuth, router]);

  // Show loading state while checking auth
  if (isLoadingAuth) {
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
              You don't have permission to view question sets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this question set?")) {
      try {
        await deleteQuestionSet(id).unwrap();
      } catch (error) {
        console.error("Failed to delete question set:", error);
      }
    }
  };

  // Extract question sets from paginated response structure
  const questionSets =
    data?.results?.question_sets || data?.question_sets || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Sets</h1>
          <p className="text-muted-foreground">
            Manage your reusable question sets
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/exams/create">Create Exam</Link>
          </Button>
          <Button asChild>
            <Link href="/question-sets/create">Create Question Set</Link>
          </Button>
        </div>
      </div>
      {isLoadingData ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : questionSets.length > 0 ? (
        <div className="grid gap-4">
          {questionSets.map((set: any) => (
            <Card key={set.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{set.name}</h3>

                    {set.description && (
                      <p className="text-muted-foreground mb-3">
                        {set.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">
                        {set.total_questions} questions
                      </Badge>
                      <Badge variant="outline">
                        {set.chapters_count} chapters
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Used {set.usage_count} times
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Created by: {set.created_by_name}</p>
                      <p>
                        Created: {new Date(set.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/question-sets/${set.id}`}
                        className="flex items-center "
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(set.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No question sets yet. Create one by enabling "Create Question Set"
              when creating an exam.
            </p>
            <Button asChild>
              <Link href="/exams/create">Create Your First Exam</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
