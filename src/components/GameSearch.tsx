'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface Game {
  id: string;
  name: string;
  yearPublished?: string;
  thumbnail?: string;
}

export function GameSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentQuery = useRef(searchQuery);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const ITEMS_PER_PAGE = 5;

  const searchGames = useCallback(async (query: string, pageNum: number, append: boolean = false) => {
    if (!query) {
      setGames([]);
      return;
    }

    setIsLoading(true);
    try {
      // BGG API requires XML parsing
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`);
      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      const items = xmlDoc.getElementsByTagName('item');
      const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const parsedGames: Game[] = [];

      // Check if there are more items to load
      setHasMore(endIndex < items.length);

      for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
        const item = items[i];
        const id = item.getAttribute('id') || '';
        
        // Get detailed game info including thumbnail
        const detailsResponse = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`);
        const detailsText = await detailsResponse.text();
        const detailsDoc = parser.parseFromString(detailsText, "text/xml");
        
        const nameElement = detailsDoc.querySelector('name[type="primary"]');
        const yearPublishedElement = detailsDoc.querySelector('yearpublished');
        const thumbnailElement = detailsDoc.querySelector('thumbnail');
        
        const yearPublished = yearPublishedElement?.getAttribute('value') || undefined;
        const thumbnail = thumbnailElement?.textContent || undefined;

        if (nameElement) {
          parsedGames.push({
            id,
            name: nameElement.getAttribute('value') || '',
            yearPublished,
            thumbnail,
          });
        }
      }

      setGames(prev => append ? [...prev, ...parsedGames] : parsedGames);
    } catch (error) {
      console.error('Error searching games:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setGames, setHasMore, setIsLoading]);

  // Debounced search effect
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery) {
      searchTimeout.current = setTimeout(() => {
        currentQuery.current = searchQuery;
        setPage(1);
        setHasMore(true);
        searchGames(searchQuery, 1, false);
      }, 500);
    } else {
      setGames([]);
    }

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchGames, setGames]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isLoading || !hasMore) return;

    const target = e.target as HTMLDivElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    if (scrollBottom < 100) { // Load more when within 100px of bottom
      setPage(prev => prev + 1);
      searchGames(currentQuery.current, page + 1, true);
    }
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
      
      {isLoading && (
        <div className="absolute right-3 top-3">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {games.length > 0 && (
        <div className="absolute w-full mt-2 bg-background border rounded-md shadow-lg z-50">
          <ScrollArea 
            className="h-[300px] w-full rounded-md" 
            onScroll={handleScroll}
            ref={scrollRef}
          >
            {games.map((game, index) => (
              <div key={game.id}>
                <div className="flex items-center p-4 hover:bg-accent cursor-pointer">
                  <div className="flex-shrink-0 h-16 w-16 mr-4">
                    {game.thumbnail ? (
                      <img
                        src={game.thumbnail}
                        alt={`${game.name} box art`}
                        className="h-full w-full object-cover rounded-sm"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted rounded-sm flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{game.name}</h3>
                    {game.yearPublished && (
                      <p className="text-sm text-muted-foreground">
                        Published: {game.yearPublished}
                      </p>
                    )}
                  </div>
                </div>
                {index < games.length - 1 && <Separator />}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 