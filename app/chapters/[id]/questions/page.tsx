// app/chapters/[id]/questions/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import { useGetChapterQuery } from "../../../../lib/store/api/subjectsApi";
import { useGetQuestionsQuery } from "../../../../lib/store/api/questionsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { ArrowLeft, FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../../lib/utils/constants";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

export default function ChapterQuestionsPage() {
  const { id } = useParams();
  const { user, requireAuth } = useAuth();
  const [search, setSearch] = React.useState("");
  // Use a non-empty sentinel so we never pass value="" to SelectItem
  const [difficulty, setDifficulty] = React.useState<
    "all" | "easy" | "medium" | "hard"
  >("all");

  if (!requireAuth()) {
    return null;
  }

  const { data: chapter, isLoading: isLoadingChapter } = useGetChapterQuery(
    id as string
  );

  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useGetQuestionsQuery({
    chapter: id as string,
    search,
    // Map "all" to undefined for the API
    difficulty: difficulty !== "all" ? difficulty : undefined,
  });

  const canManage =
    user?.role &&
    [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
      user.role
    );

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

  if (isLoadingChapter) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href={`/chapters/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chapter
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Questions
          </h1>
          <p className="text-muted-foreground">
            {chapter?.name} - Chapter {chapter?.chapter_number}
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={`/chapters/${id}/questions/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as typeof difficulty)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                {/* Non-empty sentinel so Radix never receives value="" on an item */}
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {isLoadingQuestions ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : questionsError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load questions.</p>
          </CardContent>
        </Card>
      ) : questionsResponse?.results && questionsResponse.results.length > 0 ? (
        <div className="space-y-4">
          {questionsResponse.results.map((question: any) => (
            <Card
              key={question.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {question.question_text}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {question.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {question.marks} marks
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {question.options_count} options
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/questions/${question.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/questions/${question.id}`}>View</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              {question.tags && question.tags.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {question.tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Pagination */}
          {questionsResponse.next && (
            <div className="flex justify-center">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No questions found</h3>
            <p className="text-muted-foreground mb-4">
              {search || difficulty !== "all"
                ? "No questions match your search criteria."
                : "This chapter doesn't have any questions yet."}
            </p>
            {canManage && !search && difficulty === "all" && (
              <Button asChild>
                <Link href={`/chapters/${id}/questions/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Question
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
