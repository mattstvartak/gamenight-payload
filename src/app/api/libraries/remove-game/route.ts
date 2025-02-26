import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@/payload.config";
import type { Game } from "@/payload-types";

export async function POST(req: Request) {
  try {
    const payload = await getPayload({
      config,
    });

    const body = await req.json();

    const { libraryId, gameId } = body;

    if (!libraryId || !gameId) {
      return NextResponse.json(
        { error: "Library ID and Game ID are required" },
        { status: 400 }
      );
    }

    // Get the library
    const library = await payload.findByID({
      collection: "libraries",
      id: libraryId,
    });

    if (!library) {
      return NextResponse.json({ error: "Library not found" }, { status: 404 });
    }

    // Get the game by BGG ID
    const { docs: games } = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: gameId,
        },
      },
    });

    if (!games.length) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = games[0] as Game;

    // Remove the game from the library
    const updatedLibrary = await payload.update({
      collection: "libraries",
      id: libraryId,
      data: {
        games:
          library.games?.filter((g) => {
            const existingGame = g.game as Game;
            return existingGame?.id !== game.id;
          }) || [],
      },
    });

    return NextResponse.json(updatedLibrary);
  } catch (error) {
    console.error("Error removing game from library:", error);
    return NextResponse.json(
      { error: "Failed to remove game from library" },
      { status: 500 }
    );
  }
}
