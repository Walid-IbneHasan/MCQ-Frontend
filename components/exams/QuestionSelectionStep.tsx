// components/exams/QuestionSelectionStep.tsx
"use client";

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useGetChapterQuestionsMutation } from "../../lib/store/api/examsApi";
import type { Chapter } from "../../types/subjects";

interface Question {
  id: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  chapter_name: string;
  options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    option_order: number;
  }>;
}

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
  chapter?: string;
  include_in_exam?: boolean;
}

interface QuestionSelectionStepProps {
  selectedChapters: string[];
  questionSelectionMethod: "random" | "manual" | "mixed";
  totalQuestions: number;
  selectedQuestions: string[];
  newQuestions: NewQuestion[];
  randomQuestionsCount: number;
  onSelectedQuestionsChange: (questions: string[]) => void;
  onNewQuestionsChange: (questions: NewQuestion[]) => void;
  onRandomQuestionsCountChange: (count: number) => void;
  chaptersCatalog: Chapter[];
  chapterLabel?: (id: string) => string;
}

export function QuestionSelectionStep({
  selectedChapters,
  questionSelectionMethod,
  totalQuestions,
  selectedQuestions,
  newQuestions,
  randomQuestionsCount,
  onSelectedQuestionsChange,
  onNewQuestionsChange,
  onRandomQuestionsCountChange,
  chaptersCatalog,
  chapterLabel,
}: QuestionSelectionStepProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedChapter, setSelectedChapter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");

  const [
    getChapterQuestions,
    { data: chaptersQuestionsResponse, isLoading, error },
  ] = useGetChapterQuestionsMutation();

  React.useEffect(() => {
    if (selectedChapters.length > 0) {
      getChapterQuestions({ chapter_ids: selectedChapters });
    }
  }, [selectedChapters, getChapterQuestions]);

  const chaptersQuestions: Record<
    string,
    { count: number; questions: Question[]; chapter_name?: string }
  > = chaptersQuestionsResponse?.chapters_questions || {};

  const handleQuestionToggle = (questionId: string) => {
    const isSelected = selectedQuestions.includes(questionId);
    if (isSelected) {
      onSelectedQuestionsChange(
        selectedQuestions.filter((id) => id !== questionId)
      );
    } else {
      onSelectedQuestionsChange([...selectedQuestions, questionId]);
    }
  };

  const handleAddNewQuestion = () => {
    const nq: NewQuestion = {
      id: `new-${Date.now()}`,
      question_text: "",
      difficulty: "medium",
      marks: 1,
      negative_marks: 0.25,
      options: [
        { option_text: "", is_correct: false, option_order: 1 },
        { option_text: "", is_correct: false, option_order: 2 },
        { option_text: "", is_correct: false, option_order: 3 },
        { option_text: "", is_correct: false, option_order: 4 },
      ],
      chapter: selectedChapters.length === 1 ? selectedChapters[0] : undefined,
      include_in_exam: true,
    };
    onNewQuestionsChange([...newQuestions, nq]);
  };

  const handleNewQuestionChange = (
    index: number,
    field: keyof NewQuestion,
    value: any
  ) => {
    const updated = [...newQuestions];
    updated[index] = { ...updated[index], [field]: value };
    onNewQuestionsChange(updated);
  };

  const handleNewQuestionOptionChange = (
    questionIndex: number,
    optionIndex: number,
    field: "option_text" | "is_correct",
    value: any
  ) => {
    const updated = [...newQuestions];
    updated[questionIndex].options[optionIndex] = {
      ...updated[questionIndex].options[optionIndex],
      [field]: value,
    };
    onNewQuestionsChange(updated);
  };

  const handleDeleteNewQuestion = (index: number) => {
    const updated = newQuestions.filter((_, i) => i !== index);
    onNewQuestionsChange(updated);
  };

  const filteredQuestions = React.useMemo(() => {
    let allQuestions: Question[] = [];

    Object.entries(chaptersQuestions).forEach(([chapterId, data]) => {
      if (selectedChapter === "all" || selectedChapter === chapterId) {
        allQuestions = [...allQuestions, ...(data.questions || [])];
      }
    });

    return allQuestions.filter((question) => {
      const matchesSearch = question.question_text
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === "all" ||
        question.difficulty === (difficultyFilter as any);
      return matchesSearch && matchesDifficulty;
    });
  }, [chaptersQuestions, selectedChapter, searchTerm, difficultyFilter]);

  const manualIncludedCount =
    selectedQuestions.length +
    newQuestions.filter((q) => q.include_in_exam !== false).length;

  const summary =
    questionSelectionMethod === "manual"
      ? {
          selected: manualIncludedCount,
          required: totalQuestions,
          isValid: manualIncludedCount >= totalQuestions,
          message:
            manualIncludedCount < totalQuestions
              ? `Need ${totalQuestions - manualIncludedCount} more questions`
              : manualIncludedCount > totalQuestions
              ? `${
                  manualIncludedCount - totalQuestions
                } extra questions (only first ${totalQuestions} will be used)`
              : "Perfect! You have the right number of questions",
        }
      : questionSelectionMethod === "mixed"
      ? {
          selected: manualIncludedCount,
          random: randomQuestionsCount,
          total: manualIncludedCount + randomQuestionsCount,
          required: totalQuestions,
          isValid:
            manualIncludedCount + randomQuestionsCount === totalQuestions,
          message:
            manualIncludedCount + randomQuestionsCount !== totalQuestions
              ? `Manual (${manualIncludedCount}) + Random (${randomQuestionsCount}) must equal ${totalQuestions}`
              : "Perfect balance!",
        }
      : null;

  if (questionSelectionMethod === "random") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Random Question Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Questions will be randomly selected from the chosen chapters during
            exam creation. No manual selection needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const newQuestionChapterChoices = chaptersCatalog.filter((c) =>
    selectedChapters.includes(c.id)
  );

  return (
    <div className="space-y-6">
      {summary && (
        <Card
          className={summary.isValid ? "border-green-200" : "border-red-200"}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {summary.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={summary.isValid ? "text-green-700" : "text-red-700"}
              >
                {summary.message}
              </span>
            </div>

            {questionSelectionMethod === "mixed" && (
              <div className="mt-2">
                <Label>Random Questions Count:</Label>
                <Input
                  type="number"
                  value={randomQuestionsCount}
                  onChange={(e) =>
                    onRandomQuestionsCountChange(parseInt(e.target.value) || 0)
                  }
                  min="0"
                  max={totalQuestions - manualIncludedCount}
                  className="w-32 mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="existing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Select Existing Questions</TabsTrigger>
          <TabsTrigger value="new">Add New Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Search Questions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Chapter</Label>
                  <Select
                    value={selectedChapter}
                    onValueChange={setSelectedChapter}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="All chapters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {Object.entries(chaptersQuestions).map(
                        ([chapterId, data]) => (
                          <SelectItem key={chapterId} value={chapterId}>
                            {data.chapter_name ? data.chapter_name : "Chapter"}{" "}
                            ({data.count} questions)
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={difficultyFilter}
                    onValueChange={setDifficultyFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load questions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() =>
                          handleQuestionToggle(question.id)
                        }
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {question.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.marks} marks
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {question.chapter_name}
                          </span>
                        </div>

                        <p className="text-sm line-clamp-2 mb-2">
                          {question.question_text}
                        </p>

                        <div className="text-xs text-muted-foreground">
                          {question.options.length} options
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => {}}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredQuestions.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No questions found matching your criteria
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Add New Questions</h3>
            <Button onClick={handleAddNewQuestion} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-6">
            {newQuestions.map((question, questionIndex) => (
              <Card key={question.id} className="border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      New Question {questionIndex + 1}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNewQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) =>
                        handleNewQuestionChange(
                          questionIndex,
                          "question_text",
                          e.target.value
                        )
                      }
                      placeholder="Enter your question..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Difficulty</Label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value: "easy" | "medium" | "hard") =>
                          handleNewQuestionChange(
                            questionIndex,
                            "difficulty",
                            value
                          )
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
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={question.marks}
                        onChange={(e) =>
                          handleNewQuestionChange(
                            questionIndex,
                            "marks",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        min="0.1"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label>Negative Marks</Label>
                      <Input
                        type="number"
                        value={question.negative_marks}
                        onChange={(e) =>
                          handleNewQuestionChange(
                            questionIndex,
                            "negative_marks",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <Label>Chapter *</Label>
                      <Select
                        value={question.chapter ?? "unset"}
                        onValueChange={(value) =>
                          handleNewQuestionChange(
                            questionIndex,
                            "chapter",
                            value === "unset" ? undefined : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unset" disabled>
                            Select chapter…
                          </SelectItem>
                          {newQuestionChapterChoices.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {chapterLabel
                                ? chapterLabel(c.id)
                                : `${c.subject_name} — Ch. ${c.chapter_number}: ${c.name}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={question.include_in_exam !== false}
                      onCheckedChange={(checked) =>
                        handleNewQuestionChange(
                          questionIndex,
                          "include_in_exam",
                          !!checked
                        )
                      }
                    />
                    <Label>Include this question in this exam</Label>
                  </div>

                  <div>
                    <Label>Options *</Label>
                    <div className="space-y-3 mt-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex gap-3 items-center"
                        >
                          <div className="flex items-center">
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                handleNewQuestionOptionChange(
                                  questionIndex,
                                  optionIndex,
                                  "is_correct",
                                  !!checked
                                )
                              }
                            />
                            <Label className="ml-2 text-sm">Correct</Label>
                          </div>
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option.option_text}
                            onChange={(e) =>
                              handleNewQuestionOptionChange(
                                questionIndex,
                                optionIndex,
                                "option_text",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {newQuestions.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No new questions added yet. Click "Add Question" to create
                    your first question and assign it to a chapter.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
