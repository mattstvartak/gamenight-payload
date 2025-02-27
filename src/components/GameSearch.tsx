"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { List, AutoSizer, InfiniteLoader } from "react-virtualized";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Game, Media } from "../payload-types";
import { useRouter } from "next/navigation";

// Global cache for search results and images
const SEARCH_CACHE_SIZE = 50;
const searchCache = new Map<
  string,
  { results: SearchResult[]; timestamp: number }
>();
const imageCache = new Map<string, string>();

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

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
  error?: string;
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

// Helper function to preload image
async function preloadImage(url: string | null | undefined): Promise<void> {
  if (!url) {
    return Promise.resolve(); // Silently resolve for missing URLs
  }

  return new Promise((resolve) => {
    // Remove reject from Promise constructor
    // Check if image is already cached
    if (imageCache.has(url)) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(url, url);
      resolve();
    };
    img.onerror = () => {
      resolve(); // Silently resolve on error
    };
    img.src = url;
  });
}

// Helper function to get the best thumbnail URL
function getBestThumbnailUrl(
  images: { image?: number | Media | null }[]
): string | null {
  if (!images?.length) return null;

  for (const img of images) {
    if (!img.image || !isMedia(img.image)) continue;

    // First try to get thumbnail version
    if (img.image.sizes?.thumbnail?.url) {
      return img.image.sizes.thumbnail.url;
    }
    // Then try original URL as fallback
    if (img.image.url) {
      return img.image.url;
    }
  }
  return null;
}

