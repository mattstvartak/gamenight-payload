import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * API endpoint to queue game-related items for background processing
 * This is used when a game page loads but some related items are not yet processed
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { items = [] } = json;

    // Validate input
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty items array" },
        { status: 400 }
      );
    }

    console.log(
      `Received request to queue ${items.length} items for processing`
    );

    // Get the base URL from environment or default to http://localhost:3000
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Process each item and queue them for background update
    const queuePromises = items.map(async (item) => {
      const { id, collection, parentGameId } = item;

      // Skip invalid items
      if (!id || !collection) {
        console.warn(`Skipping invalid item: ${JSON.stringify(item)}`);
        return null;
      }

      try {
        // Small random delay to avoid hammering the server
        const delay = Math.random() * 3000; // Random delay up to 3 seconds
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Construct the update URL
        let updateUrl: URL;
        try {
          updateUrl = new URL("/api/games/update", baseUrl);
        } catch (urlError) {
          console.warn(
            `Invalid base URL: ${baseUrl}, falling back to localhost`
          );
          updateUrl = new URL("/api/games/update", "http://localhost:3000");
        }

        // Add query parameters
        updateUrl.searchParams.set("id", id.toString());
        updateUrl.searchParams.set("collection", collection);
        if (parentGameId) {
          updateUrl.searchParams.set("parentGameId", parentGameId.toString());
        }

        console.log(
          `Queueing ${collection} ${id} for processing via ${updateUrl.toString()}`
        );

        // Fire and forget - we don't need to wait for the response
        fetch(updateUrl.toString())
          .then((response) => {
            if (!response.ok) {
              console.error(
                `Error queueing ${collection} ${id}. Status: ${response.status}`
              );
            } else {
              console.log(
                `Successfully queued ${collection} ${id} for processing`
              );
            }
          })
          .catch((error) => {
            console.error(`Fetch error queueing ${collection} ${id}:`, error);
          });

        return { id, collection, queued: true };
      } catch (error) {
        console.error(`Error queueing item ${collection} ${id}:`, error);
        return {
          id,
          collection,
          queued: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // We'll wait for the queuing to complete (not for the processing itself)
    const results = await Promise.all(queuePromises);

    // Filter out null results
    const validResults = results.filter(Boolean);

    return NextResponse.json({
      message: `Successfully queued ${validResults.length} items for background processing`,
      queued: validResults,
    });
  } catch (error) {
    console.error("Error in queue-processing endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to queue items for processing",
      },
      { status: 500 }
    );
  }
}
