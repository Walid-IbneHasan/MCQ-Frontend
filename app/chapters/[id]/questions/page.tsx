// app/chapters/[id]/questions/page.tsx (MODERN TABULAR VERSION)
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import { useGetChapterQuery } from "../../../../lib/store/api/subjectsApi";
import { useGetChapterQuestionsQuery } from "../../../../lib/store/api/questionsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
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
  const [difficulty, setDifficulty] = React.useState("all");

  if (!requireAuth()) {
    return null;
  }

  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useGetChapterQuestionsQuery(id as string);

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

  // Filter questions client-side
  const filteredQuestions = React.useMemo(() => {
    if (!questionsResponse?.questions) return [];

    let filtered = questionsResponse.questions;

    if (search) {
      filtered = filtered.filter(
        (q) =>
          q.question_text.toLowerCase().includes(search.toLowerCase()) ||
          q.tags.some((tag) =>
            tag.name.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    if (difficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }

    return filtered;
  }, [questionsResponse?.questions, search, difficulty]);

  if (isLoadingQuestions) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
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
            {questionsResponse?.chapter?.name} - Chapter{" "}
            {questionsResponse?.chapter?.chapter_number}
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
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      {questionsError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load questions.</p>
            <p className="text-sm text-muted-foreground mt-2">
              {JSON.stringify(questionsError)}
            </p>
          </CardContent>
        </Card>
      ) : filteredQuestions.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Questions List</CardTitle>
                <CardDescription>
                  Showing {filteredQuestions.length} of{" "}
                  {questionsResponse?.questions?.length || 0} questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">
                      Question
                    </th>
                    <th className="text-left p-4 font-medium text-sm">
                      Difficulty
                    </th>
                    <th className="text-left p-4 font-medium text-sm">Marks</th>
                    <th className="text-left p-4 font-medium text-sm">
                      Options
                    </th>
                    <th className="text-left p-4 font-medium text-sm">Tags</th>
                    <th className="text-left p-4 font-medium text-sm">
                      Success Rate
                    </th>
                    <th className="text-right p-4 font-medium text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question, index) => (
                    <tr
                      key={question.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="max-w-md">
                          <p className="font-medium text-sm line-clamp-2 leading-5">
                            {question.question_text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created{" "}
                            {new Date(question.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">+{question.marks}</div>
                          <div className="text-xs text-muted-foreground">
                            -{question.negative_marks}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {question.options_count}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {question.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {question.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{question.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {question.success_rate > 0
                            ? `${question.success_rate.toFixed(1)}%`
                            : "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/questions/${question.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button asChild size="sm" variant="ghost">
                                <Link href={`/questions/${question.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/questions/${question.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/questions/${question.id}/edit`}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Question
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
