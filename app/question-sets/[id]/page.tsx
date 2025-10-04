// app/question-sets/[id]/page.tsx
"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import {
  useGetQuestionSetQuery,
  useDeleteQuestionSetMutation,
} from "../../../lib/store/api/questionSetsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  Loader2,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";
import { useToast } from "../../../components/ui/use-toast";

export default function QuestionSetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const id = params?.id as string;

  const { data, isLoading: isLoadingData } = useGetQuestionSetQuery(id, {
    skip: !id,
  });

  const [deleteQuestionSet, { isLoading: isDeleting }] =
    useDeleteQuestionSetMutation();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push("/login");
    }
  }, [user, isLoadingAuth, router]);

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

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this question set? This action cannot be undone."
      )
    ) {
      try {
        await deleteQuestionSet(id).unwrap();
        toast({
          title: "Success",
          description: "Question set deleted successfully",
        });
        router.push("/question-sets");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete question set",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const questionSet = data?.question_set;

  if (!questionSet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Question set not found</p>
            <Button asChild className="mt-4">
              <Link href="/question-sets">Back to Question Sets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/question-sets" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Question Sets
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/question-sets/${id}/edit`}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Question Set Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{questionSet.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionSet.description && (
            <p className="text-muted-foreground">{questionSet.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {questionSet.total_questions} questions
            </Badge>
            <Badge variant="outline">
              {questionSet.chapters_count} chapters
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Used {questionSet.usage_count} times
            </Badge>
          </div>

          {/* Difficulty Distribution */}
          {questionSet.difficulty_distribution && (
            <div className="flex gap-2">
              <Badge variant="outline" className={getDifficultyColor("easy")}>
                Easy: {questionSet.difficulty_distribution.easy}%
              </Badge>
              <Badge variant="outline" className={getDifficultyColor("medium")}>
                Medium: {questionSet.difficulty_distribution.medium}%
              </Badge>
              <Badge variant="outline" className={getDifficultyColor("hard")}>
                Hard: {questionSet.difficulty_distribution.hard}%
              </Badge>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p>Created by: {questionSet.created_by_name}</p>
            <p>
              Created: {new Date(questionSet.created_at).toLocaleDateString()}
            </p>
            {questionSet.last_used_at && (
              <p>
                Last used:{" "}
                {new Date(questionSet.last_used_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chapters */}
      {questionSet.chapters_detail &&
        questionSet.chapters_detail.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {questionSet.chapters_detail.map((chapter: any) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {chapter.subject_name} - Chapter{" "}
                        {chapter.chapter_number}: {chapter.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {chapter.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(chapter.difficulty_level)}
                      >
                        {chapter.difficulty_level}
                      </Badge>
                      <Badge variant="secondary">
                        {chapter.questions_count} questions
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({questionSet.total_questions})</CardTitle>
        </CardHeader>
        <CardContent>
          {questionSet.questions_detail &&
          questionSet.questions_detail.length > 0 ? (
            <div className="space-y-4">
              {questionSet.questions_detail.map(
                (question: any, index: number) => (
                  <Card
                    key={question.id}
                    className="border-l-4 border-l-primary"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Question Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                Question {index + 1}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getDifficultyColor(
                                  question.difficulty
                                )}
                              >
                                {question.difficulty}
                              </Badge>
                              <Badge variant="secondary">
                                {question.marks} marks
                              </Badge>
                              {question.negative_marks > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  -{question.negative_marks} for wrong
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {question.subject_name} - {question.chapter_name}
                            </p>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <p className="font-medium whitespace-pre-wrap">
                            {question.question_text}
                          </p>
                          {question.question_image && (
                            <img
                              src={question.question_image}
                              alt="Question"
                              className="mt-2 max-w-md rounded-lg border"
                            />
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Options:
                          </p>
                          <div className="grid gap-2">
                            {[...question.options]
                              .sort(
                                (a: any, b: any) =>
                                  a.option_order - b.option_order
                              )
                              .map((option: any) => (
                                <div
                                  key={option.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                                    option.is_correct
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  {option.is_correct ? (
                                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p
                                      className={
                                        option.is_correct
                                          ? "font-medium text-green-900"
                                          : "text-gray-700"
                                      }
                                    >
                                      {option.option_text}
                                    </p>
                                    {option.option_image && (
                                      <img
                                        src={option.option_image}
                                        alt={`Option ${option.option_order}`}
                                        className="mt-2 max-w-xs rounded border"
                                      />
                                    )}
                                  </div>
                                  {option.is_correct && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-800 border-green-200"
                                    >
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Statistics */}
                        <div className="flex items-center gap-4 pt-2 border-t text-sm text-muted-foreground">
                          <span>Success Rate: {question.success_rate}%</span>
                          <span>Times Used: {question.times_used || 0}</span>
                          <span>
                            Total Attempts: {question.total_attempts || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No questions in this set
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
