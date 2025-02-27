"use client";

import { useUser } from "@/contexts/user-context";
import { useEffect, useState } from "react";
import type { Game, Library } from "@/payload-types";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface LibraryContentProps {
  libraryId: string;
}

export function LibraryContent({ libraryId }: LibraryContentProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [library, setLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  const fetchLibrary = async () => {
    try {
      // Check if user has access to this library
      const userHasAccess = user?.libraries?.some(
        (lib) =>
          typeof lib.library === "object" &&
          lib.library !== null &&
          lib.library.id === Number(libraryId)
      );

      if (!userHasAccess) {
        console.error("User does not have access to this library");
        setLibrary(null);
        return;
      }

      const response = await fetch(`/api/libraries/${libraryId}`);
      if (!response.ok) throw new Error("Failed to fetch library");

      const data = await response.json();
      setLibrary(data);
    } catch (error) {
      console.error("Error fetching library:", error);
      setLibrary(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLibrary();
    }
  }, [libraryId, user]);

  const handleRemoveGame = async (gameId: number) => {
    try {
      setIsRemoving(gameId);
      const response = await fetch(
        `/api/libraries/${libraryId}/games/${gameId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove game");
      }

      toast({
        title: "Game removed",
        description: "The game has been removed from your library",
      });

      // Refresh library data
      await fetchLibrary();
    } catch (error) {
      console.error("Error removing game:", error);
      toast({
        title: "Error",
        description: "Failed to remove game from library",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/libraries">Library</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-square rounded-xl bg-muted/50 animate-pulse" />
            <div className="aspect-square rounded-xl bg-muted/50 animate-pulse" />
            <div className="aspect-square rounded-xl bg-muted/50 animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  if (!library) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/libraries">Library</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-4 pt-0">
          <p className="text-muted-foreground">
            Library not found or access denied
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/libraries">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{library.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-2xl font-bold">{library.name}</h1>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {library.games?.map((gameEntry) => {
            const game =
              typeof gameEntry.game === "object" ? gameEntry.game : null;
            if (!game) return null;

            const coverImage = game.images?.[0]?.image;
            const imageUrl =
              typeof coverImage === "object" ? coverImage?.url : null;

            return (
              <div className="group relative" key={game.id}>
                <Link
                  href={`/games/${game.bggId}`}
                  className="block aspect-square rounded-xl bg-muted/50 overflow-hidden relative"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={game.name || "Game cover"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h3 className="font-semibold text-white">
                      {game.name || "Untitled Game"}
                    </h3>
                  </div>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveGame(game.id);
                  }}
                  disabled={isRemoving === game.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
