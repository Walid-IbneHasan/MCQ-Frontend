// app/chapters/[id]/questions/create/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../hooks/use-auth";
import { useGetChapterQuery } from "../../../../../lib/store/api/subjectsApi";
import { useCreateQuestionMutation } from "../../../../../lib/store/api/questionsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { Badge } from "../../../../../components/ui/badge";
import { ArrowLeft, FileText, Plus, X, Upload } from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../../../lib/utils/constants";

interface QuestionOption {
  option_text: string;
  option_order: number;
  is_correct: boolean;
}

export default function CreateQuestionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  const [formData, setFormData] = React.useState({
    question_text: "",
    explanation: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    marks: 1,
    negative_marks: 0.25,
    allow_negative_marking: true,
  });

  const [options, setOptions] = React.useState<QuestionOption[]>([
    { option_text: "", option_order: 1, is_correct: false },
    { option_text: "", option_order: 2, is_correct: false },
    { option_text: "", option_order: 3, is_correct: false },
    { option_text: "", option_order: 4, is_correct: false },
  ]);

  const [tags, setTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState("");

  const [createQuestion, { isLoading: isCreating }] =
    useCreateQuestionMutation();
  const { data: chapter, isLoading: isLoadingChapter } = useGetChapterQuery(
    id as string
  );

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
              You don't have permission to create questions.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/chapters/${id}/questions`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.question_text.trim()) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }

    const correctOptions = options.filter(
      (opt) => opt.is_correct && opt.option_text.trim()
    );
    if (correctOptions.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly one correct answer",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter((opt) => opt.option_text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    try {
      const questionData = {
        ...formData,
        chapter: id as string,
        options: validOptions,
        tags: tags.filter((tag) => tag.trim()),
      };

      await createQuestion(questionData).unwrap();

      toast({
        title: "Success",
        description: "Question created successfully",
        variant: "success",
      });

      router.push(`/chapters/${id}/questions`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (
    index: number,
    field: keyof QuestionOption,
    value: any
  ) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    );
  };

  const setCorrectOption = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      }))
    );
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions((prev) => [
        ...prev,
        { option_text: "", option_order: prev.length + 1, is_correct: false },
      ]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((opt, i) => ({ ...opt, option_order: i + 1 }))
      );
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  if (isLoadingChapter) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href={`/chapters/${id}/questions`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Create New Question
        </h1>
        <p className="text-muted-foreground">
          Add a new question to {chapter?.name} - Chapter{" "}
          {chapter?.chapter_number}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="question_text" className="text-sm font-medium">
                Question Text *
              </label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) =>
                  handleInputChange("question_text", e.target.value)
                }
                placeholder="Enter your question here..."
                required
                rows={4}
              />
            </div>

            {/* Question Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Question Image (Optional)
              </label>
              <div className="space-y-4">
                {/* Image Preview */}
                {questionImage && (
                  <div className="relative inline-block">
                    <img
                      src={URL.createObjectURL(questionImage)}
                      alt="Question"
                      className="max-w-xs h-auto rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeQuestionImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleQuestionImageUpload}
                    className="hidden"
                    id="question-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("question-image-upload")?.click()
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {questionImage && (
                    <span className="text-sm text-muted-foreground">
                      {questionImage.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="explanation" className="text-sm font-medium">
                Explanation (Optional)
              </label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) =>
                  handleInputChange("explanation", e.target.value)
                }
                placeholder="Explain why the correct answer is correct..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium">
                  Difficulty *
                </label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") =>
                    handleInputChange("difficulty", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="marks" className="text-sm font-medium">
                  Marks *
                </label>
                <Input
                  id="marks"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={formData.marks}
                  onChange={(e) =>
                    handleInputChange("marks", parseFloat(e.target.value))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="negative_marks" className="text-sm font-medium">
                  Negative Marks
                </label>
                <Input
                  id="negative_marks"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.negative_marks}
                  onChange={(e) =>
                    handleInputChange(
                      "negative_marks",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Answer Options</CardTitle>
                <CardDescription>
                  Add options and select the correct answer. Click on an option
                  to mark it as correct.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={options.length >= 6}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">
                  {String.fromCharCode(65 + index)}.
                </span>
                <Input
                  value={option.option_text}
                  onChange={(e) =>
                    handleOptionChange(index, "option_text", e.target.value)
                  }
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={option.is_correct ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCorrectOption(index)}
                >
                  {option.is_correct ? "Correct" : "Mark Correct"}
                </Button>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags (Optional)</CardTitle>
            <CardDescription>
              Add tags to help categorize and search for this question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter a tag..."
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
              />
              <Button type="button" onClick={addTag}>
                Add Tag
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/chapters/${id}/questions`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
