// app/question-sets/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/use-auth";
import {
  useGetQuestionSetQuery,
  useUpdateQuestionSetMutation,
} from "../../../../lib/store/api/questionSetsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { useToast } from "../../../../components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../../lib/utils/constants";

export default function EditQuestionSetPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const id = params?.id as string;

  const { data, isLoading: isLoadingData } = useGetQuestionSetQuery(id, {
    skip: !id,
  });

  const [updateQuestionSet, { isLoading: isUpdating }] =
    useUpdateQuestionSetMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push("/login");
    }
  }, [user, isLoadingAuth, router]);

  useEffect(() => {
    if (data?.question_set) {
      setName(data.question_set.name);
      setDescription(data.question_set.description || "");
    }
  }, [data]);

  if (isLoadingAuth || isLoadingData) {
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
              You don't have permission to edit question sets.
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

  const questionSet = data?.question_set;

  if (!questionSet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Question set not found</p>
            <Button asChild className="mt-4">
              <Link href="/question-sets">Back to Question Sets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateQuestionSet({
        id,
        data: { name, description },
      }).unwrap();

      toast({
        title: "Success",
        description: "Question set updated successfully!",
      });

      router.push(`/question-sets/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update question set",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/question-sets/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Question Set
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Edit Question Set</h1>
        <p className="text-muted-foreground">Update question set details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Question Set Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Question set name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this question set..."
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> You cannot modify the questions or
                chapters in this question set. To change questions, create a new
                question set.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/question-sets/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Question Set"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
