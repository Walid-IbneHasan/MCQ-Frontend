// components/layout/navbar.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  Settings,
  Bell,
  Menu,
  BookOpen,
  Trophy,
  BarChart3,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";
import { useAuth } from "../../hooks/use-auth";
import { ROUTES, USER_ROLES } from "../../lib/utils/constants";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileMenuId = "primary-mobile-menu";
  const pathname = usePathname();

  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  // Close menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // ESC to close & scroll lock on open
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    const original = document.body.style.overflow;
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = original || "";
    };
  }, [isMobileMenuOpen]);

  const navItems = React.useMemo(() => {
    const items: {
      href: string;
      label: string;
      icon: React.ComponentType<any>;
    }[] = [
      { href: ROUTES.DASHBOARD, label: "Dashboard", icon: BarChart3 },
      { href: "/subjects", label: "Subjects", icon: BookOpen },
      { href: "/exams", label: "Exams", icon: Trophy },
    ];

    if (
      user?.role &&
      [USER_ROLES.TEACHER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN].includes(
        user.role
      )
    ) {
      items.push(
        { href: "/admin/questions", label: "Questions", icon: BookOpen },
        { href: "/admin/users", label: "Users", icon: User }
      );
    }
    return items;
  }, [user?.role]);

  // --- Public navbar (not authenticated) ---
  if (!isAuthenticated) {
    return (
      <nav
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        aria-label="Main"
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
              <span className="font-bold">ExamApp</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href={ROUTES.LOGIN}>Sign In</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.REGISTER}>Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  // --- Authenticated navbar ---
  return (
    <nav
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Main"
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="mr-4 flex">
          <Link
            href={ROUTES.DASHBOARD}
            className="mr-6 flex items-center gap-2"
            aria-label="Go to dashboard"
          >
            <BookOpen className="h-6 w-6" aria-hidden="true" />
            <span className="font-bold">ExamApp</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="mr-4 hidden md:block">
          <div className="flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "transition-colors",
                    active
                      ? "text-foreground"
                      : "text-foreground/60 hover:text-foreground/80",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
              aria-hidden="true"
            >
              3
            </span>
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-controls={mobileMenuId}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Desktop user section */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Clickable Avatar + name */}
            <Link
              href={ROUTES.PROFILE}
              className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent cursor-pointer"
              title="Go to profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                {user?.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-none">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            </Link>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Profile settings"
            >
              <Link href={ROUTES.PROFILE}>
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu (slide-down sheet) */}
      <div
        id={mobileMenuId}
        className={[
          "md:hidden border-t bg-background will-change-transform transition-[max-height,opacity] duration-300 ease-out overflow-hidden",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          {/* Clickable User row */}
          <Link
            href={ROUTES.PROFILE}
            className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-primary" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </Link>

          {/* Links */}
          <div className="grid gap-1.5 pt-1">
            {navItems.map((item) => {
              const ActiveIcon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "hover:bg-accent text-foreground/90",
                  ].join(" ")}
                >
                  <ActiveIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <hr className="my-2" />

          {/* Settings / Logout */}
          <div className="grid gap-1.5">
            <Link
              href={ROUTES.PROFILE}
              className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
