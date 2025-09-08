"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
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
import { loginSchema } from "../../lib/utils/validation";
import { useLoginMutation } from "../../lib/store/api/authApi";
import { useAppDispatch } from "../../lib/store/hooks";
import { setCredentials } from "../../lib/store/slices/authSlice";
import { useToastContext } from "../../lib/providers/toast-provider";
import { ROUTES } from "../../lib/utils/constants";
import type { LoginRequest } from "../../types/auth";

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToastContext();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      const response = await login(data).unwrap();

      if (
        response.success &&
        response.access_token &&
        response.refresh_token &&
        response.user
      ) {
        dispatch(
          setCredentials({
            user: response.user,
            access_token: response.access_token,
            refresh_token: response.refresh_token,
          })
        );

        toast({
          title: "Success",
          description: "Logged in successfully!",
          variant: "success",
        });

        router.push(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description:
          error?.data?.error || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href={ROUTES.RESET_PASSWORD}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href={ROUTES.REGISTER}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
