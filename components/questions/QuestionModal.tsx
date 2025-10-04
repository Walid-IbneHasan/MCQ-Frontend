// components/questions/QuestionModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useGetQuestionQuery,
} from "../../lib/store/api/questionsApi";
import { useGetSubjectsQuery } from "../../lib/store/api/subjectsApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
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
import { Loader2, Trash2, Plus } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../../lib/store";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  questionId?: string | null;
}

export function QuestionModal({
  isOpen,
  onClose,
  mode,
  questionId,
}: QuestionModalProps) {
  const { toast } = useToast();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [createQuestion, { isLoading: isCreating }] =
    useCreateQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] =
    useUpdateQuestionMutation();

  const { data: questionData, isLoading: isLoadingQuestion } =
    useGetQuestionQuery(questionId || "", {
      skip: !questionId || mode === "create",
    });

  const { data: subjectsData } = useGetSubjectsQuery({});
  const subjects = subjectsData?.subjects || [];

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [chapters, setChapters] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    chapter: "",
    question_text: "",
    explanation: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    marks: 1,
    negative_marks: 0.25,
    allow_negative_marking: true,
  });

  const [options, setOptions] = useState([
    { option_text: "", is_correct: false, option_order: 1 },
    { option_text: "", is_correct: false, option_order: 2 },
    { option_text: "", is_correct: false, option_order: 3 },
    { option_text: "", is_correct: false, option_order: 4 },
  ]);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Load question data for edit mode
  useEffect(() => {
    if (mode === "edit" && questionData) {
      const q = questionData;
      setFormData({
        chapter: q.chapter,
        question_text: q.question_text,
        explanation: q.explanation || "",
        difficulty: q.difficulty,
        marks: q.marks,
        negative_marks: q.negative_marks,
        allow_negative_marking: q.allow_negative_marking,
      });
      setOptions(
        q.options.map((opt: any) => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          option_order: opt.option_order,
        }))
      );
      setTags(q.tags?.map((t: any) => t.name) || []);
      setSelectedSubject(q.chapter_detail?.subject || "");
    }
  }, [questionData, mode]);

  // Fetch chapters when subject changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (selectedSubject && accessToken) {
        try {
          const response = await fetch(
            `http://127.0.0.1:8000/api/subjects/subjects/${selectedSubject}/chapters/`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const data = await response.json();
          setChapters(data.chapters || []);
        } catch (error) {
          setChapters([]);
        }
      }
    };
    fetchChapters();
  }, [selectedSubject, accessToken]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddOption = () => {
    setOptions([
      ...options,
      { option_text: "", is_correct: false, option_order: options.length + 1 },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const updated = [...options];
    if (field === "is_correct" && value) {
      // Only one correct answer
      updated.forEach((opt, i) => {
        opt.is_correct = i === index;
      });
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.chapter) {
      toast({
        title: "Validation Error",
        description: "Please select a chapter",
        variant: "destructive",
      });
      return;
    }

    if (options.filter((o) => o.option_text.trim()).length < 2) {
      toast({
        title: "Validation Error",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    if (!options.some((o) => o.is_correct)) {
      toast({
        title: "Validation Error",
        description: "Please mark one option as correct",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      options: options
        .filter((o) => o.option_text.trim())
        .map((o, i) => ({
          option_text: o.option_text,
          is_correct: o.is_correct,
          option_order: i + 1,
        })),
      tags,
    };

    try {
      if (mode === "create") {
        await createQuestion(payload).unwrap();
        toast({
          title: "Success",
          description: "Question created successfully",
        });
      } else {
        await updateQuestion({
          id: questionId!,
          data: payload,
        }).unwrap();
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      chapter: "",
      question_text: "",
      explanation: "",
      difficulty: "medium",
      marks: 1,
      negative_marks: 0.25,
      allow_negative_marking: true,
    });
    setOptions([
      { option_text: "", is_correct: false, option_order: 1 },
      { option_text: "", is_correct: false, option_order: 2 },
      { option_text: "", is_correct: false, option_order: 3 },
      { option_text: "", is_correct: false, option_order: 4 },
    ]);
    setTags([]);
    setSelectedSubject("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Question" : "Edit Question"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingQuestion && mode === "edit" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject & Chapter Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject *</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Chapter *</Label>
                <Select
                  value={formData.chapter}
                  onValueChange={(val) =>
                    setFormData({ ...formData, chapter: val })
                  }
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter: any) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        Ch. {chapter.chapter_number}: {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <Label>Question Text *</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) =>
                  setFormData({ ...formData, question_text: e.target.value })
                }
                placeholder="Enter question text..."
                rows={3}
                required
              />
            </div>

            {/* Explanation */}
            <div>
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Explain the correct answer..."
                rows={2}
              />
            </div>

            {/* Options */}
            <div>
              <Label>Options *</Label>
              <div className="space-y-2 mt-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Checkbox
                      checked={option.is_correct}
                      onCheckedChange={(checked) =>
                        handleOptionChange(index, "is_correct", checked)
                      }
                    />
                    <Input
                      value={option.option_text}
                      onChange={(e) =>
                        handleOptionChange(index, "option_text", e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>

            {/* Difficulty & Marks */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(val: any) =>
                    setFormData({ ...formData, difficulty: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Marks *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marks: parseFloat(e.target.value),
                    })
                  }
                  min="0.1"
                  required
                />
              </div>

              <div>
                <Label>Negative Marks</Label>
                <Input
                  type="number"
                  step="0.05"
                  value={formData.negative_marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      negative_marks: parseFloat(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTag())
                  }
                  placeholder="Add tag..."
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                  >
                    <span className="text-sm">{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {mode === "create" ? "Create Question" : "Update Question"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
