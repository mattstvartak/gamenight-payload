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
import { Input } from "@/components/ui/input";
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
                  <Button variant="outline" type="submit" className="cursor-pointer">
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
        {/* Search Section */}
        <section className="mb-16">
          <div className="flex flex-col items-center space-y-6">
            <h2 className="text-4xl font-bold text-center">Find Your Next Game</h2>
            <div className="w-full max-w-2xl">
              <Input
                type="search"
                placeholder="Search games..."
                className="w-full cursor-text"
              />
            </div>
          </div>
        </section>

        {/* Top Rated Games */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Top Rated Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Game Title {i}</CardTitle>
                  <CardDescription>Strategy • 2-4 Players</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-sm text-muted-foreground">
                      (4.8/5)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Games */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Most Popular Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Popular Game {i}</CardTitle>
                  <CardDescription>Party • 3-8 Players</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      1.2k plays this month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
