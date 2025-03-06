import { NextResponse } from "next/server";
import { fetchBggPublisherData } from "@/lib/utils/bggUtils";
import { delay } from "@/lib/utils/asyncUtils";

/**
 * API endpoint to fetch publisher data from BoardGameGeek
 * @route GET /api/bgg/publisher?id={publisherId}
 * @route POST /api/bgg/publisher with { publisherId: string | number } in request body
 */
export async function GET(request: Request) {
  try {
    // Get the request URL to check for query parameters
    const url = new URL(request.url);
    const publisherId = url.searchParams.get("id");

    if (!publisherId) {
      return NextResponse.json(
        { error: "Publisher ID is required as a query parameter" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch publisher data from BGG
    const publisherData = await fetchBggPublisherData(publisherId);

    // Return the data
    return NextResponse.json(publisherData);
  } catch (error) {
    console.error(`Error in BGG Publisher API:`, error);
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
    const { publisherId } = await request.json();

    if (!publisherId) {
      return NextResponse.json(
        { error: "Publisher ID is required in request body" },
        { status: 400 }
      );
    }

    // Apply rate limiting
    await delay(300);

    // Fetch publisher data from BGG
    const publisherData = await fetchBggPublisherData(publisherId);

    // Return the data
    return NextResponse.json(publisherData);
  } catch (error) {
    console.error(`Error in BGG Publisher API:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