function GameThumbnail({
  image,
  name,
}: {
  image?: number | Media | null;
  name: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!image || !isMedia(image)) {
      setLoadError(true);
      setImageLoaded(true);
      return;
    }

    setLoadError(false);
    setImageLoaded(false);

    // Get the best thumbnail URL
    const thumbnailUrl = image.sizes?.thumbnail?.url || image.url;

    if (!thumbnailUrl) {
      setLoadError(true);
      setImageLoaded(true);
      return;
    }

    // Check if image is in cache
    const cachedUrl = imageCache.get(thumbnailUrl);
    if (cachedUrl) {
      setImageSrc(cachedUrl);
      setImageLoaded(true);
      return;
    }

    // Preload image
    preloadImage(thumbnailUrl).then(() => {
      if (isMounted.current) {
        if (thumbnailUrl && imageCache.has(thumbnailUrl)) {
          setImageSrc(thumbnailUrl);
          setImageLoaded(true);
        } else {
          setLoadError(true);
          setImageLoaded(true);
        }
      }
    });
  }, [image]);

  if (loadError || !image || !isMedia(image)) {
    return (
      <div className="h-full w-full bg-muted rounded-sm flex items-center justify-center">
        <div className="text-center">
          <span className="text-muted-foreground text-xs">
            {name.slice(0, 1)}
          </span>
        </div>
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
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={image.alt || name}
          className={cn(
            "h-full w-full object-cover rounded-sm transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </>
  );
}

// Helper function to preload multiple images in order
async function preloadImagesInOrder(
  games: SearchGame[],
  priority = false
): Promise<void> {
  const imagePromises = games
    .filter((game) => Array.isArray(game.images) && game.images.length > 0)
    .map((game) => {
      if (!game.images) return null;
      const thumbnailUrl = getBestThumbnailUrl(game.images);
      if (!thumbnailUrl) return null;
      return preloadImage(thumbnailUrl); // Remove .catch() since we handle errors silently now
    })
    .filter((promise): promise is Promise<void> => promise !== null);

  if (priority) {
    // For priority images, load them one by one in order
    for (const promise of imagePromises) {
      await promise;
    }
  } else {
    // For non-priority images, load them all in parallel
    await Promise.all(imagePromises);
  }
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
  const gameCache = useRef<Map<string, SearchGame>>(new Map());
  const BATCH_SIZE = 10;
  const SEARCH_DEBOUNCE = 300;
  const MIN_SEARCH_INTERVAL = 500;
  const MAX_PARALLEL_REQUESTS = 5;

  // Clean up expired cache entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();

      // Clean up search cache
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRATION) {
          searchCache.delete(key);
        }
      }

      // Limit search cache size
      if (searchCache.size > SEARCH_CACHE_SIZE) {
        const entriesToDelete = Array.from(searchCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, searchCache.size - SEARCH_CACHE_SIZE);

        for (const [key] of entriesToDelete) {
          searchCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, CACHE_EXPIRATION);
    return () => clearInterval(interval);
  }, []);

  const loadGameDetails = useCallback(
    async (startIndex: number, stopIndex: number) => {
      const itemsToLoad = searchResults.current.slice(startIndex, stopIndex);
      if (itemsToLoad.length === 0) return;

      const newGames: SearchGame[] = [];
      const uncachedItems: SearchResult[] = [];

      // First, check cache and collect uncached items
      itemsToLoad.forEach((item) => {
        const cached = gameCache.current.get(item.id);
        if (cached) {
          newGames.push(cached);
        } else {
          uncachedItems.push(item);
        }
      });

      // Load uncached items in parallel batches
      if (uncachedItems.length > 0) {
        const batchPromises = [];
        for (let i = 0; i < uncachedItems.length; i += MAX_PARALLEL_REQUESTS) {
          const batch = uncachedItems.slice(i, i + MAX_PARALLEL_REQUESTS);
          const batchPromise = Promise.all(
            batch.map(async (item) => {
              try {
                const response = await fetch(`/api/games/get?bggId=${item.id}`);
                if (!response.ok) {
                  throw new Error("Failed to fetch game details");
                }

                const data = await response.json();
                if (!data.game) {
                  throw new Error("Invalid game data received");
                }

                const game: SearchGame = {
                  bggId: item.id,
                  name: data.game.name,
                  minPlayers: data.game.minPlayers,
                  maxPlayers: data.game.maxPlayers,
                  minPlaytime: data.game.minPlaytime,
                  maxPlaytime: data.game.maxPlaytime,
                  images: data.game.images,
                  type: "boardgame",
                  isLoaded: true,
                };

                // Cache the result
                gameCache.current.set(item.id, game);
                return game;
              } catch (error) {
                console.error(
                  `Error fetching details for game ${item.id}:`,
                  error
                );
                const fallbackGame: SearchGame = {
                  bggId: item.id,
                  name: item.name,
                  isLoaded: true,
                  type: "boardgame",
                };
                gameCache.current.set(item.id, fallbackGame);
                return fallbackGame;
              }
            })
          );
          batchPromises.push(batchPromise);
        }

        // Wait for all batches to complete
        const batchResults = await Promise.all(batchPromises);
        newGames.push(...batchResults.flat());
      }

      setGames((prev) => {
        const updatedGames = [...prev];
        newGames.forEach((game) => {
          const index = startIndex + newGames.indexOf(game);
          updatedGames[index] = game;
        });
        return updatedGames;
      });

      // Start preloading images asynchronously
      // Priority load first visible batch
      const firstBatch = newGames.slice(0, 3);
      if (firstBatch.length > 0) {
        preloadImagesInOrder(firstBatch, true).catch(() => {});
      }

      // Load remaining images in parallel
      const remainingBatch = newGames.slice(3);
      if (remainingBatch.length > 0) {
        preloadImagesInOrder(remainingBatch, false).catch(() => {});
      }
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

      // Check cache first
      const cached = searchCache.get(query);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
        searchResults.current = cached.results;
        const initialGames = cached.results.map((item) => ({
          bggId: item.id,
          name: item.name,
          isLoaded: false,
        }));
        setGames(initialGames);
        setHasNextPage(true);
        await loadGameDetails(0, Math.min(BATCH_SIZE, cached.results.length));
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

        const data = await response.json();

        if (response.status === 429) {
          // Rate limit hit - show as a game in the list
          setGames([
            {
              bggId: "error",
              name: "Search limit reached",
              error: "Please wait a moment before searching again",
              isLoaded: true,
            },
          ]);
          return;
        }

        if (!response.ok) {
          setGames([
            {
              bggId: "error",
              name: "Search failed",
              error: data.error || "Failed to search games",
              isLoaded: true,
            },
          ]);
          return;
        }

        if (!data.results || !Array.isArray(data.results)) {
          setGames([
            {
              bggId: "error",
              name: "Invalid response",
              error: "Received invalid search results",
              isLoaded: true,
            },
          ]);
          return;
        }

        if (data.results.length === 0) {
          setGames([
            {
              bggId: "error",
              name: "No results",
              error: `No games found matching "${query}"`,
              isLoaded: true,
            },
          ]);
          return;
        }

        // Cache the search results
        searchCache.set(query, {
          results: data.results,
          timestamp: Date.now(),
        });

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
        setGames([
          {
            bggId: "error",
            name: "Search error",
            error:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            isLoaded: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [loadGameDetails]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim()) {
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
    router.push(`/game/${bggId}`);
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
          className={cn(
            "flex items-center p-4 hover:bg-accent cursor-pointer",
            game.error ? "opacity-50" : ""
          )}
          onClick={() => !game.error && handleGameClick(game.bggId)}
        >
          <div className="flex-shrink-0 h-16 w-16 mr-4 relative">
            {game.isLoaded ? (
              <GameThumbnail
                image={game.images?.[0]?.image}
                name={game.name || ""}
              />
            ) : (
              <div className="h-full w-full bg-muted rounded-sm flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{game.name}</h3>
            {game.error ? (
              <p className="text-sm text-destructive">{game.error}</p>
            ) : (
              game.isLoaded && (
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
              )
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
