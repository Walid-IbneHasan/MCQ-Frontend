// components/ui/use-toast.ts
"use client";

import { useToastContext } from "../../lib/providers/toast-provider";

// Type definitions that match what the exam form expects
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  duration?: number;
}

// Hook that adapts your existing toast system to the expected interface
export function useToast() {
  const context = useToastContext();
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // Adapt your existing toast function to match the expected interface
  return {
    toast: (options: ToastOptions) => {
      // Convert the options to match your existing toast hook's expected format
      const toastData = {
        title: options.title,
        description: options.description,
        variant: options.variant || 'default',
        duration: options.duration || 5000,
      };
      
      // Call your existing toast function
      return context.toast(toastData);
    },
    dismiss: context.dismiss,
    dismissAll: context.dismissAll,
  };
}