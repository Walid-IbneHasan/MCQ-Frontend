// components/exams/ExamEditForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUpdateExamMutation } from "../../lib/store/api/examsApi";
import type { Exam } from "../../lib/store/api/examsApi";
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
import { useToast } from "../ui/use-toast";
import { RotateCcw } from "lucide-react";

interface ExamEditFormProps {
  exam: Exam;
}

export function ExamEditForm({ exam }: ExamEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [updateExam, { isLoading }] = useUpdateExamMutation();

  // Form state
  const [title, setTitle] = useState(exam.title);
  const [description, setDescription] = useState(exam.description);
  const [examType, setExamType] = useState<
    "self_paced" | "scheduled" | "practice"
  >(exam.exam_type);
  const [totalQuestions, setTotalQuestions] = useState(exam.total_questions);
  const [duration, setDuration] = useState(exam.duration_minutes);
  const [marksPerQuestion, setMarksPerQuestion] = useState(
    exam.marks_per_question
  );
  const [negativeMarking, setNegativeMarking] = useState(
    exam.negative_marking_enabled
  );
  const [negativeMarks, setNegativeMarks] = useState(exam.negative_marks);
  const [passingPercentage, setPassingPercentage] = useState(
    exam.passing_percentage
  );
  const [isPublic, setIsPublic] = useState(exam.is_public);
  const [requiresSubscription, setRequiresSubscription] = useState(
    exam.requires_subscription
  );
  const [allowRetakes, setAllowRetakes] = useState(exam.allow_retakes);
  const [maxAttempts, setMaxAttempts] = useState(exam.max_attempts);
  const [scheduledStart, setScheduledStart] = useState(
    exam.scheduled_start
      ? new Date(exam.scheduled_start).toISOString().slice(0, 16)
      : ""
  );
  const [scheduledEnd, setScheduledEnd] = useState(
    exam.scheduled_end
      ? new Date(exam.scheduled_end).toISOString().slice(0, 16)
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateData: any = {
        title,
        description,
        exam_type: examType,
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
      };

      if (examType === "scheduled") {
        updateData.scheduled_start = scheduledStart;
        updateData.scheduled_end = scheduledEnd;
      }

      await updateExam({
        id: exam.id,
        data: updateData,
      }).unwrap();

      toast({
        title: "Success",
        description: "Exam updated successfully!",
        variant: "default",
      });

      router.push(`/exams/${exam.id}`);
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description:
          error?.data?.error || "Failed to update exam. Please try again.",
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
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_paced">Self Paced</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                </SelectContent>
              </Select>
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
                step="0.05"
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
                step="0.05"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note about questions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To modify exam questions, chapters, or
            question selection settings, please create a new exam. Question
            modification for existing exams is not supported to maintain exam
            integrity and student history.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/exams/${exam.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Exam"
          )}
        </Button>
      </div>
    </form>
  );
}
