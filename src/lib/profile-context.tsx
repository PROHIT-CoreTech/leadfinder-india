"use client";

import { createContext, useContext, useState } from "react";
import type { Profile } from "@/lib/types";

interface ProfileContextValue {
  profile: Profile;
  email: string;
  setProfile: (profile: Profile) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  profile: initialProfile,
  email,
  children,
}: {
  profile: Profile;
  email: string;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState(initialProfile);
  return (
    <ProfileContext.Provider value={{ profile, email, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
