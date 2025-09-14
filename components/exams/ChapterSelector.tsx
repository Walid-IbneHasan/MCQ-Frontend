// components/exams/ChapterSelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Search, Loader2 } from "lucide-react";
import { useGetSubjectsQuery } from "../../lib/store/api/subjectsApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../lib/store";
import type { Chapter } from "../../types/subjects";

interface ChapterSelectorProps {
  selectedChapters: string[];
  onSelectedChaptersChange: (chapters: string[]) => void;
  // NEW: let parent receive the full list so new-question UI can present chapters
  onAvailableChaptersChange?: (chapters: Chapter[]) => void;
}

export function ChapterSelector({
  selectedChapters,
  onSelectedChaptersChange,
  onAvailableChaptersChange,
}: ChapterSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const {
    data: subjectsResponse,
    isLoading: isLoadingSubjects,
    error: subjectsError,
  } = useGetSubjectsQuery({});

  const subjects = subjectsResponse?.subjects || [];

  useEffect(() => {
    const loadChapters = async () => {
      if (selectedSubjects.size === 0) {
        setAvailableChapters([]);
        onAvailableChaptersChange?.([]);
        return;
      }

      if (!accessToken) {
        console.error("ChapterSelector: No access token available");
        return;
      }

      setIsLoadingChapters(true);
      const allChapters: Chapter[] = [];

      try {
        for (const subjectId of selectedSubjects) {
          const url = `http://127.0.0.1:8000/api/subjects/subjects/${subjectId}/chapters/`;

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const responseText = await response.text();

            try {
              const data = JSON.parse(responseText);

              if (
                data &&
                data.success === true &&
                data.chapters &&
                Array.isArray(data.chapters)
              ) {
                const mappedChapters: Chapter[] = data.chapters.map(
                  (chapter: any) => ({
                    id: chapter.id,
                    subject: chapter.subject,
                    subject_name: chapter.subject_name,
                    name: chapter.name,
                    description: chapter.description,
                    chapter_number: chapter.chapter_number,
                    is_active: chapter.is_active,
                    difficulty_level: chapter.difficulty_level as
                      | "beginner"
                      | "intermediate"
                      | "advanced",
                    content: chapter.content,
                    questions_count: chapter.questions_count,
                    exams_count: chapter.exams_count,
                    created_at: chapter.created_at,
                    updated_at: chapter.updated_at,
                  })
                );

                allChapters.push(...mappedChapters);
              } else {
                console.warn(
                  "ChapterSelector: Invalid response structure for",
                  subjectId,
                  data
                );
              }
            } catch (parseError) {
              console.error(
                "ChapterSelector: JSON parse error for",
                subjectId,
                parseError
              );
            }
          } else {
            const errorText = await response.text();
            console.error(
              `ChapterSelector: HTTP Error ${response.status} for ${subjectId}:`,
              errorText
            );
          }
        }

        setAvailableChapters(allChapters);
        onAvailableChaptersChange?.(allChapters); // NEW
      } catch (error) {
        console.error("ChapterSelector: Unexpected error:", error);
      } finally {
        setIsLoadingChapters(false);
      }
    };

    loadChapters();
  }, [selectedSubjects, accessToken, onAvailableChaptersChange]);

  const filteredSubjects = subjects.filter((subject: any) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChapters = availableChapters.filter((chapter) => {
    const q = searchTerm.toLowerCase();
    return (
      chapter.name.toLowerCase().includes(q) ||
      chapter.subject_name.toLowerCase().includes(q)
    );
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
    const next = new Set(selectedSubjects);
    if (next.has(subjectId)) next.delete(subjectId);
    else next.add(subjectId);
    setSelectedSubjects(next);
  };

  const handleSelectAllFromSubject = (subjectId: string) => {
    const subjectChapters = availableChapters
      .filter((chapter) => chapter.subject === subjectId)
      .map((chapter) => chapter.id);

    const allSelected = subjectChapters.every((id) =>
      selectedChapters.includes(id)
    );

    if (allSelected) {
      onSelectedChaptersChange(
        selectedChapters.filter((id) => !subjectChapters.includes(id))
      );
    } else {
      const newSelected = [...selectedChapters];
      subjectChapters.forEach((id) => {
        if (!newSelected.includes(id)) newSelected.push(id);
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

  if (isLoadingSubjects) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading subjects...</span>
      </div>
    );
  }

  if (subjectsError) {
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
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects or chapters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                from {selectedSubjects.size} subjects
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Select Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubjects.map((subject: any) => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={selectedSubjects.has(subject.id)}
                  onCheckedChange={() => handleSubjectToggle(subject.id)}
                />
                <Label
                  htmlFor={`subject-${subject.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {subject.code} • {subject.chapters_count || 0} chapters
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No subjects found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Chapter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Select Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingChapters && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading chapters for selected subjects...</span>
            </div>
          )}

          {selectedChapters.length === 0 &&
            selectedSubjects.size > 0 &&
            !isLoadingChapters &&
            availableChapters.length > 0 && (
              <div className="text-sm text-muted-foreground pb-2">
                Tip: Select specific chapters below. New questions will let you
                choose among these chapters too.
              </div>
            )}

          {!isLoadingChapters && availableChapters.length > 0 && (
            <div className="space-y-4">
              {Array.from(selectedSubjects).map((subjectId) => {
                const subject = subjects.find((s: any) => s.id === subjectId);
                const subjectChapters = availableChapters.filter(
                  (c) => c.subject === subjectId
                );

                if (subjectChapters.length === 0) return null;

                const allSelected = subjectChapters.every((c) =>
                  selectedChapters.includes(c.id)
                );
                const someSelected = subjectChapters.some((c) =>
                  selectedChapters.includes(c.id)
                );

                return (
                  <div key={subjectId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={() =>
                            handleSelectAllFromSubject(subjectId)
                          }
                          id={`subject-toggle-${subjectId}`}
                        />
                        <Label
                          className="font-medium"
                          htmlFor={`subject-toggle-${subjectId}`}
                        >
                          {subject?.name} ({subjectChapters.length} chapters)
                        </Label>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {
                          subjectChapters.filter((c) =>
                            selectedChapters.includes(c.id)
                          ).length
                        }{" "}
                        selected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subjectChapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                        >
                          <Checkbox
                            id={`chapter-${chapter.id}`}
                            checked={selectedChapters.includes(chapter.id)}
                            onCheckedChange={() =>
                              handleChapterToggle(chapter.id)
                            }
                          />
                          <Label
                            htmlFor={`chapter-${chapter.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Ch. {chapter.chapter_number}: {chapter.name}
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
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedChapters.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900">
                Selected: {selectedChapters.length} chapters
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Total questions available will depend on selected chapters.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
