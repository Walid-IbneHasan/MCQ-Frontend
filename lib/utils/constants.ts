export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',
  PROFILE: '/auth/profile',
  DASHBOARD: '/dashboard',
} as const;

export const OTP_TYPES = {
  REGISTRATION: 'registration',
  LOGIN: 'login',
  PASSWORD_RESET: 'password_reset',
  PHONE_VERIFICATION: 'phone_verification',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;