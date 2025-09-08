"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../hooks/use-auth";
import {
  useGetSubjectQuery,
  useCreateChapterMutation,
} from "../../../../../lib/store/api/subjectsApi";
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
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useToastContext } from "../../../../../lib/providers/toast-provider";
import { USER_ROLES } from "../../../../../lib/utils/constants";

export default function CreateChapterPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    chapter_number: "",
    difficulty_level: "beginner",
    content: "",
    is_active: true,
  });

  const [createChapter, { isLoading: isCreating }] = useCreateChapterMutation();
  const { data: subject, isLoading: isLoadingSubject } = useGetSubjectQuery(
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
              You don't have permission to create chapters.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/subjects/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subject
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const chapterData = {
        ...formData,
        subject: id as string,
        chapter_number: parseInt(formData.chapter_number),
      };

      await createChapter(chapterData).unwrap();

      toast({
        title: "Success",
        description: "Chapter created successfully",
        variant: "success",
      });

      router.push(`/subjects/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create chapter",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoadingSubject) {
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
        <Link href={`/subjects/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {subject?.name}
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Create New Chapter
        </h1>
        <p className="text-muted-foreground">
          Add a new chapter to {subject?.name}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Chapter Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter chapter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="chapter_number" className="text-sm font-medium">
                  Chapter Number *
                </label>
                <Input
                  id="chapter_number"
                  type="number"
                  min="1"
                  value={formData.chapter_number}
                  onChange={(e) =>
                    handleInputChange("chapter_number", e.target.value)
                  }
                  placeholder="Enter chapter number"
                  required
                />
              </div>
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
                placeholder="Enter chapter description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="difficulty_level" className="text-sm font-medium">
                Difficulty Level
              </label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) =>
                  handleInputChange("difficulty_level", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Chapter Content
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Enter detailed chapter content"
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/subjects/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Chapter"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
