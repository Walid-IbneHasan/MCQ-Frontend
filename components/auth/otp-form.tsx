"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, RefreshCw } from "lucide-react";
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
import { otpSchema } from "../../lib/utils/validation";
import {
  useVerifyOTPMutation,
  useResendOTPMutation,
} from "../../lib/store/api/authApi";
import { useAppDispatch } from "../../lib/store/hooks";
import { setCredentials } from "../../lib/store/slices/authSlice";
import { useToastContext } from "../../lib/providers/toast-provider";
import { ROUTES, OTP_TYPES } from "../../lib/utils/constants";

interface OTPFormData {
  otp_code: string;
}

export function OTPForm() {
  const [countdown, setCountdown] = React.useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToastContext();

  const phone = searchParams.get("phone") || "";
  const type = (searchParams.get("type") ||
    "registration") as keyof typeof OTP_TYPES;

  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const otpValue = watch("otp_code");

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data: OTPFormData) => {
    try {
      const response = await verifyOTP({
        phone_number: phone,
        otp_code: data.otp_code,
        otp_type: type,
      }).unwrap();

      if (response.success) {
        toast({
          title: "Success",
          description: "OTP verified successfully!",
          variant: "success",
        });

        if (
          type === "registration" &&
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
          router.push(ROUTES.DASHBOARD);
        } else if (type === "password_reset") {
          // For password reset, redirect to the confirm form with phone and otp
          router.push(
            `${ROUTES.RESET_PASSWORD}?step=confirm&phone=${encodeURIComponent(
              phone
            )}&otp=${encodeURIComponent(data.otp_code)}`
          );
        } else {
          router.push(ROUTES.LOGIN);
        }
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error?.data?.error || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP({
        phone_number: phone,
        otp_type: type, // Use the type directly
      }).unwrap();

      toast({
        title: "OTP Sent",
        description: "A new OTP has been sent to your phone.",
        variant: "success",
      });

      setCountdown(60);
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description:
          error?.data?.error || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 11 && phone.startsWith("01")) {
      return `${phone.slice(0, 3)} **** ${phone.slice(-3)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold">{formatPhoneNumber(phone)}</span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp_code" className="text-sm font-medium">
                OTP Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp_code"
                  placeholder="123456"
                  className="pl-10 text-center text-lg tracking-wider"
                  maxLength={6}
                  {...register("otp_code")}
                />
              </div>
              {errors.otp_code && (
                <p className="text-sm text-destructive">
                  {errors.otp_code.message}
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isResending}
                className="text-primary hover:text-primary/80"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend OTP"
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || otpValue?.length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
