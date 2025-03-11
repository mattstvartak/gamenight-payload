import { NextResponse } from "next/server";
import { fetchBggAccessoryData } from "@/lib/utils/bggUtils";
import { delay } from "@/lib/utils/asyncUtils";
import { getPayload } from "payload";
import config from "@payload-config";
import { formatRichText } from "@/lib/utils/formatUtils";
import { extractBggEntityLinks } from "@/lib/utils/bggUtils";
import { unlink } from "fs/promises";
import { createPayloadFile, downloadImageToTemp } from "@/lib/utils/fileUtils";

/**
 * Helper function to extract accessory name from BGG data
 * @param bggAccessory BGG accessory data
 * @param accessoryId Fallback ID for unknown accessories
 * @returns The accessory name
 */
function extractAccessoryName(
  bggAccessory: any,
  accessoryId?: string | number
): string {
  if (!bggAccessory || !bggAccessory.name) {
    return `Accessory ${accessoryId || "Unknown"}`;
  }

  // Handle when name is an array
  if (Array.isArray(bggAccessory.name)) {
    // Find the primary name or the first name in the array
    const primaryName = bggAccessory.name.find(
      (nameObj: any) => nameObj.type === "primary"
    );
    return (
      primaryName?.value ||
      bggAccessory.name[0]?.value ||
      `Accessory ${accessoryId || "Unknown"}`
    );
  }

  // Handle when name is a string
  if (typeof bggAccessory.name === "string") {
    return bggAccessory.name;
  }

  // Handle when name is an object
  if (typeof bggAccessory.name === "object" && bggAccessory.name?.value) {
    return bggAccessory.name.value;
  }

  // Default fallback
  return `Accessory ${accessoryId || "Unknown"}`;
}

// Support both direct accessory processing and game accessory enhancement
export async function POST(request: Request) {
  try {
    // Try to parse the request body first to see what mode we're in
    const data = await request.json();

    // If we have gameId, we're processing accessories for a game
    if (data.gameId) {
      return processAccessoriesForGame(data.gameId, request);
    }
    // If we have accessoryId, we're directly processing an accessory
    else if (data.accessoryId) {
      return processAccessoryById(data.accessoryId, request);
    }

    return NextResponse.json(
      { error: "Either gameId or accessoryId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in accessories/add endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process accessory" },
      { status: 500 }
    );
  }
}

// Process accessories for a game in the background
async function processAccessoriesForGame(
  gameId: string | number,
  request: Request
) {
  // Fire and forget the actual processing
  processAccessories(gameId, request).catch((error) => {
    console.error(`Error processing accessories for game ${gameId}:`, error);
  });

  return NextResponse.json({
    success: true,
    message: "Accessory processing started in background",
  });
}

