import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "../lib/providers/store-provider";
import { ThemeProvider } from "../lib/providers/theme-provider";
import { ToastProvider } from "../lib/providers/toast-provider";
import { Navbar } from "../components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ExamApp - Online MCQ Platform",
  description: "Take MCQ exams online with our modern platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StoreProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
              </div>
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
