// components/exams/ExamCreationForm.tsx
"use client";

import React, { useState } from "react";
import { useCreateExamMutation } from "../../lib/store/api/examsApi";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";
import { useToast } from "../ui/use-toast";
import { QuestionSelectionStep } from "./QuestionSelectionStep";
import { ChapterSelector } from "./ChapterSelector"; // Assuming you have this component

interface NewQuestion {
  question_text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  options: Array<{
    option_text: string;
    is_correct: boolean;
    option_order: number;
  }>;
}

export function ExamCreationForm() {
  const [createExam, { isLoading }] = useCreateExamMutation();
  const { toast } = useToast();
  
  // Basic exam info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState<"self_paced" | "scheduled" | "practice">("self_paced");
  
  // Question selection
  const [questionSelectionMethod, setQuestionSelectionMethod] = useState<"random" | "manual" | "mixed">("random");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
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
  
  // Scheduled exam settings
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChapters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one chapter",
        variant: "destructive",
      });
      return;
    }

    // Validate question selection
    if (questionSelectionMethod === "manual") {
      const totalAvailable = selectedQuestions.length + newQuestions.length;
      if (totalAvailable < totalQuestions) {
        toast({
          title: "Validation Error",
          description: `Need ${totalQuestions - totalAvailable} more questions for manual selection`,
          variant: "destructive",
        });
        return;
      }
    } else if (questionSelectionMethod === "mixed") {
      const manualCount = selectedQuestions.length + newQuestions.length;
      if (manualCount + randomQuestionsCount !== totalQuestions) {
        toast({
          title: "Validation Error",
          description: "Manual questions + random questions must equal total questions",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate new questions
    for (const question of newQuestions) {
      if (!question.question_text.trim()) {
        toast({
          title: "Validation Error",
          description: "All new questions must have question text",
          variant: "destructive",
        });
        return;
      }

      const correctOptions = question.options.filter(opt => opt.is_correct);
      if (correctOptions.length !== 1) {
        toast({
          title: "Validation Error",
          description: "Each question must have exactly one correct option",
          variant: "destructive",
        });
        return;
      }

      const emptyOptions = question.options.filter(opt => !opt.option_text.trim());
      if (emptyOptions.length > 0) {
        toast({
          title: "Validation Error",
          description: "All options must have text",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const examData = {
        title,
        description,
        exam_type: examType,
        chapters: selectedChapters,
        question_selection_method: questionSelectionMethod,
        selected_questions: selectedQuestions,
        new_questions: newQuestions,
        random_questions_count: randomQuestionsCount,
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

      // Reset form or redirect
      // window.location.href = "/exams";
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to create exam",
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
              <Select value={examType} onValueChange={setExamType}>
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

            <div>
              <Label>Question Selection Method</Label>
              <RadioGroup
                value={questionSelectionMethod}
                onValueChange={setQuestionSelectionMethod}
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
                onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
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
                onChange={(e) => setMarksPerQuestion(parseFloat(e.target.value) || 1)}
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
                onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 60)}
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
                onCheckedChange={setNegativeMarking}
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
                onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
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
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="isPublic">Public Exam</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresSubscription"
                  checked={requiresSubscription}
                  onCheckedChange={setRequiresSubscription}
                />
                <Label htmlFor="requiresSubscription">Requires Subscription</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowRetakes"
                  checked={allowRetakes}
                  onCheckedChange={setAllowRetakes}
                />
                <Label htmlFor="allowRetakes">Allow Retakes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="randomizeQuestions"
                  checked={randomizeQuestions}
                  onCheckedChange={setRandomizeQuestions}
                />
                <Label htmlFor="randomizeQuestions">Randomize Questions</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
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