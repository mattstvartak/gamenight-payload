import { NextResponse } from "next/server";
import { fetchBggAccessoryData } from "@/lib/utils/bggUtils";
import { delay } from "@/lib/utils/asyncUtils";

/**
 * API endpoint to fetch accessory data from BoardGameGeek
 * @route GET /api/bgg/accessory?id={accessoryId}
 * @route POST /api/bgg/accessory with { accessoryId: string | number } in request body
 */
export async function GET(request: Request) {
  try {
    // Get the request URL to check for query parameters
    const url = new URL(request.url);
    const accessoryId = url.searchParams.get("id");

    if (!accessoryId) {
      return NextResponse.json(
        { error: "BGG Accessory ID is required as a query parameter" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch accessory data from BGG
    const bggData = await fetchBggAccessoryData(accessoryId);

    // Return the data
    return NextResponse.json(bggData);
  } catch (error) {
    console.error(`Error in BGG Accessory API:`, error);
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
    const { accessoryId } = await request.json();

    if (!accessoryId) {
      return NextResponse.json(
        { error: "BGG Accessory ID is required in request body" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch accessory data from BGG
    const bggData = await fetchBggAccessoryData(accessoryId);

    // Return the data
    return NextResponse.json(bggData);
  } catch (error) {
    console.error(`Error in BGG Accessory API:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
