// components/exams/ExamCreationForm.tsx
"use client";

import React, { useState } from "react";
import { useCreateExamMutation } from "../../lib/store/api/examsApi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useToast } from "../ui/use-toast";
import { QuestionSelectionStep } from "./QuestionSelectionStep";
import { ChapterSelector } from "./ChapterSelector";
import type { Chapter } from "../../types/subjects";
import { useSelector } from "react-redux";
import type { RootState } from "../../lib/store";

interface NewQuestion {
  id?: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negative_marks: number;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    option_order: number;
  }>;
  chapter?: string; // NEW: assign to a chapter
  include_in_exam?: boolean; // NEW: include in this exam
}

export function ExamCreationForm() {
  const [createExam, { isLoading }] = useCreateExamMutation();
  const { toast } = useToast();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  // Basic exam info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState<
    "self_paced" | "scheduled" | "practice"
  >("self_paced");

  // Chapters
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chaptersCatalog, setChaptersCatalog] = useState<Chapter[]>([]); // NEW

  // Question selection
  const [questionSelectionMethod, setQuestionSelectionMethod] = useState<
    "random" | "manual" | "mixed"
  >("random");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [newQuestions, setNewQuestions] = useState<NewQuestion[]>([]);
  const [randomQuestionsCount, setRandomQuestionsCount] = useState(0);

  // Exam configuration
  const [totalQuestions, setTotalQuestions] = useState(50);
  const [duration, setDuration] = useState(60);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [passingPercentage, setPassingPercentage] = useState(60);

  // Exam settings
  const [isPublic, setIsPublic] = useState(true);
  const [requiresSubscription, setRequiresSubscription] = useState(true);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);

  // Scheduled
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const chapterLabel = (id: string) => {
    const c = chaptersCatalog.find((x) => x.id === id);
    if (!c) return id;
    return `${c.subject_name} — Ch. ${c.chapter_number}: ${c.name}`;
  };

  const includeNewCount = () =>
    newQuestions.filter((q) => q.include_in_exam !== false).length;

  const validateBeforeSubmit = () => {
    if (selectedChapters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one chapter",
        variant: "destructive",
      });
      return false;
    }

    // count only those new questions that are marked to include
    const manualIncluded = selectedQuestions.length + includeNewCount();

    if (questionSelectionMethod === "manual") {
      if (manualIncluded < totalQuestions) {
        toast({
          title: "Validation Error",
          description: `Need ${
            totalQuestions - manualIncluded
          } more questions for manual selection`,
          variant: "destructive",
        });
        return false;
      }
    } else if (questionSelectionMethod === "mixed") {
      if (manualIncluded + randomQuestionsCount !== totalQuestions) {
        toast({
          title: "Validation Error",
          description:
            "Manual questions + random questions must equal total questions",
          variant: "destructive",
        });
        return false;
      }
    }

    for (const q of newQuestions) {
      if (!q.question_text.trim()) {
        toast({
          title: "Validation Error",
          description: "All new questions must have question text",
          variant: "destructive",
        });
        return false;
      }
      if (!q.chapter) {
        toast({
          title: "Validation Error",
          description: "Each new question must be assigned to a chapter.",
          variant: "destructive",
        });
        return false;
      }
      const correct = q.options.filter((o) => o.is_correct);
      if (correct.length !== 1) {
        toast({
          title: "Validation Error",
          description: "Each new question must have exactly one correct option",
          variant: "destructive",
        });
        return false;
      }
      const empty = q.options.filter((o) => !o.option_text.trim());
      if (empty.length > 0) {
        toast({
          title: "Validation Error",
          description: "All options must have text",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  /**
   * Create new questions first and return their IDs in the same order
   * we iterated (so index aligns with newQuestions).
   */
  const createNewQuestionsIfAny = async (): Promise<string[]> => {
    if (!accessToken || newQuestions.length === 0) return [];

    const createdIds: string[] = [];

    for (const q of newQuestions) {
      const payload = {
        chapter: q.chapter!,
        question_text: q.question_text,
        question_image: null,
        explanation: "",
        difficulty: q.difficulty,
        marks: q.marks,
        negative_marks: q.negative_marks,
        allow_negative_marking: true,
        options: q.options.map((opt) => ({
          option_text: opt.option_text,
          option_image: null,
          option_order: opt.option_order,
          is_correct: opt.is_correct,
        })),
        tags: [],
      };

      const res = await fetch(
        "http://127.0.0.1:8000/api/questions/questions/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Question create failed (${res.status}): ${text}`);
      }
      const data = await res.json();
      // ✅ your API returns { success, message, question: { id: ... } }
      const id =
        String(data?.question?.id ?? data?.id ?? data?.question_id ?? "") || "";
      if (!id) {
        throw new Error("Question created but no id returned in response");
      }
      createdIds.push(id);
    }

    return createdIds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;

    try {
      // 1) Create new questions first
      const createdNewQuestionIds = await createNewQuestionsIfAny();

      // 2) Include only those toggled ON
      const includeNewIds = createdNewQuestionIds.filter((_, idx) => {
        const original = newQuestions[idx];
        return original.include_in_exam !== false;
      });

      // 3) Final selected IDs
      const questionIds = [...selectedQuestions, ...includeNewIds];

      // 4) Build payload
      const examData: any = {
        title,
        description,
        exam_type: examType,
        chapters: selectedChapters,
        question_selection_method: questionSelectionMethod,
        total_questions: totalQuestions,
        duration_minutes: duration,
        marks_per_question: marksPerQuestion,
        negative_marking_enabled: negativeMarking,
        negative_marks: negativeMarks,
        passing_percentage: passingPercentage,
        is_public: isPublic,
        requires_subscription: requiresSubscription,
        allow_retakes: allowRetakes,
        max_attempts: maxAttempts,
        randomize_questions: randomizeQuestions,
        random_questions_count: randomQuestionsCount,
        // IMPORTANT: send selected question IDs under multiple common keys
        selected_questions: questionIds,
        selected_question_ids: questionIds,
        questions: questionIds,
        ...(examType === "scheduled" && {
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
        }),
      };

      await createExam(examData).unwrap();

      toast({
        title: "Success",
        description: "Exam created successfully!",
        variant: "default",
      });

      // window.location.href = "/exams";
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.message || error?.data?.error || "Failed to create exam",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Exam Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter exam title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter exam description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Exam Type</Label>
              <Select
                value={examType}
                onValueChange={(v: "self_paced" | "scheduled" | "practice") =>
                  setExamType(v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_paced">Self Paced</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Question Selection Method</Label>
              <RadioGroup
                value={questionSelectionMethod}
                onValueChange={(v: "random" | "manual" | "mixed") =>
                  setQuestionSelectionMethod(v)
                }
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random">Random</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Manual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed">Mixed</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {examType === "scheduled" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label htmlFor="scheduledStart">Start Time *</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  required={examType === "scheduled"}
                />
              </div>
              <div>
                <Label htmlFor="scheduledEnd">End Time *</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  required={examType === "scheduled"}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chapter Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterSelector
            selectedChapters={selectedChapters}
            onSelectedChaptersChange={setSelectedChapters}
            onAvailableChaptersChange={setChaptersCatalog} // NEW
          />
        </CardContent>
      </Card>

      {/* Question Selection */}
      {selectedChapters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionSelectionStep
              selectedChapters={selectedChapters}
              questionSelectionMethod={questionSelectionMethod}
              totalQuestions={totalQuestions}
              selectedQuestions={selectedQuestions}
              newQuestions={newQuestions}
              randomQuestionsCount={randomQuestionsCount}
              onSelectedQuestionsChange={setSelectedQuestions}
              onNewQuestionsChange={setNewQuestions}
              onRandomQuestionsCountChange={setRandomQuestionsCount}
              chaptersCatalog={chaptersCatalog}
              chapterLabel={chapterLabel}
            />
          </CardContent>
        </Card>
      )}

      {/* Exam Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalQuestions">Total Questions *</Label>
              <Input
                id="totalQuestions"
                type="number"
                value={totalQuestions}
                onChange={(e) =>
                  setTotalQuestions(parseInt(e.target.value) || 1)
                }
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="marksPerQuestion">Marks per Question</Label>
              <Input
                id="marksPerQuestion"
                type="number"
                step="0.1"
                value={marksPerQuestion}
                onChange={(e) =>
                  setMarksPerQuestion(parseFloat(e.target.value) || 1)
                }
                min="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
              <Input
                id="passingPercentage"
                type="number"
                value={passingPercentage}
                onChange={(e) =>
                  setPassingPercentage(parseInt(e.target.value) || 60)
                }
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="maxAttempts">Max Attempts (0 = unlimited)</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="negativeMarking"
                checked={negativeMarking}
                onCheckedChange={(checked) => setNegativeMarking(!!checked)}
              />
              <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
            </div>
          </div>

          {negativeMarking && (
            <div className="w-48">
              <Label htmlFor="negativeMarks">Negative Marks</Label>
              <Input
                id="negativeMarks"
                type="number"
                step="0.1"
                value={negativeMarks}
                onChange={(e) =>
                  setNegativeMarks(parseFloat(e.target.value) || 0)
                }
                min="0"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(!!checked)}
                />
                <Label htmlFor="isPublic">Public Exam</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresSubscription"
                  checked={requiresSubscription}
                  onCheckedChange={(checked) =>
                    setRequiresSubscription(!!checked)
                  }
                />
                <Label htmlFor="requiresSubscription">
                  Requires Subscription
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowRetakes"
                  checked={allowRetakes}
                  onCheckedChange={(checked) => setAllowRetakes(!!checked)}
                />
                <Label htmlFor="allowRetakes">Allow Retakes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="randomizeQuestions"
                  checked={randomizeQuestions}
                  onCheckedChange={(checked) =>
                    setRandomizeQuestions(!!checked)
                  }
                />
                <Label htmlFor="randomizeQuestions">Randomize Questions</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Exam"}
        </Button>
      </div>
    </form>
  );
}
