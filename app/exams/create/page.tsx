// app/exams/create/page.tsx - Final fixed version
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useCreateExamMutation } from "../../../lib/store/api/examsApi";
import { useGetSubjectsQuery } from "../../../lib/store/api/subjectsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import { ArrowLeft, BookOpen, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../lib/utils/constants";
import type { Chapter } from "../../../types/subjects";
import { useSelector } from "react-redux";
import type { RootState } from "../../../lib/store";

interface ExamFormData {
  title: string;
  description: string;
  exam_type: "self_paced" | "scheduled" | "practice";
  chapters: string[];
  total_questions: number;
  duration_minutes: number;
  time_per_question: number;
  allow_custom_duration: boolean;
  max_duration_minutes: number;
  scheduled_start: string;
  scheduled_end: string;
  marks_per_question: number;
  negative_marking_enabled: boolean;
  negative_marks: number;
  passing_percentage: number;
  is_public: boolean;
  requires_subscription: boolean;
  allow_retakes: boolean;
  max_attempts: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  auto_submit_on_time_up: boolean;
  grace_period_seconds: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  // Get access token from Redux store
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [formData, setFormData] = React.useState<ExamFormData>({
    title: "",
    description: "",
    exam_type: "self_paced",
    chapters: [],
    total_questions: 50,
    duration_minutes: 60,
    time_per_question: 1.2,
    allow_custom_duration: true,
    max_duration_minutes: 120,
    scheduled_start: "",
    scheduled_end: "",
    marks_per_question: 1,
    negative_marking_enabled: true,
    negative_marks: 0.25,
    passing_percentage: 60,
    is_public: true,
    requires_subscription: true,
    allow_retakes: true,
    max_attempts: 0,
    randomize_questions: true,
    randomize_options: true,
    auto_submit_on_time_up: true,
    grace_period_seconds: 30,
  });

  const [selectedSubjects, setSelectedSubjects] = React.useState<Set<string>>(
    new Set()
  );
  const [availableChapters, setAvailableChapters] = React.useState<Chapter[]>(
    []
  );
  const [isLoadingChapters, setIsLoadingChapters] = React.useState(false);

  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const { data: subjectsResponse, isLoading: isLoadingSubjects } =
    useGetSubjectsQuery({});

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

