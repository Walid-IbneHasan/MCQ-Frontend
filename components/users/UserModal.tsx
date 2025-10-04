// components/users/UserModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserQuery,
} from "../../lib/store/api/usersApi";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  userId?: string | null;
}

export function UserModal({ isOpen, onClose, mode, userId }: UserModalProps) {
  const { toast } = useToast();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const { data: userData, isLoading: isLoadingUser } = useGetUserQuery(
    userId || "",
    { skip: !userId || mode === "create" }
  );

  const [formData, setFormData] = useState({
    phone_number: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "student" as "student" | "teacher" | "moderator" | "admin",
    is_active: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Load user data for edit mode
  useEffect(() => {
    if (mode === "edit" && userData?.user) {
      const user = userData.user;
      setFormData({
        phone_number: user.phone_number,
        password: "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role,
        is_active: user.is_active,
      });
    }
  }, [userData, mode]);

  const resetForm = () => {
    setFormData({
      phone_number: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "student",
      is_active: true,
    });
    setShowPassword(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const validatePhoneNumber = (phone: string) => {
    // Bangladeshi phone number format
    const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (mode === "create") {
      if (!formData.phone_number || !formData.password) {
        toast({
          title: "Validation Error",
          description: "Phone number and password are required",
          variant: "destructive",
        });
        return;
      }

      if (!validatePhoneNumber(formData.phone_number)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid Bangladeshi phone number",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 8) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 8 characters",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (mode === "create") {
        await createUser({
          phone_number: formData.phone_number,
          password: formData.password,
          email: formData.email || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          role: formData.role,
        }).unwrap();

        toast({
          title: "Success",
          description: "User created successfully",
        });
      } else {
        await updateUser({
          id: userId!,
          data: {
            email: formData.email || undefined,
            first_name: formData.first_name || undefined,
            last_name: formData.last_name || undefined,
            role: formData.role,
            is_active: formData.is_active,
          },
        }).unwrap();

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || `Failed to ${mode} user`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New User" : "Edit User"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingUser && mode === "edit" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone_number">
                Phone Number * {mode === "create" && "(e.g., 01712345678)"}
              </Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                placeholder="01712345678"
                required
                disabled={mode === "edit"}
              />
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Phone number cannot be changed
                </p>
              )}
            </div>

            {/* Password (Create only) */}
            {mode === "create" && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status (Edit only) */}
            {mode === "edit" && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive users cannot log in
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {mode === "create" ? "Create User" : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
