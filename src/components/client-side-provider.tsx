"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import type { User } from "@/payload-types";

export function ClientSideProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    // Initialize store with server-side user data
    setUser(initialUser);
  }, [initialUser, setUser]);

  return <>{children}</>;
}
