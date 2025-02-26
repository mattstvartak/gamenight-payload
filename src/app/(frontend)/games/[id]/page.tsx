"use client";

import { useEffect, useState, use } from "react";
import { Loader2, Users, Clock, CalendarDays } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

// Helper function to retry failed requests
async function fetchWithRetry(
  url: string,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      // BGG API sometimes returns 202 when the request is accepted but not ready
      if (response.status === 202) {
        await delay(delayMs);
        continue;
      }

      if (response.ok) {
        return response;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
    }
    await delay(delayMs);
  }
  throw new Error(`Failed to fetch after ${retries} retries`);
}

export default function GamePage({ params }: { params: Promise<PageParams> }) {
  const unwrappedParams = use(params);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameDetails() {
      try {
        const response = await fetchWithRetry(
          `https://boardgamegeek.com/xmlapi2/thing?id=${unwrappedParams.id}&stats=1`,
          3,
          1000
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const item = xmlDoc.querySelector("item");

        if (!item) {
          throw new Error("Game not found");
        }

        const nameElement = item.querySelector('name[type="primary"]');
        const description = item.querySelector("description")?.textContent;
        const yearPublished = item
          .querySelector("yearpublished")
          ?.getAttribute("value");
        const thumbnail = item.querySelector("thumbnail")?.textContent;
        const image = item.querySelector("image")?.textContent;
        const minPlayers = Number(
          item.querySelector("minplayers")?.getAttribute("value")
        );
        const maxPlayers = Number(
          item.querySelector("maxplayers")?.getAttribute("value")
        );
        const minPlaytime = Number(
          item.querySelector("minplaytime")?.getAttribute("value")
        );
        const maxPlaytime = Number(
          item.querySelector("maxplaytime")?.getAttribute("value")
        );
        const minAge = Number(
          item.querySelector("minage")?.getAttribute("value")
        );
        const rating = Number(
          item
            .querySelector("statistics > ratings > average")
            ?.getAttribute("value")
        );
        const weight = Number(
          item
            .querySelector("statistics > ratings > averageweight")
            ?.getAttribute("value")
        );

        const categories = Array.from(
          item.querySelectorAll('link[type="boardgamecategory"]')
        ).map((el) => el.getAttribute("value") || "");
        const mechanics = Array.from(
          item.querySelectorAll('link[type="boardgamemechanic"]')
        ).map((el) => el.getAttribute("value") || "");
        const designers = Array.from(
          item.querySelectorAll('link[type="boardgamedesigner"]')
        ).map((el) => el.getAttribute("value") || "");
        const publishers = Array.from(
          item.querySelectorAll('link[type="boardgamepublisher"]')
        ).map((el) => el.getAttribute("value") || "");

        setGame({
          id: unwrappedParams.id,
          name: nameElement?.getAttribute("value") || "",
          yearPublished: yearPublished || undefined,
          thumbnail: thumbnail || undefined,
          image: image || undefined,
          description: description || undefined,
          minPlayers,
          maxPlayers,
          minPlaytime,
          maxPlaytime,
          minAge,
          rating,
          weight,
          categories,
          mechanics,
          designers,
          publishers,
        });
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
