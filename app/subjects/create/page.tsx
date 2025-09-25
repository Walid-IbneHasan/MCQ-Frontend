// app/subjects/create/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { useCreateSubjectMutation } from "../../../lib/store/api/subjectsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { USER_ROLES } from "../../../lib/utils/constants";
import { useToastContext } from "../../../lib/providers/toast-provider";

export default function CreateSubjectPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const { toast } = useToastContext();
  const [createSubject, { isLoading }] = useCreateSubjectMutation();

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    code: "",
    sort_order: 0,
  });

  if (!requireAuth()) {
    return null;
  }

  // Check if user can manage subjects
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
              You don't have permission to create subjects.
            </p>
            <Button asChild className="mt-4">
              <Link href="/subjects" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sort_order" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Subject name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.code.trim()) {
      toast({
        title: "Error",
        description: "Subject code is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createSubject(formData).unwrap();

      toast({
        title: "Success",
        description: "Subject created successfully",
        variant: "success",
      });

      router.push(`/subjects/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to create subject",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/subjects" className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subjects
        </Link>
      </Button>

      {/* Create Subject Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Subject</CardTitle>
          <CardDescription>
            Add a new subject to the system for students to study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>

              {/* Subject Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., MATH101"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the subject..."
                rows={4}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                Lower numbers will appear first in the list
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button variant="outline" asChild>
                <Link href="/subjects">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Creating..." : "Create Subject"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
