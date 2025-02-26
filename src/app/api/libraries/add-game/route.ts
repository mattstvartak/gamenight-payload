import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@/payload.config";
import { headers as getHeaders } from "next/headers";
import type { Library, Game } from "@/payload-types";

export async function POST(req: Request) {
  try {
    const headers = await getHeaders();
    const payload = await getPayload({
      config,
    });

    const body = await req.json();
    console.log("Received request body:", body);

    const { libraryId, gameId } = body;

    if (!libraryId || !gameId) {
      console.log("Missing required fields:", { libraryId, gameId });
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

    // Check if the game is already in the library
    const gameExists = library.games?.some((g) => {
      const existingGame = g.game as Game;
      return existingGame?.id === game.id;
    });

    if (gameExists) {
      return NextResponse.json(
        { error: "Game already in library" },
        { status: 400 }
      );
    }

    // Add the game to the library
    const updatedLibrary = await payload.update({
      collection: "libraries",
      id: libraryId,
      data: {
        games: [
          ...(library.games || []),
          {
            game: game.id,
          },
        ],
      },
    });

    return NextResponse.json(updatedLibrary);
  } catch (error) {
    console.error("Error adding game to library:", error);
    return NextResponse.json(
      { error: "Failed to add game to library" },
      { status: 500 }
    );
  }
}
