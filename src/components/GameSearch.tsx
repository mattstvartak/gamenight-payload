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
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchResults = useRef<SearchResult[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const BATCH_SIZE = 10;

  const loadGameDetails = useCallback(
    async (startIndex: number, stopIndex: number) => {
      const itemsToLoad = searchResults.current.slice(startIndex, stopIndex);
      if (itemsToLoad.length === 0) return;

      const newGames: SearchGame[] = [];

      for (const item of itemsToLoad) {
        try {
          await delay(250); // Add delay between requests

          const detailsResponse = await fetchWithRetry(
            `https://boardgamegeek.com/xmlapi2/thing?id=${item.id}`,
            3,
            1000
          );

          const detailsText = await detailsResponse.text();
          const detailsDoc = new DOMParser().parseFromString(
            detailsText,
            "text/xml"
          );

          const yearPublishedElement =
            detailsDoc.querySelector("yearpublished");
          const thumbnailElement = detailsDoc.querySelector("thumbnail");
          const minPlayersElement = detailsDoc.querySelector("minplayers");
          const maxPlayersElement = detailsDoc.querySelector("maxplayers");
          const minPlayTimeElement = detailsDoc.querySelector("minplaytime");
          const maxPlayTimeElement = detailsDoc.querySelector("maxplaytime");

          newGames.push({
            bggId: item.id,
            name: item.name,
            minPlayers:
              Number(minPlayersElement?.getAttribute("value")) || null,
            maxPlayers:
              Number(maxPlayersElement?.getAttribute("value")) || null,
            minPlaytime:
              Number(minPlayTimeElement?.getAttribute("value")) || null,
            maxPlaytime:
              Number(maxPlayTimeElement?.getAttribute("value")) || null,
            image: thumbnailElement?.textContent
              ? ({
                  id: 0,
                  alt: `${item.name} thumbnail`,
                  url: thumbnailElement.textContent,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                } as Media)
              : null,
            type: "boardgame",
            isLoaded: true,
          });
        } catch (error) {
          console.error(`Error fetching details for game ${item.id}:`, error);
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
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetchWithRetry(
          `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}`,
          3,
          1000
        );
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = xmlDoc.getElementsByTagName("item");

        // Store all search results with names
        searchResults.current = Array.from(items)
          .map((item) => {
            const id = item.getAttribute("id");
            const type = item.getAttribute("type");
            const nameElement = item.querySelector("name");
            const name = nameElement?.getAttribute("value") || "";
            return id && type && name ? { id, type, name } : null;
          })
          .filter((item): item is SearchResult => item !== null);

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

    if (value) {
      searchTimeout.current = setTimeout(() => {
        searchGames(value);
      }, 500);
    } else {
      setGames([]);
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
              <GameThumbnail image={game.image} name={game.name || ""} />
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
