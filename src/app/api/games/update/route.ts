import { getPayload } from "payload";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { fetchBggGameData, formatBggGameData } from "@/lib/utils/bggUtils";
import { formatRichText } from "@/lib/utils/formatUtils";

// Reuse entity caching mechanism from the add endpoint
const entityCache = new Map<string, string>();
const imageCache = new Map<string, string>();

// Track the last BGG API call time to implement debouncing
let lastBggApiCallTime = 0;
const BGG_API_DEBOUNCE_MS = 500; // 500ms debounce between BGG API calls

/**
 * Utility function to delay execution to respect BGG API rate limits
 */
async function debounceApiBgg() {
  const now = Date.now();
  const timeSinceLastCall = now - lastBggApiCallTime;

  if (timeSinceLastCall < BGG_API_DEBOUNCE_MS) {
    const delayNeeded = BGG_API_DEBOUNCE_MS - timeSinceLastCall;
    console.log(`Debouncing BGG API call for ${delayNeeded}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastBggApiCallTime = Date.now();
}

/**
 * Endpoint to update games or accessories that are still processing
 * Will fetch the latest data from BGG and update the entry
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const collection = searchParams.get("collection") || "games";
  const parentGameId = searchParams.get("parentGameId");

  // Validate collection parameter (only allow games or accessories)
  if (collection !== "games" && collection !== "accessories") {
    return NextResponse.json(
      { error: "Collection must be 'games' or 'accessories'" },
      { status: 400 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { error: `${collection} ID is required` },
      { status: 400 }
    );
  }

  // Process accessories flag - we'll queue accessories processing if true
  const processAccessories = searchParams.get("processAccessories") !== "false";

  try {
    const payload = await getPayload({ config });

    // Check if the item exists
    let item;
    try {
      item = await payload.findByID({
        collection: collection,
        id: id,
      });
    } catch (error) {
      return NextResponse.json(
        { error: `${collection} with ID ${id} not found` },
        { status: 404 }
      );
    }

    // If the item isn't in a processing state, we don't need to update it
    const processingField = collection === "games" ? "processed" : "processing";
    const isProcessing =
      collection === "games"
        ? !(item as any)[processingField]
        : (item as any)[processingField];

    if (!isProcessing) {
      return NextResponse.json({
        message: `${collection} with ID ${id} is not in processing state`,
        item: item,
      });
    }

    // Get the BGG ID to perform the update
    if (!item.bggId) {
      return NextResponse.json(
        { error: `${collection} with ID ${id} does not have a BGG ID` },
        { status: 400 }
      );
    }

    console.log(
      `Updating ${collection} with ID ${id} and BGG ID ${item.bggId}`
    );

    // Debounce BGG API call to avoid rate limiting
    await debounceApiBgg();

    // Fetch the latest data from BGG
    const bggData = await fetchBggGameData(item.bggId);
    if (!bggData?.items?.item) {
      return NextResponse.json(
        { error: `Item not found on BoardGameGeek with ID ${item.bggId}` },
        { status: 404 }
      );
    }

    const formattedData = await formatBggGameData(bggData.items.item);

    // For games collection, process relationships and update
    if (collection === "games") {
      // Process all relationships in parallel
      const relationshipPromises = [];

      // Map all relationships to process
      const relationships = [
        { name: "categories", items: formattedData.categories },
        { name: "mechanics", items: formattedData.mechanics },
        { name: "designers", items: formattedData.designers },
        { name: "publishers", items: formattedData.publishers },
        { name: "artists", items: formattedData.artists },
        {
          name: "implementations",
          items: formattedData.implementations,
          collection: "games",
        },
      ];

      // Add accessories only if processing is enabled
      if (processAccessories && formattedData.accessories) {
        relationships.push({
          name: "accessories",
          items: formattedData.accessories,
          collection: "accessories",
        });
      } else if (
        formattedData.accessories &&
        formattedData.accessories.length > 0
      ) {
        console.log(
          `Skipping ${formattedData.accessories.length} accessories for game "${formattedData.name}" because processAccessories=false`
        );
      }

      // Check if this is an expansion
      const isExpansion = formattedData.type === "boardgameexpansion";

      // If not an expansion, add expansions relationship
      if (!isExpansion && formattedData.expansions) {
        relationships.push({
          name: "expansions",
          items: formattedData.expansions,
          collection: "games",
        });
      }

      // Initialize update data
      const updateData: any = {
        processed: true, // Mark as processed
      };

      // Upload image if available and not already present
      if (formattedData.image && (!item.images || item.images.length === 0)) {
        try {
          const imageId = await uploadImageFromUrl(
            payload,
            formattedData.image
          );
          if (imageId) {
            updateData.images = [imageId];
          }
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }

      // Add basic game data fields
      updateData.name = formattedData.name || item.name;
      updateData.yearPublished = formattedData.yearPublished
        ? Number(formattedData.yearPublished)
        : (item as any).yearPublished;
      updateData.minPlayers = formattedData.minPlayers
        ? Number(formattedData.minPlayers)
        : (item as any).minPlayers;
      updateData.maxPlayers = formattedData.maxPlayers
        ? Number(formattedData.maxPlayers)
        : (item as any).maxPlayers;
      updateData.minPlaytime = formattedData.minPlaytime
        ? Number(formattedData.minPlaytime)
        : (item as any).minPlaytime;
      updateData.maxPlaytime = formattedData.maxPlaytime
        ? Number(formattedData.maxPlaytime)
        : (item as any).maxPlaytime;
      updateData.playingTime = formattedData.playingTime
        ? Number(formattedData.playingTime)
        : (item as any).playingTime;
      updateData.minAge = formattedData.minAge
        ? Number(formattedData.minAge)
        : (item as any).minAge;
      updateData.complexity = formattedData.complexity
        ? Number(formattedData.complexity)
        : (item as any).complexity;
      updateData.userRating = formattedData.userRating
        ? Number(formattedData.userRating)
        : (item as any).userRating;
      updateData.userRatedCount = formattedData.userRatedCount
        ? Number(formattedData.userRatedCount)
        : (item as any).userRatedCount;
      updateData["official link"] =
        formattedData["official link"] || (item as any)["official link"];
      updateData.bggRank = formattedData.bggRank
        ? Number(formattedData.bggRank)
        : (item as any).bggRank;

      // Update description if available and not already present
      if (
        formattedData.description &&
        (!item.description ||
          (typeof item.description === "object" &&
            (!item.description.root ||
              !item.description.root.children ||
              item.description.root.children.length === 0)))
      ) {
        updateData.description = formatRichText(formattedData.description);
      }

      // Process all relationships in parallel
      for (const rel of relationships) {
        if (rel.items && Array.isArray(rel.items) && rel.items.length > 0) {
          if (rel.name === "accessories") {
            console.log(
              `Processing ${rel.items.length} accessories for game "${formattedData.name}" (ID: ${id}, BGG ID: ${item.bggId})`
            );
          }
          relationshipPromises.push(
            processRelationships(
              payload,
              rel.name,
              rel.items,
              updateData,
              rel.collection,
              entityCache
            )
          );
        }
      }

      // Wait for all relationship processing to complete in parallel
      await Promise.all([...relationshipPromises].filter(Boolean));

      // Log accessory processing results
      if (updateData.accessories && updateData.accessories.length > 0) {
        console.log(
          `Successfully processed ${updateData.accessories.length} accessories for game "${updateData.name}" (ID: ${id}, BGG ID: ${item.bggId})`
        );
      } else if (
        formattedData.accessories &&
        formattedData.accessories.length > 0 &&
        processAccessories
      ) {
        console.warn(
          `Warning: Game "${updateData.name}" (ID: ${id}) has ${formattedData.accessories.length} accessories in BGG data but none were saved`
        );
      }

      // Update the game in the database
      const updatedGame = await payload.update({
        collection: "games",
        id: id,
        data: updateData,
      });

      // After processing the current item, check if we need to update the parent game's processed state
      if (parentGameId) {
        try {
          await checkAndUpdateParentProcessedState(payload, parentGameId);
        } catch (parentUpdateError) {
          console.error(
            `Error updating parent game ${parentGameId}:`,
            parentUpdateError
          );
          // Continue execution - don't fail the whole request just because parent update failed
        }
      }

      return NextResponse.json({
        message: "Game updated successfully",
        game: updatedGame,
      });
    }
    // For accessories collection
    else {
      // Initialize update data
      const updateData: any = {
        processing: false, // Mark as not processing anymore
      };

      // Add basic accessory data fields
      updateData.name = formattedData.name || item.name;
      updateData.yearPublished = formattedData.yearPublished
        ? Number(formattedData.yearPublished)
        : item.yearPublished;

      // Upload image if available and not already present
      if (formattedData.image && (!item.images || item.images.length === 0)) {
        try {
          const imageId = await uploadImageFromUrl(
            payload,
            formattedData.image
          );
          if (imageId) {
            updateData.images = [imageId];
          }
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }

      // Update description if available and not already present
      if (
        formattedData.description &&
        (!item.description ||
          (typeof item.description === "object" &&
            (!item.description.root ||
              !item.description.root.children ||
              item.description.root.children.length === 0)))
      ) {
        updateData.description = formatRichText(formattedData.description);
      }

      // Process publishers relationship
      if (formattedData.publishers && formattedData.publishers.length > 0) {
        const publisherIds = await processRelationships(
          payload,
          "publishers",
          formattedData.publishers,
          updateData,
          "publishers",
          entityCache
        );
        if (publisherIds && publisherIds.length > 0) {
          updateData.publishers = publisherIds;
        }
      }

      // Update the accessory in the database
      const updatedAccessory = await payload.update({
        collection: "accessories",
        id: id,
        data: updateData,
      });

      // After processing the current item, check if we need to update the parent game's processed state
      if (parentGameId) {
        try {
          await checkAndUpdateParentProcessedState(payload, parentGameId);
        } catch (parentUpdateError) {
          console.error(
            `Error updating parent game ${parentGameId}:`,
            parentUpdateError
          );
          // Continue execution - don't fail the whole request just because parent update failed
        }
      }

      return NextResponse.json({
        message: "Accessory updated successfully",
        accessory: updatedAccessory,
      });
    }
  } catch (error) {
    console.error(`Error updating ${collection}:`, error);
    return NextResponse.json(
      { error: `Error updating ${collection}` },
      { status: 500 }
    );
  }
}

/**
 * Process relationships for a game or accessory
 * Based on the implementation from games/add/route.ts
 */
async function processRelationships(
  payload: any,
  collectionName: string,
  items: any[] = [],
  updateData: any,
  targetCollection?: string,
  entityCache?: Map<string, any>
): Promise<any[] | undefined> {
  if (!items || !items.length) {
    return undefined;
  }

  const relationIds: any[] = [];
  const collection = targetCollection || collectionName;

  console.log(
    `Processing ${collectionName} relationships with ${items.length} items`
  );

  // Filter out invalid items
  const validItems = items.filter(
    (item) => item && item.name && typeof item.name === "string"
  );

  if (validItems.length === 0) {
    console.warn(`No valid items found for ${collectionName} after filtering`);
    return undefined;
  }

  // Deduplicate items by name
  const uniqueItems = Array.from(
    new Map(validItems.map((item) => [item.name.trim(), item])).values()
  );

  if (uniqueItems.length === 0) {
    return undefined;
  }

  console.log(
    `${uniqueItems.length} unique ${collectionName} items after deduplication`
  );

  // Find all existing items in a single query with an array of names
  const itemNames = uniqueItems.map((item) => item.name.trim());
  try {
    const existingItemsQuery = await payload.find({
      collection: collection,
      where: {
        name: {
          in: itemNames,
        },
      },
      limit: 100, // Adjust based on expected maximum
    });

    // Create a map of existing items by name for quick lookups
    const existingItemsMap = new Map();
    if (existingItemsQuery.docs) {
      existingItemsQuery.docs.forEach((doc: { name: string; id: string }) => {
        existingItemsMap.set(doc.name, doc.id);
        // Also add to entity cache
        if (entityCache) {
          entityCache.set(`${collection}:${doc.name}`, doc.id);
        }
      });
    }

    // Create items that don't exist yet
    const itemsToCreate = uniqueItems.filter(
      (item) => !existingItemsMap.has(item.name.trim())
    );

    console.log(
      `${itemsToCreate.length} ${collectionName} items need to be created`
    );

    // Process items to create in batches for better performance
    const batchSize = 10;
    const createPromises = [];

    for (let i = 0; i < itemsToCreate.length; i += batchSize) {
      const batch = itemsToCreate.slice(i, i + batchSize);

      // Process each batch in parallel
      const batchPromises = batch.map(async (item) => {
        try {
          // Check cache first
          const cacheKey = `${collection}:${item.name.trim()}`;
          if (entityCache && entityCache.has(cacheKey)) {
            return {
              name: item.name.trim(),
              id: entityCache.get(cacheKey),
            };
          }

          // Generate a valid bggId if needed
          let bggId;
          if (item.id && !isNaN(Number(item.id)) && Number(item.id) > 0) {
            bggId = Number(item.id);
          } else if (collection === "games") {
            // Only generate synthetic IDs for games
            bggId = (Date.now() % 1000000) + Math.floor(Math.random() * 1000);
            console.log(
              `Generated synthetic bggId ${bggId} for game "${item.name}"`
            );
          }

          // Create the new item
          const newItemData: any = {
            name: item.name.trim(),
          };

          // Only add fields that we know are valid
          if (bggId !== undefined) {
            newItemData.bggId = bggId;
          }

          // For games collection, set processing status
          if (collection === "games") {
            newItemData.processed = false;
          }

          console.log(`Creating new ${collection}: ${item.name}`);

          try {
            const newItem = await payload.create({
              collection: collection,
              data: newItemData,
            });

            // Cache the result
            if (entityCache) {
              entityCache.set(cacheKey, newItem.id);
            }

            return { name: item.name.trim(), id: newItem.id };
          } catch (createError) {
            console.error(
              `Error creating ${collection} "${item.name}":`,
              createError
            );

            // Try to find the item one more time - it might have been created in parallel
            const retryFind = await payload.find({
              collection: collection,
              where: {
                name: { equals: item.name.trim() },
              },
              limit: 1,
            });

            if (retryFind?.docs?.length > 0) {
              const id = retryFind.docs[0].id;
              if (entityCache) {
                entityCache.set(cacheKey, id);
              }
              return { name: item.name.trim(), id };
            }

            return null;
          }
        } catch (error) {
          console.error(
            `Error processing ${collection} "${item.name}":`,
            error
          );
          return null;
        }
      });

      createPromises.push(...batchPromises);
    }

    // Wait for all creates to complete
    const createdItems = await Promise.all(createPromises);

    // Add created items to the map
    createdItems.forEach((item) => {
      if (item) {
        existingItemsMap.set(item.name, item.id);
      }
    });

    // Collect all IDs for the relationship
    uniqueItems.forEach((item) => {
      const id = existingItemsMap.get(item.name.trim());
      if (id) {
        relationIds.push(id);
      }
    });

    if (relationIds.length > 0) {
      // Log what we're adding
      console.log(
        `Adding ${relationIds.length} ${collectionName} relationships`
      );
      updateData[collectionName] = relationIds;
    }

    return relationIds.length > 0 ? relationIds : undefined;
  } catch (error) {
    console.error(`Error querying existing ${collectionName}:`, error);
    return undefined;
  }
}

/**
 * Upload an image from a URL
 * Reusing the function from games/add/route.ts
 */
async function uploadImageFromUrl(
  payload: any,
  imageUrl?: string
): Promise<string | null> {
  // If no image URL provided, return null
  if (!imageUrl) {
    console.log("No image URL provided");
    return null;
  }

  try {
    console.log(`Uploading image from URL: ${imageUrl}`);

    // Create a cache key based on the image URL
    const cacheKey = `image:${imageUrl}`;

    // Check if we already processed this image
    if (imageCache.has(cacheKey)) {
      console.log(`Using cached image for ${imageUrl}`);
      return imageCache.get(cacheKey) || null;
    }

    // Extract a valid filename from the URL
    let filename = imageUrl.split("/").pop() || "image.jpg";

    // Remove any query parameters from filename
    if (filename.includes("?")) {
      filename = filename.split("?")[0];
    }

    // Make sure the filename isn't too long for database
    if (filename.length > 100) {
      filename = filename.substring(0, 90) + ".jpg";
    }

    // Make sure the filename is safe
    filename = filename.replace(/[^\w\d.-]/g, "_");

    // Add extension if missing
    if (!filename.includes(".")) {
      filename += ".jpg";
    }

    console.log(`Using filename: ${filename}`);

    // Check if media with this filename already exists
    try {
      const existingMedia = await payload.find({
        collection: "media",
        where: {
          filename: {
            equals: filename,
          },
        },
        limit: 1,
      });

      if (existingMedia?.docs?.length > 0) {
        const mediaId = existingMedia.docs[0].id;
        console.log(`Found existing media with ID: ${mediaId}`);
        imageCache.set(cacheKey, mediaId);
        return mediaId;
      }
    } catch (findError) {
      console.error("Error checking for existing media:", findError);
      // Continue with creating new media
    }

    // Try to create a media entry with a URL reference
    try {
      const mediaDoc = await payload.create({
        collection: "media",
        data: {
          alt: filename,
          filename: filename,
          url: imageUrl,
        },
      });

      if (mediaDoc?.id) {
        console.log(`Created media with ID: ${mediaDoc.id}`);
        imageCache.set(cacheKey, mediaDoc.id);
        return mediaDoc.id;
      }
    } catch (createError) {
      console.error("Error creating media with URL:", createError);
      // If this fails, we'll try the next approach
    }

    // If we get here, all attempts failed
    console.warn(`Failed to upload image from URL: ${imageUrl}`);
    return null;
  } catch (error) {
    console.error("Error in uploadImageFromUrl:", error);
    return null;
  }
}

/**
 * POST version of the update endpoint
 * Allows for updating multiple games or accessories at once
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const ids = json?.ids;
    const collection = json?.collection || "games";
    const processAccessories = json?.processAccessories !== false; // Default to true if not specified

    // Validate collection parameter
    if (collection !== "games" && collection !== "accessories") {
      return NextResponse.json(
        { error: "Collection must be 'games' or 'accessories'" },
        { status: 400 }
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Array of item IDs is required" },
        { status: 400 }
      );
    }

    // Process each ID by creating a GET request for each
    const results = [];
    const errors = [];

    for (const id of ids) {
      try {
        // Using our own GET method logic instead of creating a new request
        // This allows us to properly debounce BGG API calls
        const url = new URL(request.url);
        url.searchParams.set("id", id);
        url.searchParams.set("collection", collection);

        // Pass the processAccessories flag
        url.searchParams.set(
          "processAccessories",
          processAccessories.toString()
        );

        // Use our debounce function before each API call
        await debounceApiBgg();

        const result = await GET(
          new Request(url.toString(), {
            headers: request.headers,
          })
        );

        const data = await result.json();

        results.push({
          id,
          success: result.ok,
          data,
        });
      } catch (error) {
        console.error(`Error processing ${collection} ID ${id}:`, error);
        errors.push({
          id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} ${collection}, with ${errors.length} errors`,
      results,
      errors,
    });
  } catch (error) {
    console.error(`Error in POST handler:`, error);
    return NextResponse.json(
      { error: "Failed to process update request" },
      { status: 500 }
    );
  }
}

