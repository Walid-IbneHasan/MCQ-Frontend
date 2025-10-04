// components/questions/QuestionViewModal.tsx
"use client";

import React from "react";
import { useGetQuestionQuery } from "../../lib/store/api/questionsApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Loader2, Check, X } from "lucide-react";

interface QuestionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | null;
}

export function QuestionViewModal({
  isOpen,
  onClose,
  questionId,
}: QuestionViewModalProps) {
  const { data: question, isLoading } = useGetQuestionQuery(questionId || "", {
    skip: !questionId,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : question ? (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={getDifficultyColor(question.difficulty)}
              >
                {question.difficulty}
              </Badge>
              <Badge variant="secondary">{question.marks} marks</Badge>
              {question.negative_marks > 0 && (
                <Badge variant="outline" className="text-red-600">
                  -{question.negative_marks} for wrong
                </Badge>
              )}
              <Badge variant="outline">
                {question.subject_name} - {question.chapter_name}
              </Badge>
            </div>

            {/* Question Text */}
            <div>
              <h3 className="font-semibold mb-2">Question:</h3>
              <p className="whitespace-pre-wrap">{question.question_text}</p>
              {question.question_image && (
                <img
                  src={question.question_image}
                  alt="Question"
                  className="mt-2 max-w-md rounded border"
                />
              )}
            </div>

            {/* Options */}
            <div>
              <h3 className="font-semibold mb-2">Options:</h3>
              <div className="space-y-2">
                {[...question.options]
                  .sort((a, b) => a.option_order - b.option_order)
                  .map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        option.is_correct
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {option.is_correct ? (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      <p
                        className={
                          option.is_correct
                            ? "font-medium text-green-900"
                            : "text-gray-700"
                        }
                      >
                        {option.option_text}
                      </p>
                      {option.is_correct && (
                        <Badge className="ml-auto bg-green-100 text-green-800 border-green-200">
                          Correct
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <h3 className="font-semibold mb-2">Explanation:</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {question.explanation}
                </p>
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag: any) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{question.success_rate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Times Used</p>
                  <p className="font-semibold">{question.times_used || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Attempts</p>
                  <p className="font-semibold">
                    {question.total_attempts || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Question not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
