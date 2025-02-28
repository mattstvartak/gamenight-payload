"use client";
import { Card } from "./ui/card";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { removeGameFromLibrary } from "@/utils/library";
import { Game } from "@/payload-types";
interface GameCardProps {
  game: Game; // Type this properly based on your game type
  libraryId: string;
}

export function GameCard({ game, libraryId }: GameCardProps) {
  return (
    <Card className="overflow-hidden relative aspect-square">
      {game.images?.[0]?.image &&
      typeof game.images[0].image === "object" &&
      game.images[0].image.url ? (
        <Image
          src={game.images[0].image.url}
          alt={game.name || "Game image"}
          fill
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 p-4 flex flex-col justify-end">
        {/* ... rest of the card content ... */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-red-500 hover:bg-white/10"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete game</span>
        </Button>
      </div>
    </Card>
  );
}
