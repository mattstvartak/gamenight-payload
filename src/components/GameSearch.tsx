"use client";

import { useState, useRef, useCallback } from "react";
import { List, AutoSizer, InfiniteLoader } from "react-virtualized";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game, Media } from "../payload-types";
import { useRouter } from "next/navigation";

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

interface SearchGame extends Partial<Game> {
  isLoaded?: boolean;
  bggId: string;
}

interface SearchResult {
  id: string;
  type: string;
  name: string;
}

// Helper function to check if value is Media type
function isMedia(value: number | Media | null): value is Media {
  return value !== null && typeof value === "object" && "url" in value;
}

function GameThumbnail({
  image,
  name,
}: {
  image?: number | Media | null;
  name: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!image || !isMedia(image)) {
    return (
      <div className="h-full w-full bg-muted rounded-sm flex items-center justify-center">
        <span className="text-muted-foreground text-xs">No image</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 bg-muted rounded-sm flex items-center justify-center",
          imageLoaded ? "opacity-0" : "opacity-100"
        )}
      >
        <span className="text-muted-foreground text-xs">Loading...</span>
      </div>
      <img
        src={image.url || ""}
        alt={image.alt}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className={cn(
          "h-full w-full object-cover rounded-sm transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </>
  );
}

export function GameSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState<SearchGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchResults = useRef<SearchResult[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const lastSearchTime = useRef<number>(0);
  const BATCH_SIZE = 10;
  const SEARCH_DEBOUNCE = 500; // 500ms debounce
  const MIN_SEARCH_INTERVAL = 1000; // 1 second minimum between searches

  const loadGameDetails = useCallback(
    async (startIndex: number, stopIndex: number) => {
      const itemsToLoad = searchResults.current.slice(startIndex, stopIndex);
      if (itemsToLoad.length === 0) return;

      const newGames: SearchGame[] = [];

      for (const item of itemsToLoad) {
        try {
          // Add a small delay between requests to avoid overwhelming the server
          if (newGames.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          const response = await fetch(`/api/games/get?bggId=${item.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch game details");
          }

          const data = await response.json();
          if (!data.game) {
            throw new Error("Invalid game data received");
          }

          newGames.push({
            bggId: item.id,
            name: data.game.name,
            minPlayers: data.game.minPlayers,
            maxPlayers: data.game.maxPlayers,
            minPlaytime: data.game.minPlaytime,
            maxPlaytime: data.game.maxPlaytime,
            images: data.game.images,
            type: "boardgame",
            isLoaded: true,
          });
        } catch (error) {
          console.error(`Error fetching details for game ${item.id}:`, error);
          // Add a placeholder for failed loads
          newGames.push({
            bggId: item.id,
            name: item.name,
            isLoaded: true,
            type: "boardgame",
          });
        }
      }

      setGames((prev) => {
        const updatedGames = [...prev];
        newGames.forEach((game) => {
          const index = startIndex + newGames.indexOf(game);
          updatedGames[index] = game;
        });
        return updatedGames;
      });
    },
    []
  );

  const searchGames = useCallback(
    async (query: string) => {
      if (!query) {
        setGames([]);
        searchResults.current = [];
        setError(null);
        return;
      }

      // Check if enough time has passed since the last search
      const now = Date.now();
      if (now - lastSearchTime.current < MIN_SEARCH_INTERVAL) {
        return;
      }
      lastSearchTime.current = now;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/games/search?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error("Failed to search games");
        }

        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) {
          throw new Error("Invalid search results received");
        }

        if (data.results.length === 0) {
          setGames([]);
          searchResults.current = [];
          setError("No games found");
          return;
        }

        searchResults.current = data.results;

        // Initialize games array with names from search results
        const initialGames: SearchGame[] = searchResults.current.map(
          (item) => ({
            bggId: item.id,
            name: item.name,
            isLoaded: false,
          })
        );

        setGames(initialGames);
        setHasNextPage(true);

        // Load first batch of details
        await loadGameDetails(
          0,
          Math.min(BATCH_SIZE, searchResults.current.length)
        );
      } catch (error) {
        console.error("Error searching games:", error);
        setError(error instanceof Error ? error.message : "Failed to search games");
        setGames([]);
        searchResults.current = [];
      } finally {
        setIsLoading(false);
      }
    },
    [loadGameDetails]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value) {
      searchTimeout.current = setTimeout(() => {
        searchGames(value);
      }, SEARCH_DEBOUNCE);
    } else {
      setGames([]);
      setError(null);
    }
  };

  const isRowLoaded = ({ index }: { index: number }) => {
    return Boolean(games[index]?.isLoaded);
  };

  const handleGameClick = (bggId: string) => {
    router.push(`/games/${bggId}`);
  };

  const rowRenderer = ({
    key,
    index,
    style,
  }: {
    key: string;
    index: number;
    style: React.CSSProperties;
  }) => {
    const game = games[index];
    if (!game) return null;

    return (
      <div key={key} style={style}>
        <div
          className="flex items-center p-4 hover:bg-accent cursor-pointer"
          onClick={() => handleGameClick(game.bggId)}
        >
          <div className="flex-shrink-0 h-16 w-16 mr-4 relative">
            {game.isLoaded ? (
              <GameThumbnail image={game.images?.[0]?.image} name={game.name || ""} />
            ) : (
              <div className="h-full w-full bg-muted rounded-sm flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{game.name}</h3>
            {game.isLoaded && (
              <div className="space-y-1">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {(game.minPlayers || game.maxPlayers) && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {game.minPlayers === game.maxPlayers
                          ? `${game.minPlayers}`
                          : `${game.minPlayers}-${game.maxPlayers}`}
                      </span>
                    </div>
                  )}
                  {(game.minPlaytime || game.maxPlaytime) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
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
            )}
          </div>
        </div>
        {index < games.length - 1 && <Separator />}
      </div>
    );
  };

  const loadMoreRows = async ({
    startIndex,
    stopIndex,
  }: {
    startIndex: number;
    stopIndex: number;
  }) => {
    if (startIndex >= searchResults.current.length) {
      setHasNextPage(false);
      return;
    }
    await loadGameDetails(startIndex, stopIndex);
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <Input
        type="search"
        placeholder="Search games..."
        className="w-full cursor-text"
        value={searchQuery}
        onChange={handleSearch}
      />

      {isLoading && games.length === 0 && (
        <div className="absolute right-3 top-3">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {games.length > 0 && (
        <div className="absolute w-full mt-2 bg-background border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="h-[300px]">
            <AutoSizer>
              {({ width, height }: { width: number; height: number }) => (
                <InfiniteLoader
                  isRowLoaded={isRowLoaded}
                  loadMoreRows={loadMoreRows}
                  rowCount={searchResults.current.length}
                  threshold={5}
                >
                  {({ onRowsRendered, registerChild }) => (
                    <List
                      ref={registerChild}
                      width={width}
                      height={height}
                      rowCount={games.length}
                      rowHeight={88}
                      rowRenderer={rowRenderer}
                      onRowsRendered={onRowsRendered}
                    />
                  )}
                </InfiniteLoader>
              )}
            </AutoSizer>
          </div>
        </div>
      )}
    </div>
  );
}
