import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Library } from "@/payload-types";
import qs from "qs";

export const RemoveGameButton = async ({
  gameId,
  libraryId,
  library,
}: {
  gameId: string;
  libraryId: string;
  library: Library;
}) => {
  const removeGame = async (gameId: string) => {
    await fetch(`/api/library`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept-Language": "en",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-HTTP-Method-Override": "GET",
      },
      body: qs.stringify({
        id: libraryId,
        depth: 1,
        data: {
          games: library.games?.filter((game) => {
            if (typeof game.game === "object" && game.game !== null) {
              return game.game.id.toString() !== gameId;
            }
            return false;
          }),
        },
      }),
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-white hover:text-red-500 hover:bg-white/10"
      onClick={() => removeGame(gameId)}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete game</span>
    </Button>
  );
};
