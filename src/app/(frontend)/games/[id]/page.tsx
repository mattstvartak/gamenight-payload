"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Users, Clock, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthGuard } from "@/components/AuthGuard";
import { AddToLibraryDropdown } from "@/components/AddToLibraryDropdown";

interface MediaImage {
  id: number;
  url: string;
  filename: string;
  alt: string;
  sizes?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    card?: {
      url: string;
      width: number;
      height: number;
    };
  };
}

interface GameDetails {
  id: string;
  name: string;
  yearPublished?: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  rating?: number;
  weight?: number;
  categories?: string[];
  mechanics?: string[];
  designers?: string[];
  publishers?: string[];
  images?: { image: MediaImage }[];
  bggId: string;
}

interface PageParams {
  id: string;
}

interface Library {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  library?: { library: Library }[];
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  maxRetries: number,
  delayMs: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Wait before retrying
    await delay(delayMs);
  }

  throw lastError;
}

const loadingMessages = [
  "Rolling the dice...",
  "Shuffling the cards...",
  "Setting up the board...",
  "Dealing the hands...",
  "Reading the rulebook...",
  "Organizing the meeples...",
  "Calculating victory points...",
  "Finding the start player...",
  "Sorting the resource tokens...",
  "Checking for missing pieces...",
];

function useRotatingMessage(messages: string[], interval: number = 2000) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, messages.length]);

  return messages[currentIndex];
}

export default function GamePage({ params }: { params: Promise<PageParams> }) {
  const unwrappedParams = use(params);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    async function fetchGameDetails() {
      try {
        const response = await fetch(
          `/api/games/get?bggId=${unwrappedParams.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch game details");
        }

        const data = await response.json();
        setGame({
          ...data.game,
          bggId: unwrappedParams.id, // Ensure bggId is set from the URL parameter
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load game details"
        );
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchUserDetails() {
      try {
        setIsLoadingUser(true);
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    fetchGameDetails();
    fetchUserDetails();
  }, [unwrappedParams.id]);

  if (isLoading) {
    return (
      <>
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
                  <Button
                    variant="secondary"
                    asChild
                    className="cursor-pointer"
                  >
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
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Section Skeleton */}
            <div className="md:col-span-1">
              <Skeleton className="w-full aspect-square rounded-lg" />
            </div>

            {/* Details Card Skeleton */}
            <Card className="md:col-span-1">
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !game) {
    return (
      <>
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
                  <Button
                    variant="secondary"
                    asChild
                    className="cursor-pointer"
                  >
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
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-lg font-medium text-destructive">
            {error || "Failed to load game details"}
          </p>
        </div>
      </>
    );
  }

  // Get all images from the images array
  const allImages = game.images || [];

  return (
    <>
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
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="md:col-span-1">
            {allImages.length > 0 ? (
              allImages.length === 1 ? (
                <div className="relative aspect-square">
                  <img
                    src={allImages[0].image.url}
                    alt={allImages[0].image.alt}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {allImages.map((imageObj) => (
                      <CarouselItem key={imageObj.image.id}>
                        <div className="relative aspect-square">
                          <img
                            src={imageObj.image.url}
                            alt={imageObj.image.alt}
                            className="w-full h-full object-cover rounded-lg shadow-lg"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              )
            ) : (
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">
                  No image available
                </span>
              </div>
            )}
          </div>

          {/* Details Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{game.name}</CardTitle>
                <AuthGuard
                  fallback={
                    <Button variant="outline" asChild>
                      <a href="/login">Login to Add to Library</a>
                    </Button>
                  }
                >
                  <AddToLibraryDropdown
                    library={user?.library || []}
                    gameId={game.bggId}
                  />
                </AuthGuard>
              </div>
              {game.yearPublished && (
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>{game.yearPublished}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {(game.minPlayers || game.maxPlayers) && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span>
                        {game.minPlayers === game.maxPlayers
                          ? `${game.minPlayers}`
                          : `${game.minPlayers}-${game.maxPlayers}`}
                        {" players"}
                      </span>
                    </div>
                  )}
                  {(game.minPlaytime || game.maxPlaytime) && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>
                        {game.minPlaytime === game.maxPlaytime
                          ? `${game.minPlaytime}`
                          : `${game.minPlaytime}-${game.maxPlaytime}`}
                        {" min"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description Card */}
        {game.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: game.description }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories & Mechanics Card */}
        {((game.categories && game.categories.length > 0) ||
          (game.mechanics && game.mechanics.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {game.categories && game.categories.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.mechanics && game.mechanics.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Mechanics</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.mechanics.map((mechanic) => (
                      <span
                        key={mechanic}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                      >
                        {mechanic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Credits Card */}
        {((game.designers && game.designers.length > 0) ||
          (game.publishers && game.publishers.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.designers && game.designers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Designers</h3>
                  <p className="text-sm text-muted-foreground">
                    {game.designers.join(", ")}
                  </p>
                </div>
              )}

              {game.publishers && game.publishers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Publishers</h3>
                  <p className="text-sm text-muted-foreground">
                    {game.publishers.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