/**
 * Checks if all related items of a game are processed and updates the game's processed state
 * @param payload The Payload CMS instance
 * @param gameId The ID of the parent game to check
 */
async function checkAndUpdateParentProcessedState(
  payload: any,
  gameId: string
) {
  console.log(
    `Checking processed state of related items for parent game ${gameId}`
  );

  try {
    // Get the parent game with its related items
    const parentGame = await payload.findByID({
      collection: "games",
      id: gameId,
      depth: 0, // We don't need full depth for this check
    });

    if (!parentGame) {
      console.error(`Parent game ${gameId} not found`);
      return;
    }

    // Skip if already processed
    if (parentGame.processed === true) {
      console.log(`Parent game ${gameId} is already marked as processed`);
      return;
    }

    let allItemsProcessed = true;
    let unprocessedItems = 0;

    // Check expansions
    if (parentGame.expansions && parentGame.expansions.length > 0) {
      // Need to fetch the actual expansions since depth:0 only gives IDs
      const expansionIds = parentGame.expansions.map((exp: any) =>
        typeof exp === "number" ? exp : exp.id
      );

      if (expansionIds.length > 0) {
        const expansions = await payload.find({
          collection: "games",
          where: {
            id: {
              in: expansionIds,
            },
          },
          depth: 0,
        });

        for (const expansion of expansions.docs) {
          if (expansion.processed !== true) {
            allItemsProcessed = false;
            unprocessedItems++;
          }
        }
      }
    }

    // Check accessories
    if (
      allItemsProcessed &&
      parentGame.accessories &&
      parentGame.accessories.length > 0
    ) {
      // Need to fetch the actual accessories since depth:0 only gives IDs
      const accessoryIds = parentGame.accessories.map((acc: any) =>
        typeof acc === "number" ? acc : acc.id
      );

      if (accessoryIds.length > 0) {
        const accessories = await payload.find({
          collection: "accessories",
          where: {
            id: {
              in: accessoryIds,
            },
          },
          depth: 0,
        });

        for (const accessory of accessories.docs) {
          // Accessories use 'processing' field, not 'processed'
          if (accessory.processing === true) {
            allItemsProcessed = false;
            unprocessedItems++;
          }
        }
      }
    }

    // Check implementations
    if (
      allItemsProcessed &&
      parentGame.implementations &&
      parentGame.implementations.length > 0
    ) {
      // Need to fetch the actual implementations since depth:0 only gives IDs
      const implementationIds = parentGame.implementations.map((impl: any) =>
        typeof impl === "number" ? impl : impl.id
      );

      if (implementationIds.length > 0) {
        const implementations = await payload.find({
          collection: "games",
          where: {
            id: {
              in: implementationIds,
            },
          },
          depth: 0,
        });

        for (const implementation of implementations.docs) {
          if (implementation.processed !== true) {
            allItemsProcessed = false;
            unprocessedItems++;
          }
        }
      }
    }

    // Update the parent game's processed state if all related items are processed
    if (allItemsProcessed) {
      console.log(
        `All related items for game ${gameId} are processed, updating parent game's processed state`
      );
      await payload.update({
        collection: "games",
        id: gameId,
        data: {
          processed: true,
        },
      });
      console.log(
        `Successfully updated processed state for parent game ${gameId}`
      );
    } else {
      console.log(
        `${unprocessedItems} related items for game ${gameId} are still processing`
      );
    }
  } catch (error) {
    console.error(`Error checking related items for game ${gameId}:`, error);
    throw error;
  }
}
