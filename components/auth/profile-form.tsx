"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  MessageSquare,
  Camera,
  Save,
  Lock,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  profileUpdateSchema,
  changePasswordSchema,
} from "../../lib/utils/validation";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../lib/store/api/authApi";
import { useAppDispatch } from "../../lib/store/hooks";
import { updateUser } from "../../lib/store/slices/authSlice";
import { useToastContext } from "../../lib/providers/toast-provider";
import type { User as UserType, ChangePasswordRequest } from "../../types/auth";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email?: string;
  date_of_birth?: string;
  bio?: string;
}

export function ProfileForm() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "security">(
    "profile"
  );
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const { toast } = useToastContext();

  const { data: user, isLoading: isLoadingProfile } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    values: user
      ? {
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          date_of_birth: user.date_of_birth || "",
          bio: user.bio || "",
        }
      : undefined,
  });

  const passwordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();

      // Add text fields
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      if (data.email) formData.append("email", data.email);
      if (data.date_of_birth)
        formData.append("date_of_birth", data.date_of_birth);
      if (data.bio) formData.append("bio", data.bio);

      // Add image if selected
      if (selectedImage) {
        formData.append("profile_picture", selectedImage);
      }

      const updatedUser = await updateProfile(formData).unwrap();
      dispatch(updateUser(updatedUser));

      toast({
        title: "Success",
        description: "Profile updated successfully!",
        variant: "success",
      });

      // Clear image selection after successful update
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.data?.error || "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordRequest) => {
    try {
      await changePassword(data).unwrap();

      toast({
        title: "Success",
        description: "Password changed successfully!",
        variant: "success",
      });

      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error?.data?.error || "Failed to change password.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : user?.profile_picture ? (
              <Image
                src={user.profile_picture}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <Button
            size="icon"
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Camera className="h-3 w-3" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {user?.full_name || "User Profile"}
          </h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {user?.role} • {user?.is_verified ? "Verified" : "Unverified"}
          </p>
        </div>
      </div>

      {/* Image preview and controls */}
      {selectedImage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  New image selected: {selectedImage.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={removeImage}
                type="button"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("profile")}
          className="rounded-md"
          type="button"
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </Button>
        <Button
          variant={activeTab === "security" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("security")}
          className="rounded-md"
          type="button"
        >
          <Lock className="h-4 w-4 mr-2" />
          Security
        </Button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="first_name"
                      placeholder="Enter first name"
                      className="pl-10"
                      {...profileForm.register("first_name")}
                    />
                  </div>
                  {profileForm.formState.errors.first_name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="last_name"
                      placeholder="Enter last name"
                      className="pl-10"
                      {...profileForm.register("last_name")}
                    />
                  </div>
                  {profileForm.formState.errors.last_name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className="pl-10"
                    {...profileForm.register("email")}
                  />
                </div>
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="date_of_birth" className="text-sm font-medium">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date_of_birth"
                    type="date"
                    className="pl-10"
                    {...profileForm.register("date_of_birth")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...profileForm.register("bio")}
                  />
                </div>
                {profileForm.formState.errors.bio && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="old_password" className="text-sm font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="old_password"
                    type="password"
                    placeholder="Enter current password"
                    className="pl-10"
                    {...passwordForm.register("old_password")}
                  />
                </div>
                {passwordForm.formState.errors.old_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.old_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="new_password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                    className="pl-10"
                    {...passwordForm.register("new_password")}
                  />
                </div>
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className="text-sm font-medium"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-10"
                    {...passwordForm.register("confirm_password")}
                  />
                </div>
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full md:w-auto"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
