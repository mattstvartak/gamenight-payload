import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

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

        const result = await response.json();

        if (response.ok) {
          // Always return the game from our database
          return NextResponse.json({
            game,
            message: "Game data retrieved, processing not completed",
          });
        } else {
          console.warn(
            `Failed to complete processing for game ${game.name}:`,
            result.error
          );
          // Always return the game from our database
          return NextResponse.json({
            game,
            message:
              "Game data retrieved, processing not completed due to error",
          });
        }
      } catch (error) {
        console.error(
          `Error completing processing for game ${game.name}:`,
          error
        );
        // Always return the game from our database
        return NextResponse.json({
          game,
          message:
            "Game data retrieved, processing not completed due to processing error",
        });
      }
    } else {
      // If the game doesn't exist, fetch it from BGG using our new endpoint
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

        const result = await response.json();

        if (response.ok) {
          return NextResponse.json({ game: result.game });
        } else {
          throw new Error(result.error || "Failed to add game from BGG");
        }
      } catch (error) {
        console.error("Error fetching game from BGG:", error);
        return NextResponse.json(
          { error: "Error fetching game from BGG" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json({ error: "Error fetching game" }, { status: 500 });
  }
}
