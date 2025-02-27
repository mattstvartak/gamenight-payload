"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginDialog } from "@/components/LoginDialog";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/users/me");
        const result = await response.json();
        if (result.user) {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginDialog open={true} />
    </div>
  );
}
