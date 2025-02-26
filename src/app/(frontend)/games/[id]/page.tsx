"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Users, Clock, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameDetails {
  id: string;
  name: string;
  yearPublished?: string;
  thumbnail?: string;
  image?: string;
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
}

interface PageParams {
  id: string;
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

export default function GamePage({ params }: { params: Promise<PageParams> }) {
  const unwrappedParams = use(params);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setGame(data.game);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load game details"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchGameDetails();
  }, [unwrappedParams.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg font-medium text-destructive">
          {error || "Failed to load game details"}
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Section */}
        <div className="md:col-span-1">
          {game.image ? (
            <img
              src={game.image}
              alt={game.name}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        {/* Details Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{game.name}</CardTitle>
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
  );
}
