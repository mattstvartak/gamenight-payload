import { getPayload } from "payload";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { fetchBggGameData, formatBggGameData } from "@/lib/utils/bggUtils";
import { formatRichText } from "@/lib/utils/formatUtils";

// Entity cache to avoid redundant database lookups across imports
const globalEntityCache = new Map();

// Cache for storing processed image IDs
const imageCache = new Map<string, string>();

// Cache for storing entity IDs to avoid duplicate creation
const entityCache = new Map<string, string>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
  }

  try {
    // Local cache for this import session
    const entityCache = new Map(globalEntityCache);
    const payload = await getPayload({ config });

    // Check if game already exists in database by BGG ID
    const numericBggId = Number(id);
    if (!isNaN(numericBggId) && numericBggId > 0) {
      const existingGames = await payload.find({
        collection: "games",
        where: {
          bggId: {
            equals: numericBggId,
          },
        },
        limit: 1,
      });

      if (existingGames.docs.length > 0) {
        console.log(
          `Game with BGG ID ${numericBggId} already exists in database`
        );
        return NextResponse.json(
          {
            message: "Game already exists in database",
            game: existingGames.docs[0],
          },
          { status: 200 }
        );
      }
    }

    // Fetch and process game data from BGG
    const bggGameData = await fetchBggGameData(id);
    if (!bggGameData?.items?.item) {
      return NextResponse.json(
        { error: "Game not found on BoardGameGeek" },
        { status: 404 }
      );
    }

    const formattedGame = await formatBggGameData(bggGameData.items.item);

    // Validate the bggId to avoid validation errors
    let bggId;
    try {
      bggId = Number(formattedGame.id);
      if (isNaN(bggId) || bggId <= 0) {
        // Generate a unique synthetic ID if bggId is invalid
        bggId = Date.now() % 1000000;
        console.warn(
          `Invalid bggId received: ${formattedGame.id}, using synthetic ID: ${bggId}`
        );
      }
    } catch (error) {
      bggId = Date.now() % 1000000;
      console.warn(`Error processing bggId, using synthetic ID: ${bggId}`);
    }

    // Basic game data with explicit type checking
    const gameData: any = {
      bggId: bggId,
      name: formattedGame.name || `Game ${bggId}`, // Ensure name is never empty

      // Make sure all these fields are explicitly set
      yearPublished: formattedGame.yearPublished
        ? Number(formattedGame.yearPublished)
        : undefined,
      minPlayers: formattedGame.minPlayers
        ? Number(formattedGame.minPlayers)
        : undefined,
      maxPlayers: formattedGame.maxPlayers
        ? Number(formattedGame.maxPlayers)
        : undefined,
      minPlaytime: formattedGame.minPlaytime
        ? Number(formattedGame.minPlaytime)
        : undefined,
      maxPlaytime: formattedGame.maxPlaytime
        ? Number(formattedGame.maxPlaytime)
        : undefined,
      playingTime: formattedGame.playingTime
        ? Number(formattedGame.playingTime)
        : undefined,

      // The fields that were reported missing - adding null checks
      minAge: formattedGame.minAge ? Number(formattedGame.minAge) : undefined,
      complexity: formattedGame.complexity
        ? Number(formattedGame.complexity)
        : undefined,
      userRating: formattedGame.userRating
        ? Number(formattedGame.userRating)
        : undefined,
      userRatedCount: formattedGame.userRatedCount
        ? Number(formattedGame.userRatedCount)
        : undefined,
      "official link": formattedGame["official link"] || undefined,
      bggRank: formattedGame.bggRank
        ? Number(formattedGame.bggRank)
        : undefined,

      // Original name handling
      originalName:
        formattedGame.alternateNames?.length > 0
          ? formattedGame.alternateNames[0]
          : undefined,
    };

    // Add language dependence
    if (formattedGame.languageDependence?.level) {
      // Ensure languageDependence is a string that matches one of the allowed enum values
      const level = String(formattedGame.languageDependence.level);
      // Only set if it's a valid value in the enum
      if (["0", "1", "2", "3", "4"].includes(level)) {
        gameData.languageDependence = level;
      } else {
        console.warn(`Invalid language dependence level: ${level}, ignoring`);
      }
    } else {
      // If languageDependence is blank, explicitly set to null/undefined rather than
      // letting an invalid value cause validation errors
      gameData.languageDependence = undefined;
    }

    // Format description
    gameData.description = formatDescriptionAsRichText(
      formattedGame.description || ""
    );

    // Process suggested player count
    if (
      formattedGame.suggestedPlayerCount &&
      Array.isArray(formattedGame.suggestedPlayerCount)
    ) {
      gameData.suggestedPlayerCount = formattedGame.suggestedPlayerCount;
    }

    // Check if this is an expansion
    const isExpansion = formattedGame.type === "boardgameexpansion";

    // Start image upload in parallel with relationship processing
    let imagePromise;
    if (formattedGame.image) {
      imagePromise = uploadImageFromUrl(payload, formattedGame.image);
    }

    // Process all relationships in parallel for speed
    const relationshipPromises = [];

    // Map all relationships to process
    const relationships = [
      { name: "categories", items: formattedGame.categories },
      { name: "mechanics", items: formattedGame.mechanics },
      { name: "designers", items: formattedGame.designers },
      { name: "publishers", items: formattedGame.publishers },
      { name: "artists", items: formattedGame.artists },
      {
        name: "implementations",
        items: formattedGame.implementations,
        collection: "games",
      },
    ];

    // If not an expansion, add expansions relationship
    if (!isExpansion && formattedGame.expansions) {
      relationships.push({
        name: "expansions",
        items: formattedGame.expansions,
        collection: "games",
      });
    }

    // Process all relationships in parallel
    for (const rel of relationships) {
      if (rel.items && Array.isArray(rel.items) && rel.items.length > 0) {
        relationshipPromises.push(
          processRelationships(
            payload,
            rel.name,
            rel.items,
            gameData,
            rel.collection,
            entityCache
          )
        );
      }
    }

    // Wait for all relationship processing to complete in parallel
    await Promise.all([...relationshipPromises].filter(Boolean));

    // Ensure bggId is definitely a number type
    if (!gameData.bggId || isNaN(gameData.bggId)) {
      if (formattedGame.id && typeof formattedGame.id === "string") {
        gameData.bggId = parseInt(formattedGame.id.replace(/\D/g, ""), 10);
      }
      if (!gameData.bggId || isNaN(gameData.bggId)) {
        gameData.bggId = Date.now() % 1000000;
      }
    }
    gameData.bggId = Number(gameData.bggId);

    // Finish image upload if it was started
    if (imagePromise) {
      const imageId = await imagePromise;
      if (imageId) {
        gameData.images = [imageId];
      }
    }

    // Create the game in the database
    const newGame = await payload.create({
      collection: "games",
      data: gameData,
    });

    // Update the game to mark it as processed
    if (newGame?.id) {
      console.log(`Marking game ${newGame.id} as processed`);
      await payload.update({
        collection: "games",
        id: newGame.id,
        data: {
          processed: true,
        },
      });
    }

    // Update global cache with any new entities discovered
    entityCache.forEach((value, key) => {
      globalEntityCache.set(key, value);
    });

    return NextResponse.json(newGame);
  } catch (error) {
    console.error("Error adding game:", error);
    return NextResponse.json({ error: "Error adding game" }, { status: 500 });
  }
}

