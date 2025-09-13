// components/exams/ChapterSelector.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Search } from "lucide-react";
import { useGetSubjectsQuery } from "../../lib/store/api/subjectsApi";

interface Chapter {
  id: string;
  name: string;
  chapter_number: number;
  difficulty_level: string;
  questions_count: number;
}

interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

interface ChapterSelectorProps {
  selectedChapters: string[];
  onSelectedChaptersChange: (chapters: string[]) => void;
}

export function ChapterSelector({
  selectedChapters,
  onSelectedChaptersChange,
}: ChapterSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const { data: subjectsResponse, isLoading, error } = useGetSubjectsQuery({});

  const subjects = subjectsResponse?.subjects || [];

  const filteredSubjects = subjects.filter((subject) => {
    if (selectedSubject && subject.id !== selectedSubject) return false;

    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.chapters?.some((chapter) =>
        chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const handleChapterToggle = (chapterId: string) => {
    const isSelected = selectedChapters.includes(chapterId);
    if (isSelected) {
      onSelectedChaptersChange(
        selectedChapters.filter((id) => id !== chapterId)
      );
    } else {
      onSelectedChaptersChange([...selectedChapters, chapterId]);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject?.chapters) return;

    const subjectChapterIds = subject.chapters.map((c) => c.id);
    const allSelected = subjectChapterIds.every((id) =>
      selectedChapters.includes(id)
    );

    if (allSelected) {
      // Deselect all chapters from this subject
      onSelectedChaptersChange(
        selectedChapters.filter((id) => !subjectChapterIds.includes(id))
      );
    } else {
      // Select all chapters from this subject
      const newSelected = [...selectedChapters];
      subjectChapterIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      onSelectedChaptersChange(newSelected);
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">
            Failed to load subjects and chapters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects or chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selection Summary */}
      {selectedChapters.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {selectedChapters.length} chapters selected
              </Badge>
              <span className="text-sm text-muted-foreground">
                from{" "}
                {
                  new Set(
                    subjects.flatMap(
                      (s) =>
                        s.chapters
                          ?.filter((c) => selectedChapters.includes(c.id))
                          .map((c) => s.name) || []
                    )
                  ).size
                }{" "}
                subjects
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects and Chapters */}
      <div className="space-y-4">
        {filteredSubjects.map((subject) => {
          const subjectChapterIds = subject.chapters?.map((c) => c.id) || [];
          const selectedInSubject = subjectChapterIds.filter((id) =>
            selectedChapters.includes(id)
          );
          const allSelected =
            subjectChapterIds.length > 0 &&
            selectedInSubject.length === subjectChapterIds.length;
          const someSelected = selectedInSubject.length > 0 && !allSelected;

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={() => handleSubjectToggle(subject.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {subject.chapters?.length || 0} chapters
                      </Badge>
                      {selectedInSubject.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {selectedInSubject.length} selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {subject.chapters && subject.chapters.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subject.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedChapters.includes(chapter.id)}
                          onCheckedChange={() =>
                            handleChapterToggle(chapter.id)
                          }
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              Chapter {chapter.chapter_number}: {chapter.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getDifficultyColor(
                                chapter.difficulty_level
                              )}`}
                            >
                              {chapter.difficulty_level}
                            </Badge>

                            <span className="text-xs text-muted-foreground">
                              {chapter.questions_count} questions
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No subjects or chapters found matching your search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