  // Load chapters when subjects are selected
  React.useEffect(() => {
    const loadChapters = async () => {
      if (selectedSubjects.size === 0) {
        setAvailableChapters([]);
        setFormData((prev) => ({ ...prev, chapters: [] }));
        return;
      }

      if (!accessToken) {
        console.error("No access token available");
        return;
      }

      setIsLoadingChapters(true);
      const allChapters: Chapter[] = [];

      console.log(
        "Loading chapters for subjects:",
        Array.from(selectedSubjects)
      );

      try {
        // Load chapters for each selected subject
        for (const subjectId of selectedSubjects) {
          console.log(`Fetching chapters for subject: ${subjectId}`);

          const response = await fetch(
            `http://127.0.0.1:8000/api/subjects/subjects/${subjectId}/chapters/`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log(`Response status for ${subjectId}:`, response.status);

          if (response.ok) {
            const data = await response.json();
            console.log(`Chapters data for ${subjectId}:`, data);

            if (data.success && data.chapters) {
              allChapters.push(...data.chapters);
              console.log(
                `Added ${data.chapters.length} chapters from ${subjectId}`
              );
            }
          } else {
            console.error(
              `Failed to fetch chapters for subject ${subjectId}:`,
              response.status,
              response.statusText
            );
            const errorText = await response.text();
            console.error("Error response:", errorText);
          }
        }

        console.log("Total chapters loaded:", allChapters.length);
        setAvailableChapters(allChapters);

        // Remove chapters that are no longer available
        setFormData((prev) => ({
          ...prev,
          chapters: prev.chapters.filter((chapterId) =>
            allChapters.some((chapter) => chapter.id === chapterId)
          ),
        }));
      } catch (error) {
        console.error("Error loading chapters:", error);
        toast({
          title: "Error",
          description: "Failed to load chapters. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingChapters(false);
      }
    };

    loadChapters();
  }, [selectedSubjects, accessToken, toast]);

  // Replace the handleSubmit function in your create exam page

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Debug logging
    console.log("Form submission:", {
      formData,
      selectedSubjects: Array.from(selectedSubjects),
      availableChapters: availableChapters.length,
    });

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Exam title is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.chapters.length === 0) {
      toast({
        title: "Error",
        description: "At least one chapter must be selected",
        variant: "destructive",
      });
      return;
    }

    if (formData.exam_type === "scheduled") {
      if (!formData.scheduled_start || !formData.scheduled_end) {
        toast({
          title: "Error",
          description: "Start and end times are required for scheduled exams",
          variant: "destructive",
        });
        return;
      }

      if (
        new Date(formData.scheduled_start) >= new Date(formData.scheduled_end)
      ) {
        toast({
          title: "Error",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Prepare the form data with proper datetime format
      const submitData = { ...formData };

      // Convert datetime-local format to ISO format with timezone for scheduled exams
      if (formData.exam_type === "scheduled") {
        if (formData.scheduled_start) {
          // Convert from "YYYY-MM-DDTHH:MM" to "YYYY-MM-DDTHH:MM:SS+06:00" (Bangladesh timezone)
          submitData.scheduled_start = new Date(
            formData.scheduled_start
          ).toISOString();
        }
        if (formData.scheduled_end) {
          submitData.scheduled_end = new Date(
            formData.scheduled_end
          ).toISOString();
        }
      } else {
        // For non-scheduled exams, remove the datetime fields
        delete submitData.scheduled_start;
        delete submitData.scheduled_end;
      }

      console.log("Submitting data:", submitData);

      const result = await createExam(submitData).unwrap();

      toast({
        title: "Success",
        description: "Exam created successfully",
        variant: "success",
      });

      router.push("/exams");
    } catch (error: any) {
      console.error("Create exam error:", error);

      let errorMessage = "Failed to create exam";

      if (error?.data) {
        if (typeof error.data === "string") {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (error.data.errors) {
          const firstError = Object.values(error.data.errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else {
            errorMessage = String(firstError);
          }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleChapterToggle = (chapterId: string) => {
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.includes(chapterId)
        ? prev.chapters.filter((id) => id !== chapterId)
        : [...prev.chapters, chapterId],
    }));
  };

  if (isLoadingSubjects) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading subjects...</div>
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
          Set up a new exam for your students
        </p>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <p className="text-xs">
              Debug: Selected subjects:{" "}
              {Array.from(selectedSubjects).join(", ")} | Chapters loaded:{" "}
              {availableChapters.length} | Loading:{" "}
              {isLoadingChapters ? "Yes" : "No"} | Token:{" "}
              {accessToken ? "Available" : "Missing"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the basic details for your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Exam Title *
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this exam covers"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="exam_type" className="text-sm font-medium">
                  Exam Type *
                </label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(
                    value: "self_paced" | "scheduled" | "practice"
                  ) => handleInputChange("exam_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_paced">Self Paced</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="passing_percentage"
                  className="text-sm font-medium"
                >
                  Passing Percentage *
                </label>
                <Input
                  id="passing_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_percentage}
                  onChange={(e) =>
                    handleInputChange(
                      "passing_percentage",
                      parseFloat(e.target.value)
                    )
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Exam Settings */}
        {formData.exam_type === "scheduled" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Settings
              </CardTitle>
              <CardDescription>
                Set when the exam will be available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="scheduled_start"
                    className="text-sm font-medium"
                  >
                    Start Time *
                  </label>
                  <Input
                    id="scheduled_start"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) =>
                      handleInputChange("scheduled_start", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="scheduled_end"
                    className="text-sm font-medium"
                  >
                    End Time *
                  </label>
                  <Input
                    id="scheduled_end"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) =>
                      handleInputChange("scheduled_end", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Content Selection</CardTitle>
            <CardDescription>
              Choose the subjects and chapters for this exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subjects *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {subjectsResponse?.subjects?.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjects.has(subject.id)}
                      onCheckedChange={() => handleSubjectToggle(subject.id)}
                    />
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {subject.name}
                    </label>
                  </div>
                ))}
              </div>
              {(!subjectsResponse?.subjects ||
                subjectsResponse.subjects.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No subjects available.
                </p>
              )}
            </div>

            {/* Chapter Selection */}
            {isLoadingChapters && (
              <div className="text-center py-8 text-muted-foreground">
                Loading chapters for selected subjects...
              </div>
            )}

            {!isLoadingChapters && availableChapters.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Chapters *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {availableChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`chapter-${chapter.id}`}
                        checked={formData.chapters.includes(chapter.id)}
                        onCheckedChange={() => handleChapterToggle(chapter.id)}
                      />
                      <label
                        htmlFor={`chapter-${chapter.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {chapter.subject_name} - {chapter.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.chapters.length} chapter(s) selected
                </p>
              </div>
            )}

            {selectedSubjects.size === 0 && !isLoadingChapters && (
              <div className="text-center py-8 text-muted-foreground">
                Please select subjects first to see available chapters.
              </div>
            )}

            {selectedSubjects.size > 0 &&
              !isLoadingChapters &&
              availableChapters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No chapters available for selected subjects.
                </div>
              )}
          </CardContent>
        </Card>

        {/* Rest of the form components remain the same... */}
        {/* Exam Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exam Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="total_questions"
                  className="text-sm font-medium"
                >
                  Total Questions *
                </label>
                <Input
                  id="total_questions"
                  type="number"
                  min="1"
                  value={formData.total_questions}
                  onChange={(e) =>
                    handleInputChange(
                      "total_questions",
                      parseInt(e.target.value)
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="duration_minutes"
                  className="text-sm font-medium"
                >
                  Duration (minutes) *
                </label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    handleInputChange(
                      "duration_minutes",
                      parseInt(e.target.value)
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="marks_per_question"
                  className="text-sm font-medium"
                >
                  Marks per Question
                </label>
                <Input
                  id="marks_per_question"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.marks_per_question}
                  onChange={(e) =>
                    handleInputChange(
                      "marks_per_question",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/exams")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreating || formData.chapters.length === 0}
          >
            {isCreating ? "Creating..." : "Create Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
