import { NextResponse } from "next/server";
import { fetchBggGameData, extractBggEntityLinks } from "@/lib/utils/bggUtils";
import { delay } from "@/lib/utils/asyncUtils";

/**
 * API endpoint to fetch game data from BoardGameGeek
 * @route GET /api/bgg/game?id={bggId}
 * @route POST /api/bgg/game with { bggId: string | number } in request body
 */
export async function GET(request: Request) {
  try {
    // Get the request URL to check for query parameters
    const url = new URL(request.url);
    const bggId = url.searchParams.get("id");

    if (!bggId) {
      return NextResponse.json(
        { error: "BGG ID is required as a query parameter" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch game data from BGG
    const bggData = await fetchBggGameData(bggId);

    // Extract accessories if present
    const accessories = extractBggEntityLinks(
      bggData?.items?.item,
      "boardgameaccessory"
    );

    // Add accessories to game data
    if (accessories && accessories.length > 0) {
      bggData.accessories = accessories;
    }

    // Return the data
    return NextResponse.json(bggData);
  } catch (error) {
    console.error(`Error in BGG Game API:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * POST version of the same endpoint for when query parameters aren't suitable
 */
export async function POST(request: Request) {
  try {
    const { bggId } = await request.json();

    if (!bggId) {
      return NextResponse.json(
        { error: "BGG ID is required in request body" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch game data from BGG
    const bggData = await fetchBggGameData(bggId);

    // Extract accessories if present
    const accessories = extractBggEntityLinks(
      bggData?.items?.item,
      "boardgameaccessory"
    );

    // Add accessories to game data
    if (accessories && accessories.length > 0) {
      bggData.accessories = accessories;
    }

    // Return the data
    return NextResponse.json(bggData);
  } catch (error) {
    console.error(`Error in BGG Game API:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