// Process a single accessory by BGG ID
async function processAccessoryById(
  accessoryId: string | number,
  request: Request
) {
  try {
    const url = new URL(request.url);

    // Initialize payload
    const payload = await getPayload({ config });

    // Convert accessoryId to number for bggId field
    const numericAccessoryId = parseInt(accessoryId.toString(), 10);

    if (isNaN(numericAccessoryId)) {
      return NextResponse.json(
        { error: "Accessory ID must be a valid number" },
        { status: 400 }
      );
    }

    // Check if accessory already exists
    const existingAccessory = await payload.find({
      collection: "accessories",
      where: {
        bggId: {
          equals: numericAccessoryId,
        },
      },
    });

    if (existingAccessory.docs.length > 0) {
      // Accessory already exists, return it
      return NextResponse.json(existingAccessory.docs[0]);
    }

    // Accessory doesn't exist, fetch data from BGG
    // Add a slight delay to avoid BGG rate limits
    await delay(300);

    // Fetch BGG data
    const bggAccessory = await fetchBggAccessoryData(accessoryId);

    if (!bggAccessory) {
      throw new Error("Failed to fetch accessory data from BGG");
    }

    // Extract accessory name using the helper function
    const name = extractAccessoryName(bggAccessory, accessoryId);

    // Extract description if available
    let description = "";
    if (bggAccessory.description) {
      description = bggAccessory.description;
    }

    // Extract publishers
    const publishers = extractBggEntityLinks(
      bggAccessory,
      "boardgamepublisher"
    );

    // Upload image if available
    let imageId = null;
    if (bggAccessory && bggAccessory.image) {
      try {
        // Download the image to a temp file
        const tempFilePath = await downloadImageToTemp(bggAccessory.image);

        if (tempFilePath) {
          // Create a payload file
          const imageFile = await createPayloadFile(tempFilePath, name);

          // Upload to Payload
          const uploadedImage = await payload.create({
            collection: "media",
            data: {
              alt: name,
            },
            file: imageFile,
          });

          imageId = uploadedImage.id;

          // Clean up temp file
          await unlink(tempFilePath).catch(console.error);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    // Create cache for entities
    interface EntityCache {
      publishers: Record<string, number>;
    }

    const entityCache: EntityCache = {
      publishers: {},
    };

    // Process publishers
    const publisherIds = [];
    if (publishers && Array.isArray(publishers)) {
      for (const publisher of publishers) {
        if (!publisher || !publisher.value) continue;

        // Check if publisher already exists
        const existingPublishers = await payload.find({
          collection: "publishers",
          where: {
            name: {
              equals: publisher.value,
            },
          },
        });

        if (existingPublishers.docs.length > 0) {
          // Publisher exists, use its ID
          publisherIds.push(existingPublishers.docs[0].id);
          entityCache.publishers[publisher.value] =
            existingPublishers.docs[0].id;

          // Update with BGG ID if needed
          if (publisher.id && !existingPublishers.docs[0].bggId) {
            await payload.update({
              collection: "publishers",
              id: existingPublishers.docs[0].id,
              data: {
                bggId: publisher.id,
              },
            });
          }
        } else {
          // Create a new publisher
          try {
            const newPublisher = await payload.create({
              collection: "publishers",
              data: {
                name: publisher.value,
                bggId: publisher.id,
              },
            });

            if (newPublisher?.id) {
              publisherIds.push(newPublisher.id);
              entityCache.publishers[publisher.value] = newPublisher.id;
            }
          } catch (error) {
            console.error(
              `Error creating publisher ${publisher.value}:`,
              error
            );
          }
        }
      }
    }

    // Extract year published if available
    let yearPublished;
    if (bggAccessory.yearpublished?.value) {
      yearPublished = parseInt(bggAccessory.yearpublished.value.toString());
    }

    // Prepare accessory data
    const newAccessoryData: any = {
      bggId: numericAccessoryId,
      name: name,
      publishers: publisherIds.length > 0 ? publisherIds : undefined,
      yearPublished: yearPublished,
      processing: false,
    };

    // Add description if available - format the same way as games
    if (description) {
      newAccessoryData.description = formatRichText(description);
    }

    // Add image if available
    if (imageId) {
      newAccessoryData.images = [imageId];
    }

    // Create the accessory
    try {
      const newAccessory = await payload.create({
        collection: "accessories",
        data: newAccessoryData,
      });

      return NextResponse.json({
        accessory: newAccessory,
        debug: {
          originalName: bggAccessory.name,
          processedName: name,
          nameType: typeof bggAccessory.name,
          isArray: Array.isArray(bggAccessory.name),
        },
      });
    } catch (error) {
      console.error("Error creating accessory:", error);
      return NextResponse.json(
        { error: "Failed to create accessory" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in processAccessoryById:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Process all accessories for a game
async function processAccessories(gameId: string | number, request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the game data to access accessories
    const game = await payload.findByID({
      collection: "games",
      id: String(gameId),
    });

    if (!game || !game.accessories || game.accessories.length === 0) {
      // Even though there are no accessories, update the processing flag
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          processingAccessories: false,
        },
      });

      // Check if all processing is complete
      await checkAndUpdateOverallProcessingState(gameId, payload);

      return;
    }

    const ACCESSORY_RATE_LIMIT_DELAY = 500; // 500ms between accessory requests
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "";
    const accessoryApiUrl = `${protocol}://${host}/api/bgg/accessory`;

    // Track any accessories that get updated with new data
    const updatedAccessoryIds = [];

    for (const accessoryId of game.accessories) {
      try {
        // Ensure accessoryId is a string or number
        const accessoryIdValue =
          typeof accessoryId === "object" && accessoryId !== null
            ? accessoryId.id
            : accessoryId;

        // Skip if not a valid ID
        if (!accessoryIdValue) {
          continue;
        }

        // Get the accessory from database
        const accessoryDoc = await payload.findByID({
          collection: "accessories",
          id: String(accessoryIdValue),
        });

        // Add this accessory to the list of processed accessories
        updatedAccessoryIds.push(Number(accessoryIdValue));

        // Skip if we don't have a BGG ID, if processing is explicitly set to false,
        // or if we already have details like description or images
        if (
          !accessoryDoc.bggId ||
          accessoryDoc.processing === false ||
          accessoryDoc.description ||
          (accessoryDoc.images && accessoryDoc.images.length > 0)
        ) {
          if (accessoryDoc.processing === false) {
            continue;
          }
        }

        // Fetch additional accessory info
        await delay(ACCESSORY_RATE_LIMIT_DELAY);

        const response = await fetch(accessoryApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessoryId: accessoryDoc.bggId }),
        });

        if (!response.ok) {
          continue;
        }

        const accessoryData = await response.json();

        if (accessoryData && accessoryData.accessory) {
          // Update with new data
          const updateData: any = {
            processing: false,
          };

          // Add description if available
          if (accessoryData.accessory.description) {
            updateData.description = accessoryData.accessory.description;
          }

          // Add images if available
          if (
            accessoryData.accessory.image &&
            accessoryData.accessory.imageId
          ) {
            updateData.images = [accessoryData.accessory.imageId];
          }

          // Update the accessory
          await payload.update({
            collection: "accessories",
            id: accessoryDoc.id,
            data: updateData,
          });
        }
      } catch (error) {
        await delay(ACCESSORY_RATE_LIMIT_DELAY); // Still delay on error
      }
    }

    // Make sure the accessories are linked to the game
    // This ensures that if any processing was done in previous steps that added new accessories,
    // they are properly linked to the game
    if (updatedAccessoryIds.length > 0) {
      // First, get the current state of the game to ensure we have latest data
      const currentGameData = await payload.findByID({
        collection: "games",
        id: String(gameId),
      });

      // Get existing accessory IDs, properly handling the case where they might be objects
      const existingAccessoryIds =
        currentGameData.accessories?.map((acc) =>
          typeof acc === "object" ? Number(acc.id) : Number(acc)
        ) || [];

      // Combine lists, removing duplicates
      const combinedAccessoryIds = [
        ...new Set([...existingAccessoryIds, ...updatedAccessoryIds]),
      ];

      // Update the game with all accessories
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          accessories: combinedAccessoryIds,
        },
      });
    }

    // Mark accessory processing as complete
    await payload.update({
      collection: "games",
      id: String(gameId),
      data: {
        processingAccessories: false,
      },
    });

    // Check if all processing is complete
    await checkAndUpdateOverallProcessingState(gameId, payload);
  } catch (error) {
    console.error(`Error in processAccessories for game ${gameId}:`, error);

    // Even on error, mark accessory processing as complete to prevent hanging state
    try {
      const payload = await getPayload({ config });
      await payload.update({
        collection: "games",
        id: String(gameId),
        data: {
          processingAccessories: false,
        },
      });

      // Check if all processing is complete
      await checkAndUpdateOverallProcessingState(gameId, payload);
    } catch (updateError) {
      console.error(`Error updating accessory processing state:`, updateError);
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

// Legacy support for GET requests
export async function GET(request: Request) {
  const url = new URL(request.url);
  const accessoryId = url.searchParams.get("id");

  if (!accessoryId) {
    return NextResponse.json(
      { error: "Accessory ID is required as a query parameter" },
      { status: 400 }
    );
  }

  return processAccessoryById(accessoryId, request);
}
