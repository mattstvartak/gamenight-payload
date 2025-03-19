"use client";

import { useEffect, useState } from "react";

// User type definition based on your payload-types
type User = {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
};

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Fetch the user from Payload's built-in /api/users/me endpoint
        const response = await fetch("/api/users/me");

        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated, not an error
            setUser(null);
            setIsLoading(false);
            return;
          }

          throw new Error("Failed to fetch user");
        }

        const userData = await response.json();
        setUser(userData.user);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, isLoading, error };
};
