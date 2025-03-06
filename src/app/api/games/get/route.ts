import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Game } from "@/payload-types";

interface GetGameResponse {
  game?: Game;
  message?: string;
  alreadyProcessed?: boolean;
  error?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bggId = searchParams.get("bggId");

  if (!bggId) {
    return NextResponse.json({ error: "BGG ID is required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  try {
    // First check if the game already exists in our database
    const res = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: bggId,
        },
      },
    });

    if (res.docs.length > 0) {
      const game = res.docs[0];

      // Always try to complete processing via the add endpoint
      console.log(
        `Game ${game.name} (ID: ${game.id}) exists, calling add endpoint to ensure complete processing`
      );

      try {
        // Create a request to our addFromBGG endpoint
        const apiUrl = new URL(request.url);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
        const addFromBGGUrl = `${baseUrl}/api/games/add`;

        const response = await fetch(addFromBGGUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bggId }),
        });

        const result = (await response.json()) as GetGameResponse;

        if (response.ok) {
          return NextResponse.json({
            game,
            message: "Game data retrieved, processing not completed",
          } as GetGameResponse);
        } else {
          console.warn(
            `Failed to complete processing for game ${game.name}:`,
            result.error
          );
          return NextResponse.json({
            game,
            message:
              "Game data retrieved, processing not completed due to error",
          } as GetGameResponse);
        }
      } catch (error) {
        console.error(
          `Error completing processing for game ${game.name}:`,
          error
        );
        return NextResponse.json({
          game,
          message:
            "Game data retrieved, processing not completed due to processing error",
        } as GetGameResponse);
      }
    } else {
      // If the game doesn't exist, fetch it from BGG using our new endpoint
      try {
        const apiUrl = new URL(request.url);
        const baseUrl = `${apiUrl.protocol}//${apiUrl.host}`;
        const addFromBGGUrl = `${baseUrl}/api/games/add`;

        const response = await fetch(addFromBGGUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bggId }),
        });

        const result = (await response.json()) as GetGameResponse;

        if (response.ok) {
          return NextResponse.json({ game: result.game } as GetGameResponse);
        } else {
          return NextResponse.json(
            { error: result.error || "Failed to add game" },
            { status: response.status }
          );
        }
      } catch (error) {
        console.error("Error adding game:", error);
        return NextResponse.json(
          { error: "Failed to add game" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
