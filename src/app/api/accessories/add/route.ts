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
  if (!bggAccessory.name)
    return accessoryId ? `Accessory ${accessoryId}` : "Unknown Accessory";

  // Simple case: direct value access
  if (bggAccessory.name.value) {
    return bggAccessory.name.value;
  }

  // Array case: find primary name or use first item's value
  if (Array.isArray(bggAccessory.name)) {
    const primaryName = bggAccessory.name.find(
      (n: any) => n.type === "primary"
    );

    if (primaryName && primaryName.value) {
      return primaryName.value;
    }

    // If no primary name with value found, try first item with value
    const nameWithValue = bggAccessory.name.find((n: any) => n.value);
    if (nameWithValue) {
      return nameWithValue.value;
    }
  }

  // Fallback
  return accessoryId ? `Accessory ${accessoryId}` : "Unknown Accessory";
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    // Get accessoryId from query params if available
    const queryAccessoryId = url.searchParams.get("id");

    // Initialize payload
    const payload = await getPayload({ config });

    // Get data from request body
    let accessoryId;
    try {
      const data = await request.json();
      accessoryId = data.accessoryId;
    } catch (error) {
      // If parsing fails, check if we have an id from query params
      if (!queryAccessoryId) {
        return NextResponse.json(
          {
            error:
              "Accessory ID is required in request body or as a query parameter",
          },
          { status: 400 }
        );
      }
    }

    // Use query param id if body id is not available
    accessoryId = accessoryId || queryAccessoryId;

    if (!accessoryId) {
      return NextResponse.json(
        { error: "Accessory ID is required" },
        { status: 400 }
      );
    }

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
    console.log(`Fetching data for accessory ID: ${accessoryId}`);

    // Add a slight delay to avoid BGG rate limits
    await delay(300);

    // Fetch BGG data
    let bggResponse;
    try {
      // Fetch accessory data from BGG using our utility function
      // This fetches from https://boardgamegeek.com/xmlapi2/thing?id={accessoryId}
      bggResponse = await fetchBggAccessoryData(accessoryId);

      if (!bggResponse) {
        throw new Error("Failed to fetch accessory data from BGG");
      }
    } catch (error) {
      console.error(
        `Error fetching data from BGG for accessory ID ${accessoryId}:`,
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch data from BoardGameGeek" },
        { status: 500 }
      );
    }

    // Extract the BGG accessory item from the response
    const bggAccessory = bggResponse || {};

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
    console.error("Error in accessories/add endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Add GET handler to support direct URL access with query parameters
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const accessoryId = url.searchParams.get("id");

    if (!accessoryId) {
      return NextResponse.json(
        {
          error:
            "Accessory ID is required as a query parameter (e.g., ?id=145942)",
        },
        { status: 400 }
      );
    }

    // Convert accessoryId to number for bggId field
    const numericAccessoryId = parseInt(accessoryId.toString(), 10);

    if (isNaN(numericAccessoryId)) {
      return NextResponse.json(
        { error: "Accessory ID must be a valid number" },
        { status: 400 }
      );
    }

    // Initialize payload
    const payload = await getPayload({ config });

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
    console.log(`Fetching data for accessory ID: ${accessoryId}`);

    // Add a slight delay to avoid BGG rate limits
    await delay(300);

    // Fetch BGG data - this uses the exact URL format specified: https://boardgamegeek.com/xmlapi2/thing?id={accessoryId}
    let bggResponse;
    try {
      bggResponse = await fetchBggAccessoryData(accessoryId);

      if (!bggResponse) {
        throw new Error("Failed to fetch accessory data from BGG");
      }
    } catch (error) {
      console.error(
        `Error fetching data from BGG for accessory ID ${accessoryId}:`,
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch data from BoardGameGeek" },
        { status: 500 }
      );
    }

    // Extract the BGG accessory item from the response
    const bggAccessory = bggResponse?.items?.item || {};

    // Extract accessory name using the helper function
    const name = extractAccessoryName(bggAccessory, accessoryId);
    console.log("Extracted accessory name:", name);

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
    console.error("Error in accessories/add GET endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
