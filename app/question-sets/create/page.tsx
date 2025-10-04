// app/question-sets/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useCreateQuestionSetMutation } from "../../../lib/store/api/questionSetsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";
import { ChapterSelector } from "../../../components/exams/ChapterSelector";
import { QuestionSelectionStep } from "../../../components/exams/QuestionSelectionStep";
import type { Chapter } from "../../../types/subjects";

export default function CreateQuestionSetPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [createQuestionSet, { isLoading: isCreating }] =
    useCreateQuestionSetMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [newQuestions, setNewQuestions] = useState<any[]>([]);
  const [chaptersCatalog, setChaptersCatalog] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push("/login");
    }
  }, [user, isLoadingAuth, router]);

  if (isLoadingAuth) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
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
              You don't have permission to create question sets.
            </p>
            <Button asChild className="mt-4">
              <Link href="/question-sets">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Question Sets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

    if (selectedQuestions.length === 0 && newQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one question",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuestionSet({
        name: name || `Question Set ${new Date().toLocaleDateString()}`,
        description,
        chapters: selectedChapters,
        questions: selectedQuestions,
      }).unwrap();

      toast({
        title: "Success",
        description: "Question set created successfully!",
      });

      router.push("/question-sets");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create question set",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/question-sets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Question Sets
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Create Question Set</h1>
        <p className="text-muted-foreground">
          Create a reusable collection of questions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Advanced Math - Calculus Questions"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If empty, a default name will be generated
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this question set..."
                rows={3}
              />
            </div>
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
              onAvailableChaptersChange={setChaptersCatalog}
            />
          </CardContent>
        </Card>

        {/* Question Selection */}
        {selectedChapters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionSelectionStep
                selectedChapters={selectedChapters}
                questionSelectionMethod="manual"
                totalQuestions={100} // Not really used for question sets
                selectedQuestions={selectedQuestions}
                newQuestions={newQuestions}
                randomQuestionsCount={0}
                onSelectedQuestionsChange={setSelectedQuestions}
                onNewQuestionsChange={setNewQuestions}
                onRandomQuestionsCountChange={() => {}}
                chaptersCatalog={chaptersCatalog}
                chapterLabel={(id) => {
                  const c = chaptersCatalog.find((x) => x.id === id);
                  return c
                    ? `${c.subject_name} — Ch. ${c.chapter_number}: ${c.name}`
                    : id;
                }}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/question-sets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Question Set"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
