export interface User {
  id: string;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  date_of_birth?: string;
  profile_picture?: string;
  bio?: string;
  role: 'student' | 'teacher' | 'moderator' | 'admin';
  is_verified: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface RegisterRequest {
  phone_number: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface OTPVerificationRequest {
  phone_number: string;
  otp_code: string;
  otp_type: 'registration' | 'login' | 'password_reset' | 'phone_verification';
}

export interface PasswordResetRequest {
  phone_number: string;
}

export interface PasswordResetConfirmRequest {
  phone_number: string;
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  message?: string;
  phone_number?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
}