// app/questions/[id]/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import {
  useGetQuestionQuery,
  useDeleteQuestionMutation,
} from "../../../lib/store/api/questionsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ArrowLeft, FileText, Edit, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";
import { useToastContext } from "../../../lib/providers/toast-provider";

export default function QuestionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  if (!requireAuth()) {
    return null;
  }

  const {
    data: question,
    isLoading,
    error,
  } = useGetQuestionQuery(id as string);

  const [deleteQuestion, { isLoading: isDeleting }] =
    useDeleteQuestionMutation();

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this question?`)) {
      try {
        await deleteQuestion(id as string).unwrap();
        toast({
          title: "Success",
          description: "Question deleted successfully",
          variant: "success",
        });
        router.push(`/chapters/${question?.chapter}/questions`);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive",
        });
      }
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load question details.</p>
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
        <Link href={`/chapters/${question.chapter}/questions`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>
      </Button>

      {/* Question Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {question.subject_name} • {question.chapter_name}
                </span>
              </div>
              <CardTitle className="text-2xl mb-4">
                {question.question_text}
              </CardTitle>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className={`${getDifficultyColor(question.difficulty)}`}
                >
                  {question.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {question.marks} marks
                </span>
                <span className="text-sm text-muted-foreground">
                  Negative: {question.negative_marks} marks
                </span>
                {question.success_rate > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {question.success_rate.toFixed(1)}% success rate
                  </span>
                )}
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/questions/${question.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Question Image */}
      {question.question_image && (
        <Card>
          <CardHeader>
            <CardTitle>Question Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={question.question_image}
              alt="Question"
              className="max-w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg border-2 ${
                  option.is_correct
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-lg">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900">{option.option_text}</p>
                    {option.option_image && (
                      <img
                        src={option.option_image}
                        alt={`Option ${String.fromCharCode(65 + index)}`}
                        className="mt-2 max-w-xs h-auto rounded"
                      />
                    )}
                  </div>
                  {option.is_correct && (
                    <Badge variant="default" className="bg-green-600">
                      Correct
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      {question.explanation && (
        <Card>
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {question.explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{question.times_used || 0}</p>
                <p className="text-sm text-muted-foreground">Times Used</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {question.total_attempts || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {question.success_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{question.options_count}</p>
                <p className="text-sm text-muted-foreground">Options</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
