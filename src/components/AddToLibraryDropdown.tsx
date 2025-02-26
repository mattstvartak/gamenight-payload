"use client";

import * as React from "react";
import { Loader2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Library {
  id: string;
  name: string;
  description?: string;
  games?: {
    game: {
      id: number;
      bggId?: string;
    };
  }[];
}

interface AddToLibraryDropdownProps {
  libraries: { library: Library }[];
  gameId?: string;
}

export function AddToLibraryDropdown({
  libraries: initialLibraries,
  gameId,
}: AddToLibraryDropdownProps) {
  const [libraries, setLibraries] = React.useState(initialLibraries);
  const [loadingLibraries, setLoadingLibraries] = React.useState<Set<string>>(
    new Set()
  );
  const [newLibraryName, setNewLibraryName] = React.useState("");
  const [isCreatingLibrary, setIsCreatingLibrary] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [hoveredLibrary, setHoveredLibrary] = React.useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Update local libraries when prop changes
  React.useEffect(() => {
    setLibraries(initialLibraries);
  }, [initialLibraries]);

  const isGameInLibrary = (library: Library) => {
    if (!library?.games?.length) return false;
    return library.games.some((g) => g.game.bggId === gameId);
  };

  const handleLibrarySelect = async (
    libraryId: string,
    isRemoving: boolean
  ) => {
    setLoadingLibraries((prev) => new Set([...prev, libraryId]));
    try {
      if (isRemoving) {
        const response = await fetch("/api/libraries/remove-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            libraryId,
            gameId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove game from library");
        }

        // Update local state to remove the game
        setLibraries((prevLibraries) =>
          prevLibraries.map((lib) => {
            if (!lib?.library) return lib;
            if (lib.library.id === libraryId) {
              return {
                ...lib,
                library: {
                  ...lib.library,
                  games:
                    lib.library.games?.filter((g) => g.game.bggId !== gameId) ||
                    [],
                },
              };
            }
            return lib;
          })
        );
      } else {
        const response = await fetch("/api/libraries/add-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            libraryId,
            gameId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add game to library");
        }

        // Update local state to add the game
        setLibraries((prevLibraries) =>
          prevLibraries.map((lib) => {
            if (!lib?.library) return lib;
            if (lib.library.id === libraryId) {
              return {
                ...lib,
                library: {
                  ...lib.library,
                  games: [
                    ...(lib.library.games || []),
                    {
                      game: {
                        id: 0,
                        bggId: gameId,
                      },
                    },
                  ],
                },
              };
            }
            return lib;
          })
        );
      }
    } catch (err) {
      console.error(
        `Failed to ${isRemoving ? "remove" : "add"} game ${
          isRemoving ? "from" : "to"
        } library:`,
        err
      );
    } finally {
      setLoadingLibraries((prev) => {
        const next = new Set(prev);
        next.delete(libraryId);
        return next;
      });
    }
  };

  const handleCreateLibrary = async () => {
    if (!newLibraryName) return;

    setIsCreatingLibrary(true);
    try {
      // Create the library
      const response = await fetch("/api/libraries/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newLibraryName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create library");
      }

      const newLibrary = await response.json();

      // Update local state with the new library
      const updatedLibraries = [
        ...libraries,
        {
          library: {
            ...newLibrary,
            games: [],
          },
        },
      ];
      setLibraries(updatedLibraries);

      // Close the dialog and reset form
      setNewLibraryName("");
      setDialogOpen(false);

      // After library is created and state is updated, add the game
      await handleLibrarySelect(newLibrary.id, false);
    } catch (err) {
      console.error("Failed to create library:", err);
    } finally {
      setIsCreatingLibrary(false);
    }
  };

  const isAddingToAnyLibrary = loadingLibraries.size > 0;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isAddingToAnyLibrary}>
            {isAddingToAnyLibrary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Library"
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {libraries.filter(({ library }) => library).length > 0 ? (
            <>
              {libraries.map(({ library }) => {
                if (!library) return null;
                const inLibrary = isGameInLibrary(library);
                const isHovered = hoveredLibrary === library.id;
                const isLoading = loadingLibraries.has(library.id);

                return (
                  <DropdownMenuItem
                    key={library.id}
                    disabled={isLoading}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLibrarySelect(library.id, Boolean(inLibrary));
                    }}
                    onMouseEnter={() => setHoveredLibrary(library.id)}
                    onMouseLeave={() => setHoveredLibrary(null)}
                    className={cn(
                      "flex items-center gap-2",
                      inLibrary && isHovered && "text-destructive"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {inLibrary ? "Removing..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        {inLibrary ? (
                          isHovered ? (
                            <X className="h-4 w-4 text-destructive" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )
                        ) : null}
                        {library.name}
                        {inLibrary && isHovered && " (Remove)"}
                      </>
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>No libraries available</DropdownMenuItem>
          )}
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Library
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Library</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Library Name</Label>
            <Input
              id="name"
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="My Game Library"
            />
          </div>
        </div>
        <Button
          onClick={handleCreateLibrary}
          disabled={!newLibraryName || isCreatingLibrary}
        >
          {isCreatingLibrary ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Library"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
