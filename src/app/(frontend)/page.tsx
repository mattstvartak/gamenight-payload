import { headers as getHeaders } from "next/headers.js";
import { getPayload } from "payload";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GameSearch } from "@/components/GameSearch";
import config from "@/payload.config";

export default async function HomePage() {
  const headers = await getHeaders();
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Game Night</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="secondary" asChild className="cursor-pointer">
                  <a href="/dashboard">Dashboard</a>
                </Button>
                <form action="/api/users/logout" method="post">
                  <Button
                    variant="outline"
                    type="submit"
                    className="cursor-pointer"
                  >
                    Logout
                  </Button>
                </form>
              </div>
            ) : (
              <Button asChild className="cursor-pointer">
                <a href="/login">Login or Create Account</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-16">
          <div className="flex flex-col items-center space-y-6">
            <h2 className="text-4xl font-bold text-center">
              Find Your Next Game
            </h2>
            <GameSearch />
          </div>
        </section>
      </main>
    </div>
  );
}