/**
 * Uploads an image from a URL to Payload CMS
 * @param payload The Payload CMS instance
 * @param imageUrl The URL of the image to upload
 * @returns The created media document ID or null if upload fails
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
 * Format a raw text description into Lexical rich text format
 */
function formatDescriptionAsRichText(description: string) {
  try {
    if (!description || typeof description !== "string") {
      description = "";
    }
    return formatRichText(description);
  } catch (error) {
    console.error("Error formatting rich text:", error);
    return {
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        children: [
          {
            type: "paragraph",
            children: [{ text: "" }],
            version: 1,
          },
        ],
      },
    };
  }
}

/**
 * Optimized function to handle relationship fields
 * Uses batching and caching for better performance
 */
async function processRelationships(
  payload: any,
  collectionName: string,
  items: any[] = [],
  gameData: any,
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
      gameData[collectionName] = relationIds;
    }

    return relationIds.length > 0 ? relationIds : undefined;
  } catch (error) {
    console.error(`Error querying existing ${collectionName}:`, error);
    return undefined;
  }
}

/**
 * Handles POST requests to add a game using a BGG ID
 * This is a simplified endpoint that validates the BGG ID
 * and then reuses the game fetching logic
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const bggId = json?.bggId;

    // Validate bggId
    if (!bggId) {
      return NextResponse.json(
        { error: "BGG ID is required" },
        { status: 400 }
      );
    }

    // Convert to number for validation
    const numericBggId = Number(bggId);

    if (isNaN(numericBggId) || numericBggId <= 0) {
      return NextResponse.json(
        { error: "Invalid BGG ID format. Must be a positive number." },
        { status: 400 }
      );
    }

    // Create a URL to reuse the GET handler
    const url = new URL(request.url);
    url.searchParams.set("id", numericBggId.toString());

    // Create a new request to pass to the GET handler
    const getRequest = new Request(url.toString(), {
      headers: request.headers,
    });

    // Reuse the GET handler to avoid duplicating logic
    return GET(getRequest);
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { error: "Failed to process game addition request" },
      { status: 500 }
    );
  }
}
