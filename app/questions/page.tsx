// app/questions/page.tsx (FIXED CHAPTER FILTER)
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/use-auth";
import {
  useGetQuestionsQuery,
  useDeleteQuestionMutation,
} from "../../lib/store/api/questionsApi";
import { useGetSubjectsQuery } from "../../lib/store/api/subjectsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useToast } from "../../components/ui/use-toast";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { USER_ROLES } from "../../lib/utils/constants";
import { QuestionModal } from "../../components/questions/QuestionModal";
import { QuestionViewModal } from "../../components/questions/QuestionViewModal";
import { useSelector } from "react-redux";
import type { RootState } from "../../lib/store";

export default function QuestionsPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );

  const { data: subjectsData } = useGetSubjectsQuery({});
  const subjects = subjectsData?.subjects || [];

  const {
    data,
    isLoading: isLoadingData,
    refetch,
  } = useGetQuestionsQuery({
    search: debouncedSearch,
    difficulty: difficultyFilter === "all" ? undefined : difficultyFilter,
    subject: subjectFilter === "all" ? undefined : subjectFilter,
    chapter: chapterFilter === "all" ? undefined : chapterFilter,
    page: currentPage,
  });

  const [deleteQuestion, { isLoading: isDeleting }] =
    useDeleteQuestionMutation();

  // Get chapters for selected subject
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  useEffect(() => {
    const fetchChapters = async () => {
      if (subjectFilter !== "all" && accessToken) {
        setIsLoadingChapters(true);
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/api/subjects/subjects/${subjectFilter}/chapters/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log("Chapters loaded:", data.chapters); // Debug log
            setChapters(data.chapters || []);
          } else {
            console.error("Failed to fetch chapters:", response.status);
            setChapters([]);
          }
        } catch (error) {
          console.error("Error fetching chapters:", error);
          setChapters([]);
        } finally {
          setIsLoadingChapters(false);
        }
      } else {
        setChapters([]);
        setChapterFilter("all");
      }
    };
    fetchChapters();
  }, [subjectFilter, accessToken]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  if (!user) return null;

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
              You don't have permission to manage questions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (id: string, questionText: string) => {
    if (
      confirm(
        `Are you sure you want to delete this question?\n\n"${questionText.slice(
          0,
          100
        )}..."`
      )
    ) {
      try {
        await deleteQuestion(id).unwrap();
        toast({
          title: "Success",
          description: "Question deleted successfully",
        });
        refetch();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive",
        });
      }
    }
  };

  const handleView = (id: string) => {
    setSelectedQuestionId(id);
    setIsViewModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedQuestionId(id);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedQuestionId(null);
    refetch();
  };

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

  const questions = data?.results?.questions || [];
  const totalCount = data?.count || 0;
  const hasNext = data?.next !== null;
  const hasPrevious = data?.previous !== null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground">Manage all exam questions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={subjectFilter}
              onValueChange={(val) => {
                setSubjectFilter(val);
                setChapterFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={chapterFilter}
              onValueChange={setChapterFilter}
              disabled={subjectFilter === "all" || isLoadingChapters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingChapters ? "Loading..." : "All Chapters"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((chapter: any) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    Ch. {chapter.chapter_number}: {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Questions ({totalCount})</CardTitle>
            {(searchTerm ||
              difficultyFilter !== "all" ||
              subjectFilter !== "all" ||
              chapterFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setDifficultyFilter("all");
                  setSubjectFilter("all");
                  setChapterFilter("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : questions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Question</TableHead>
                      <TableHead>Subject & Chapter</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question: any) => (
                      <TableRow key={question.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium line-clamp-2">
                              {question.question_text}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {question.question_image && (
                                <Badge variant="outline" className="text-xs">
                                  Has Image
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {question.options_count} options
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {question.subject_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {question.chapter_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getDifficultyColor(question.difficulty)}
                          >
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              +{question.marks}
                            </p>
                            {question.negative_marks > 0 && (
                              <p className="text-xs text-red-600">
                                -{question.negative_marks}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <p>Success: {question.success_rate}%</p>
                            <p className="text-muted-foreground">
                              Used: {question.times_used || 0}x
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(question.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(question.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDelete(
                                    question.id,
                                    question.question_text
                                  )
                                }
                                className="text-destructive"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalCount > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil(totalCount / 20)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ||
                difficultyFilter !== "all" ||
                subjectFilter !== "all" ||
                chapterFilter !== "all"
                  ? "No questions found matching your filters"
                  : "No questions yet"}
              </p>
              {!searchTerm &&
                difficultyFilter === "all" &&
                subjectFilter === "all" && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Question
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <QuestionModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        mode="create"
      />

      <QuestionModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        mode="edit"
        questionId={selectedQuestionId}
      />

      <QuestionViewModal
        isOpen={isViewModalOpen}
        onClose={handleModalClose}
        questionId={selectedQuestionId}
      />
    </div>
  );
}
