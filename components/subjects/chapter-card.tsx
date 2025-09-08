// components/subjects/chapter-card.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Chapter } from "../../types/subjects";
import { useDeleteChapterMutation } from "../../lib/store/api/subjectsApi";
import { useToastContext } from "../../lib/providers/toast-provider";

interface ChapterCardProps {
  chapter: Chapter;
  isCompact?: boolean;
  showActions?: boolean;
}

export function ChapterCard({
  chapter,
  isCompact = false,
  showActions = false,
}: ChapterCardProps) {
  const { toast } = useToastContext();
  const [deleteChapter, { isLoading: isDeleting }] = useDeleteChapterMutation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${chapter.name}"?`)) {
      try {
        await deleteChapter(chapter.id).unwrap();
        toast({
          title: "Success",
          description: "Chapter deleted successfully",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete chapter",
          variant: "destructive",
        });
      }
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className={isCompact ? "pb-3" : undefined}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate flex items-center gap-2">
                Chapter {chapter.chapter_number}: {chapter.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${getDifficultyColor(
                    chapter.difficulty_level
                  )}`}
                >
                  {chapter.difficulty_level}
                </Badge>
                {!isCompact && (
                  <span className="text-xs text-muted-foreground">
                    {chapter.subject_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/chapters/${chapter.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/chapters/${chapter.id}/stats`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {!isCompact && (
          <CardDescription className="line-clamp-2">
            {chapter.description || "No description available"}
          </CardDescription>
        )}
      </CardHeader>

      {!isCompact && (
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {chapter.questions_count} questions
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {chapter.exams_count} exams
            </span>
          </div>
        </CardContent>
      )}

      <CardFooter className={isCompact ? "pt-0" : undefined}>
        <div className="flex gap-2 w-full">
          <Button asChild className="flex-1">
            <Link href={`/chapters/${chapter.id}`}>
              {isCompact ? "View" : "View Details"}
            </Link>
          </Button>
          <Button asChild variant="outline" size={isCompact ? "sm" : "default"}>
            <Link href={`/chapters/${chapter.id}/questions`}>Questions</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
