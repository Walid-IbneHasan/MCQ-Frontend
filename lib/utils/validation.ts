import { z } from 'zod';

export const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;

export const loginSchema = z.object({
  phone_number: z
    .string()
    .regex(phoneRegex, 'Invalid Bangladeshi phone number format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    phone_number: z
      .string()
      .regex(phoneRegex, 'Invalid Bangladeshi phone number format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirm_password: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export const otpSchema = z.object({
  otp_code: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export const passwordResetSchema = z.object({
  phone_number: z
    .string()
    .regex(phoneRegex, 'Invalid Bangladeshi phone number format'),
});

export const passwordResetConfirmSchema = z
  .object({
    otp_code: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d+$/, 'OTP must contain only numbers'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(150),
  last_name: z.string().min(1, 'Last name is required').max(150),
  email: z.string().email().optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});