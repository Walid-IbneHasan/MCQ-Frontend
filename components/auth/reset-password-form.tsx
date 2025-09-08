"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { passwordResetSchema } from "../../lib/utils/validation";
import {
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} from "../../lib/store/api/authApi";
import { useToastContext } from "../../lib/providers/toast-provider";
import { ROUTES } from "../../lib/utils/constants";
import { z } from "zod";
import type { PasswordResetRequest } from "../../types/auth";
import { title } from "process";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const step = searchParams.get("step") || "request";
  const phone = searchParams.get("phone") || "";
  const otp = searchParams.get("otp") || "";

  // Debug logging
  console.log("ResetPasswordForm - step:", step, "phone:", phone, "otp:", otp);

  if (step === "confirm") {
    // Make sure we have phone and otp
    if (!phone || !otp) {
      console.error("Missing phone or OTP for password reset confirm");
      return <div>Invalid reset link. Please try again.</div>;
    }
    return <PasswordResetConfirmForm phone={phone} otp={otp} />;
  }

  return <PasswordResetRequestForm />;
}

function PasswordResetRequestForm() {
  const router = useRouter();
  const { toast } = useToastContext();
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = async (data: PasswordResetRequest) => {
    try {
      await requestReset(data).unwrap();

      toast({
        title: "OTP Sent",
        description: "Password reset OTP has been sent to your phone.",
        variant: "success",
      });

      router.push(
        `${ROUTES.VERIFY_OTP}?phone=${encodeURIComponent(
          data.phone_number
        )}&type=password_reset`
      );
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description:
          error?.data?.error || "Failed to send reset OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to receive a reset code
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone_number" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone_number"
                  placeholder="01XXXXXXXXX"
                  className="pl-10"
                  {...register("phone_number")}
                />
              </div>
              {errors.phone_number && (
                <p className="text-sm text-destructive">
                  {errors.phone_number.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link
                href={ROUTES.LOGIN}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

interface PasswordResetConfirmFormProps {
  phone: string;
  otp: string;
}

const passwordResetConfirmFormSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type PasswordResetConfirmFormData = {
  new_password: string;
  confirm_password: string;
};

function PasswordResetConfirmForm({
  phone,
  otp,
}: PasswordResetConfirmFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const router = useRouter();
  const { toast } = useToastContext();
  const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();

  // Debug logging
  console.log("PasswordResetConfirmForm - phone:", phone, "otp:", otp);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmFormSchema),
  });

  const onSubmit = async (data: PasswordResetConfirmFormData) => {
    try {
      // Make sure phone and otp are available
      if (!phone || !otp) {
        toast({
          title: "Error",
          description:
            "Missing phone number or OTP. Please try the reset process again.",
          variant: "destructive",
        });
        router.push(ROUTES.RESET_PASSWORD);
        return;
      }

      const requestBody = {
        phone_number: phone,
        otp_code: otp,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      };

      console.log("Sending password reset confirm request:", requestBody);

      await confirmReset(requestBody).unwrap();

      toast({
        title: "Success",
        description: "Password reset successfully!",
        variant: "success",
      });

      router.push(ROUTES.LOGIN);
    } catch (error: any) {
      console.error("Password reset confirm error:", error);

      let errorMessage = "Failed to reset password. Please try again.";

      if (error?.data?.errors) {
        const errors = error.data.errors;
        if (typeof errors === "object") {
          const errorMessages = Object.values(errors).flat();
          errorMessage = errorMessages.join(", ");
        }
      } else if (error?.data?.non_field_errors) {
        if (Array.isArray(error.data.non_field_errors)) {
          errorMessage = error.data.non_field_errors.join(", ");
        } else {
          errorMessage = error.data.non_field_errors;
        }
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      }

      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password for{" "}
            {phone
              ? phone.replace(/^(\d{3}).*(\d{3})$/, "$1****$2")
              : "your account"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new_password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                  {...register("new_password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.new_password && (
                <p className="text-sm text-destructive">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm_password" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10"
                  {...register("confirm_password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
