"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
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
  onAddToLibraries: (libraryIds: string[]) => Promise<void>;
  onCreateLibrary: (name: string) => Promise<void>;
  disabled?: boolean;
  gameId?: string; // BGG ID of the game
}

export function AddToLibraryDropdown({
  libraries,
  onAddToLibraries,
  onCreateLibrary,
  disabled = false,
  gameId,
}: AddToLibraryDropdownProps) {
  const [loadingLibraries, setLoadingLibraries] = React.useState<Set<string>>(
    new Set()
  );
  const [newLibraryName, setNewLibraryName] = React.useState("");
  const [isCreatingLibrary, setIsCreatingLibrary] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const isGameInLibrary = (library: Library) => {
    return library.games?.some((g) => g.game.bggId === gameId);
  };

  const handleLibrarySelect = async (libraryId: string) => {
    setLoadingLibraries((prev) => new Set([...prev, libraryId]));
    try {
      await onAddToLibraries([libraryId]);
    } catch (err) {
      console.error("Failed to add game to library:", err);
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
      await onCreateLibrary(newLibraryName);
      setNewLibraryName("");
      setOpen(false); // Close the dropdown after creating a library
    } catch (err) {
      console.error("Failed to create library:", err);
    } finally {
      setIsCreatingLibrary(false);
    }
  };

  const isAddingToAnyLibrary = loadingLibraries.size > 0;

  return (
    <Dialog>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled || isAddingToAnyLibrary}>
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
          {libraries.length > 0 ? (
            <>
              {libraries.map(({ library }) => (
                <DropdownMenuCheckboxItem
                  key={library.id}
                  checked={isGameInLibrary(library)}
                  disabled={
                    loadingLibraries.has(library.id) || isGameInLibrary(library)
                  }
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                  onCheckedChange={() => handleLibrarySelect(library.id)}
                >
                  {loadingLibraries.has(library.id) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    library.name
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>No libraries available</DropdownMenuItem>
          )}
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
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
