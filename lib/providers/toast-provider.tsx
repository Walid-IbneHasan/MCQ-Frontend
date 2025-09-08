"use client";

import React, { createContext, useContext } from "react";
import { useToast, Toast as ToastType } from "../../hooks/use-toast";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "../../components/ui/toast";

interface ToastContextType {
  toast: (toast: Omit<ToastType, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, toast, dismiss, dismissAll } = useToast();

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onClose={() => dismiss(toast.id)}
          >
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
