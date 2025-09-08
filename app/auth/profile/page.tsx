"use client";

import { useAuth } from "../../../hooks/use-auth";
import { ProfileForm } from "../../../components/auth/profile-form";

export default function ProfilePage() {
  const { requireAuth } = useAuth();

  if (!requireAuth()) {
    return null;
  }

  return <ProfileForm />;
}
