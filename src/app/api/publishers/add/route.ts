import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { delay } from "@/lib/utils/asyncUtils";

export async function POST(request: Request) {
  try {
    // Try to parse the request body first to see what mode we're in
    const data = await request.json();

    // If we have gameId, we're processing publishers for a game
    if (data.gameId) {
      return processPublishersForGame(data.gameId, request);
    }
    // If we have publisherId, we're directly processing a publisher
    else if (data.publisherId) {
      return processPublisherById(data.publisherId, request);
    }

    return NextResponse.json(
      { error: "Either gameId or publisherId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in publishers/add endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process publisher" },
      { status: 500 }
    );
  }
}

// Process publishers for a game in the background
async function processPublishersForGame(
  gameId: string | number,
  request: Request
) {
  // Fire and forget the actual processing
  processPublishers(gameId, request).catch((error) => {
    console.error(`Error processing publishers for game ${gameId}:`, error);
  });

  return NextResponse.json({
    success: true,
    message: "Publisher processing started in background",
  });
}

// Process a single publisher by ID
async function processPublisherById(
  publisherId: string | number,
  request: Request
) {
  try {
    const payload = await getPayload({ config });

    // Convert publisherId to number for bggId field if it's a string
    const numericPublisherId =
      typeof publisherId === "string" ? parseInt(publisherId, 10) : publisherId;

    if (isNaN(numericPublisherId)) {
      return NextResponse.json(
        { error: "Publisher ID must be a valid number" },
        { status: 400 }
      );
    }

    // Check if publisher already exists
    const existingPublisher = await payload.find({
      collection: "publishers",
      where: {
        bggId: {
          equals: numericPublisherId,
        },
      },
    });

    if (existingPublisher.docs.length > 0) {
      // Publisher already exists, return it
      return NextResponse.json(existingPublisher.docs[0]);
    }

    // If publisher doesn't exist, we should fetch data from BGG and create it
    // This would typically call the same BGG publisher endpoint used in processPublishers
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "";
    const publisherApiUrl = `${protocol}://${host}/api/bgg/publisher`;

    const response = await fetch(publisherApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publisherId: numericPublisherId }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch publisher data from BGG" },
        { status: 500 }
      );
    }

    const publisherData = await response.json();

    // Create the publisher
    const newPublisher = await payload.create({
      collection: "publishers",
      data: {
        name: publisherData.name || `Publisher ${numericPublisherId}`,
        bggId: numericPublisherId,
        description: publisherData.description,
        images: publisherData.imageId ? [publisherData.imageId] : undefined,
        processing: false,
      },
    });

    return NextResponse.json(newPublisher);
  } catch (error) {
    console.error(`Error in processPublisherById:`, error);
    return NextResponse.json(
      { error: "Failed to process publisher" },
      { status: 500 }
    );
  }
}

// Process all publishers for a game
async function processPublishers(gameId: string | number, request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the game data to access publishers
    const game = await payload.findByID({
      collection: "games",
      id: String(gameId),
    });

    if (game.publishers.length === 0) {
      return NextResponse.json({ message: "No publishers to process" });
    }

    const PUBLISHER_RATE_LIMIT_DELAY = 500; // 500ms between publisher requests
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "";
    const publisherApiUrl = `${protocol}://${host}/api/bgg/publisher`;

    // Track any publishers that get updated with new data
    const updatedPublisherIds = [];

    for (const publisherId of game.publishers) {
      try {
        // Ensure publisherId is a string or number
        const publisherIdValue =
          typeof publisherId === "object" && publisherId !== null
            ? publisherId.id
            : publisherId;

        // Skip if not a valid ID
        if (!publisherIdValue) {
          continue;
        }

        // Get the publisher from database
        const publisherDoc = await payload.findByID({
          collection: "publishers",
          id: String(publisherIdValue),
        });

        // Skip if we don't have a BGG ID or if we already have details like description or images
        if (
          !publisherDoc.bggId ||
          publisherDoc.description ||
          (publisherDoc.images && publisherDoc.images.length > 0)
        ) {
          continue;
        }

        // Fetch additional publisher info
        await delay(PUBLISHER_RATE_LIMIT_DELAY);

        const response = await fetch(publisherApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publisherId: publisherDoc.bggId }),
        });

        if (!response.ok) {
          console.error(
            `Failed to fetch publisher details for ${publisherDoc.name}:`,
            response.statusText
          );
          continue;
        }

        const publisherData = await response.json();

        if (publisherData && publisherData.publisher) {
          // Update with new data
          const updateData: any = {
            processing: false,
          };

          // Add description if available
          if (publisherData.publisher.description) {
            updateData.description = publisherData.publisher.description;
          }

          // Add images if available
          if (
            publisherData.publisher.image &&
            publisherData.publisher.imageId
          ) {
            updateData.images = [publisherData.publisher.imageId];
          }

          // Update the publisher
          await payload.update({
            collection: "publishers",
            id: publisherDoc.id,
            data: updateData,
          });
          updatedPublisherIds.push(Number(publisherDoc.id));
        }
      } catch (error) {
        console.error(`Error processing publisher:`, error);
        await delay(PUBLISHER_RATE_LIMIT_DELAY); // Still delay on error
      }
    }

    // Make sure the publishers are linked to the game
    // This ensures that if any processing was done in previous steps that added new publishers,
    // they are properly linked to the game
    if (updatedPublisherIds.length > 0) {
      // First, get the current state of the game to ensure we have latest data
      const currentGameData = await payload.findByID({
        collection: "games",
        id: String(gameId),
      });

      // Get existing publisher IDs, properly handling the case where they might be objects
      const existingPublisherIds =
        currentGameData.publishers?.map((pub) =>
          typeof pub === "object" ? Number(pub.id) : Number(pub)
        ) || [];

      // Combine lists, removing duplicates
      const combinedPublisherIds = [
        ...new Set([...existingPublisherIds, ...updatedPublisherIds]),
      ];

      // Update the game with all publishers
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          publishers: combinedPublisherIds,
        },
      });
    }

    // Mark publisher processing as complete
    await payload.update({
      collection: "games",
      id: String(gameId),
      data: {
        processingPublishers: false,
      },
    });

    // Check if all processing is complete
    await checkAndUpdateOverallProcessingState(gameId, payload);
  } catch (error) {
    console.error(`Error in processPublishers for game ${gameId}:`, error);

    // Even on error, mark publisher processing as complete to prevent hanging state
    try {
      const payload = await getPayload({ config });
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          processingPublishers: false,
        },
      });

      // Check if all processing is complete
      await checkAndUpdateOverallProcessingState(gameId, payload);
    } catch (updateError) {
      console.error(`Error updating publisher processing state:`, updateError);
    }
  }
}

// Helper function to check if all processing is complete and update main processing flag
async function checkAndUpdateOverallProcessingState(
  gameId: string | number,
  payload: any
) {
  try {
    const game = await payload.findByID({
      collection: "games",
      id: String(gameId),
    });

    // If all specific processing flags are false, set main processing flag to false
    if (
      !game.processingPublishers &&
      !game.processingAccessories &&
      !game.processingExpansions &&
      !game.processingImplementations
    ) {
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          processing: false,
        },
      });
    }
  } catch (error) {
    console.error(
      `Error checking overall processing state for game ${gameId}:`,
      error
    );
  }
}
