import { NextResponse } from "next/server";
import { fetchXMLAndConvertToObject } from "@/lib/utils/fetchXMLAndConvertToJson";
import { getPayload } from "payload";
import config from "@payload-config";
import path from "path";
import fs from "fs";
import { unlink, readFile, stat } from "fs/promises";
import os from "os";
import https from "https";
import { Types } from "@/collections/Types";

// Helper function to delay execution (for rate limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Formats a plain text string into the Lexical rich text editor format
 * Used for all description fields across collections
 */
function formatRichText(text: string) {
  if (!text) return undefined;

  // Decode HTML entities and ASCII codes to proper characters
  const decodeText = (str: string) => {
    return (
      str
        // Handle common HTML entities
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        // Handle numeric HTML entities (like &#nnnn;)
        .replace(/&#(\d+);/g, (match, dec) =>
          String.fromCharCode(parseInt(dec, 10))
        )
        // Handle hex HTML entities (like &#xhhhh;)
        .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
    );
  };

  // Clean up the text by converting ASCII codes and HTML entities
  const cleanedText = decodeText(text);

  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: cleanedText,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// Function to create a payload file object from a file path with folder organization
async function createPayloadFile(filePath: string, gameName: string) {
  const fileBuffer = await readFile(filePath);
  const fileStats = await stat(filePath);
  const fileExtension = path.extname(filePath).slice(1);

  // Create sanitized name for folder
  const sanitizedName = gameName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  // Create new filename with folder path but generic image name
  const fileName = `${sanitizedName}/cover.${fileExtension}`;

  return {
    data: fileBuffer,
    size: fileStats.size,
    name: fileName,
    mimetype: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
  };
}

// Function to download an image to a temp file
async function downloadImageToTemp(url: string): Promise<string | null> {
  try {
    // Create a temp file path
    const tempDir = os.tmpdir();
    const fileExtension = url.split(".").pop()?.split("?")[0] || "jpg";
    const tempFilePath = path.join(
      tempDir,
      `temp_${Date.now()}.${fileExtension}`
    );

    // Create write stream
    const fileStream = fs.createWriteStream(tempFilePath);

    // Download the file
    await new Promise<void>((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`)
            );
            return;
          }

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });

          fileStream.on("error", (err: Error) => {
            unlink(tempFilePath).catch(console.error);
            reject(err);
          });
        })
        .on("error", (err: Error) => {
          unlink(tempFilePath).catch(console.error);
          reject(err);
        });
    });

    return tempFilePath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

/**
 * Adds a game from BoardGameGeek to the Payload CMS database
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { bggId } = await request.json();

    // Get the request URL to check for query parameters
    const url = new URL(request.url);
    const isProcessingExpansions =
      url.searchParams.get("processingExpansions") === "true";

    if (!bggId) {
      return NextResponse.json(
        { error: "BGG ID is required" },
        { status: 400 }
      );
    }

    // Check if game already exists
    const existingGame = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: bggId,
        },
      },
    });

    let game;
    let needsProcessing = false;

    if (existingGame.docs.length > 0) {
      game = existingGame.docs[0];

      // If game already exists and processing is complete, return it immediately
      if (game.processing === false) {
        console.log(
          `Game ${game.name} (ID: ${game.id}) already exists and is fully processed, returning existing data`
        );
        return NextResponse.json({
          game,
          message: "Game already exists and is fully processed",
          alreadyProcessed: true,
        });
      }

      // Always process relationships when a game exists but is still processing
      needsProcessing = true;
      console.log(
        `Game ${game.name} (ID: ${game.id}) exists but still processing, continuing with relationships processing`
      );
    }

    // If we're handling an expansion, add a delay to respect BGG rate limits
    if (isProcessingExpansions) {
      await delay(1000); // Add a 1 second delay for BGG API calls
    }

    // Fetch game data from BGG
    let bggGame;
    try {
      console.log(`Fetching BGG data for game ID: ${bggId}`);
      bggGame = await fetchXMLAndConvertToObject(
        `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`
      );

      // Check if the data has the expected structure
      if (!bggGame || typeof bggGame !== "object") {
        return NextResponse.json(
          { error: "Invalid data received from BGG" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(`Error fetching data from BGG for ID ${bggId}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch data from BoardGameGeek" },
        { status: 500 }
      );
    }

    // Extract all related data
    const publisherLinks = Array.isArray(bggGame?.link)
      ? bggGame.link.filter((item: any) => item?.type === "boardgamepublisher")
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgamepublisher"
        ? [bggGame.link]
        : [];

    // Extract publisher IDs and names
    const publishers = publisherLinks.map((publisher: any) => ({
      id: publisher?.id,
      value: publisher?.value,
    }));

    // Extract designer links
    const designerLinks = Array.isArray(bggGame?.link)
      ? bggGame.link.filter((item: any) => item?.type === "boardgamedesigner")
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgamedesigner"
        ? [bggGame.link]
        : [];

    // Extract designer IDs and names
    const designers = designerLinks.map((designer: any) => ({
      id: designer?.id,
      value: designer?.value,
    }));

    // Extract category links
    const categoryLinks = Array.isArray(bggGame?.link)
      ? bggGame.link.filter((item: any) => item?.type === "boardgamecategory")
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgamecategory"
        ? [bggGame.link]
        : [];

    // Extract category IDs and names
    const categories = categoryLinks.map((category: any) => ({
      id: category?.id,
      value: category?.value,
    }));

    // Extract mechanic links
    const mechanicLinks = Array.isArray(bggGame?.link)
      ? bggGame.link.filter((item: any) => item?.type === "boardgamemechanic")
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgamemechanic"
        ? [bggGame.link]
        : [];

    // Extract mechanic IDs and names
    const mechanics = mechanicLinks.map((mechanic: any) => ({
      id: mechanic?.id,
      value: mechanic?.value,
    }));

    // Extract artist links
    const artistLinks = Array.isArray(bggGame?.link)
      ? bggGame.link.filter((item: any) => item?.type === "boardgameartist")
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgameartist"
        ? [bggGame.link]
        : [];

    // Extract artist IDs and names
    const artists = artistLinks.map((artist: any) => ({
      id: artist?.id,
      value: artist?.value,
    }));

    // Extract expansion information
    const expansions = Array.isArray(bggGame?.link)
      ? bggGame.link
          .filter((item: any) => item?.type === "boardgameexpansion")
          .map((expansion: any) => ({
            id: expansion?.id,
            value: expansion?.value,
          }))
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgameexpansion"
        ? [{ id: bggGame.link?.id, value: bggGame.link?.value }]
        : [];

    // Extract implementation information (base games that this expansion is for)
    const implementations = Array.isArray(bggGame?.link)
      ? bggGame.link
          .filter((item: any) => item?.type === "boardgameimplementation")
          .map((implementation: any) => ({
            id: implementation?.id,
            value: implementation?.value,
          }))
      : bggGame?.link &&
          typeof bggGame.link === "object" &&
          bggGame.link?.type === "boardgameimplementation"
        ? [{ id: bggGame.link?.id, value: bggGame.link?.value }]
        : [];

    // Extract type information - if BGG doesn't have boardgametype specifically,
    // we'll use the general type field as a fallback
    const typeNames: string[] = [];
    const types: { id?: number; value: string }[] = [];
    if (bggGame?.type) {
      // For the general type field, we don't have a direct BGG ID
      typeNames.push(bggGame.type);
      types.push({ value: bggGame.type });
    }
    // Also check if there are any boardgametype entries in the link array
    if (Array.isArray(bggGame?.link)) {
      const boardgameTypes = bggGame.link
        .filter((item: any) => item?.type === "boardgametype")
        .map((type: any) => ({
          id: type?.id,
          value: type?.value,
        }));

      for (const type of boardgameTypes) {
        if (type?.value && !typeNames.includes(type.value)) {
          typeNames.push(type.value);
          types.push({ id: Number(type.id), value: type.value });
        }
      }
    } else if (
      bggGame?.link &&
      typeof bggGame.link === "object" &&
      bggGame.link?.type === "boardgametype" &&
      bggGame.link?.value
    ) {
      typeNames.push(bggGame.link.value);
      types.push({ id: Number(bggGame.link.id), value: bggGame.link.value });
    }

    // Create or find publishers
    const publisherIds = [];
    if (publishers && Array.isArray(publishers)) {
      for (const publisher of publishers) {
        if (!publisher || !publisher.value) continue; // Skip if publisher or publisher.value is undefined

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

          // We found existing publisher, update with BGG ID if needed
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
          // Fetch additional publisher info from BGG family API
          try {
            // Add a slight delay to avoid BGG rate limits
            await delay(300);

            console.log(
              `Fetching detailed publisher info for ${publisher.value} (ID: ${publisher.id})`
            );

            let publisherData;
            try {
              publisherData = await fetchXMLAndConvertToObject(
                `https://boardgamegeek.com/xmlapi2/family?id=${publisher.id}`
              );

              // Check if the data has the expected structure
              if (!publisherData || typeof publisherData !== "object") {
                console.log(
                  `Invalid publisher data format for ${publisher.value}, proceeding with basic info only`
                );
                publisherData = {};
              }
            } catch (error) {
              console.error(
                `Error fetching publisher details for ${publisher.value}:`,
                error
              );
              publisherData = {};
            }

            // Extract additional information if available
            const description = publisherData?.description || "";
            let imageUrl = null;

            // Check if there's an image in the response
            if (publisherData?.image) {
              imageUrl = publisherData.image;
            }

            // Prepare the publisher data with description and BGG ID
            const publisherDataToCreate: any = {
              name: publisher.value,
              bggId: publisher.id,
              description: description
                ? formatRichText(description)
                : undefined,
            };

            // Create the publisher in our database
            const newPublisher = await payload.create({
              collection: "publishers",
              data: publisherDataToCreate,
            });

            // If we found an image, download and attach it
            if (imageUrl) {
              try {
                const tempFilePath = await downloadImageToTemp(imageUrl);

                if (tempFilePath) {
                  // Create a payload file
                  const imageFile = await createPayloadFile(
                    tempFilePath,
                    publisher.value
                  );

                  // Upload to Payload
                  const uploadedImage = await payload.create({
                    collection: "media",
                    data: {
                      alt: publisher.value,
                    },
                    file: imageFile,
                  });

                  // Update the publisher with the image
                  await payload.update({
                    collection: "publishers",
                    id: newPublisher.id,
                    data: {
                      images: [uploadedImage.id],
                    },
                  });

                  // Clean up temp file
                  await unlink(tempFilePath).catch(console.error);
                }
              } catch (imageError) {
                console.error(
                  `Error processing publisher image for ${publisher.value}:`,
                  imageError
                );
              }
            }

            publisherIds.push(newPublisher.id);
          } catch (error) {
            console.error(
              `Error fetching publisher details for ${publisher.value}:`,
              error
            );

            // Fall back to basic publisher creation if the family API fails
            const newPublisher = await payload.create({
              collection: "publishers",
              data: {
                name: publisher.value,
                bggId: publisher.id,
              },
            });
            publisherIds.push(newPublisher.id);
          }
        }
      }
    }

    // Create or find designers
    const designerIds = [];
    if (designers && Array.isArray(designers)) {
      for (const designer of designers) {
        if (!designer || !designer.value) continue; // Skip if designer or designer.value is undefined

        const existingDesigners = await payload.find({
          collection: "designers",
          where: {
            name: {
              equals: designer.value,
            },
          },
        });

        if (existingDesigners.docs.length > 0) {
          designerIds.push(existingDesigners.docs[0].id);

          // Update bggId if missing
          if (designer.id && !existingDesigners.docs[0].bggId) {
            await payload.update({
              collection: "designers",
              id: existingDesigners.docs[0].id,
              data: {
                bggId: designer.id,
              },
            });
          }
        } else {
          const newDesigner = await payload.create({
            collection: "designers",
            data: {
              name: designer.value,
              bggId: designer.id,
            },
          });
          designerIds.push(newDesigner.id);
        }
      }
    }

    // Create or find categories
    const categoryIds = [];
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        if (!category || !category.value) continue; // Skip if category or category.value is undefined

        const existingCategories = await payload.find({
          collection: "categories",
          where: {
            name: {
              equals: category.value,
            },
          },
        });

        if (existingCategories.docs.length > 0) {
          categoryIds.push(existingCategories.docs[0].id);

          // Update bggId if missing
          if (!existingCategories.docs[0].bggId) {
            await payload.update({
              collection: "categories",
              id: existingCategories.docs[0].id,
              data: {
                bggId: category.id,
              },
            });
          }
        } else {
          const newCategory = await payload.create({
            collection: "categories",
            data: {
              name: category.value,
              bggId: category.id,
            },
          });
          categoryIds.push(newCategory.id);
        }
      }
    }

    // Create or find mechanics
    const mechanicIds = [];
    if (mechanics && Array.isArray(mechanics)) {
      for (const mechanic of mechanics) {
        if (!mechanic || !mechanic.value) continue; // Skip if mechanic or mechanic.value is undefined

        const existingMechanics = await payload.find({
          collection: "mechanics",
          where: {
            name: {
              equals: mechanic.value,
            },
          },
        });

        if (existingMechanics.docs.length > 0) {
          mechanicIds.push(existingMechanics.docs[0].id);

          // Update bggId if missing
          if (!existingMechanics.docs[0].bggId) {
            await payload.update({
              collection: "mechanics",
              id: existingMechanics.docs[0].id,
              data: {
                bggId: mechanic.id,
              },
            });
          }
        } else {
          const newMechanic = await payload.create({
            collection: "mechanics",
            data: {
              name: mechanic.value,
              bggId: mechanic.id,
            },
          });
          mechanicIds.push(newMechanic.id);
        }
      }
    }

    // Create or find artists
    const artistIds = [];
    if (artists && Array.isArray(artists)) {
      for (const artist of artists) {
        if (!artist || !artist.value) continue; // Skip if artist or artist.value is undefined

        const existingArtists = await payload.find({
          collection: "artists",
          where: {
            name: {
              equals: artist.value,
            },
          },
        });

        if (existingArtists.docs.length > 0) {
          artistIds.push(existingArtists.docs[0].id);

          // Update bggId if missing
          if (artist.id && !existingArtists.docs[0].bggId) {
            await payload.update({
              collection: "artists",
              id: existingArtists.docs[0].id,
              data: {
                bggId: artist.id,
              },
            });
          }
        } else {
          const newArtist = await payload.create({
            collection: "artists",
            data: {
              name: artist.value,
              bggId: artist.id,
            },
          });
          artistIds.push(newArtist.id);
        }
      }
    }

    // Create or find types
    const typeIds = [];
    if (types && Array.isArray(types)) {
      for (const type of types as { id?: number; value: string }[]) {
        if (!type || !type.value) continue; // Skip if type or type.value is undefined

        // Find type by name since we might not have BGG IDs for all types
        const existingTypes = await payload.find({
          collection: "types",
          where: {
            name: {
              equals: type.value,
            },
          },
        });

        if (existingTypes.docs.length > 0) {
          typeIds.push(existingTypes.docs[0].id);

          // Update the type with BGG ID if missing
          if (type.id && !existingTypes.docs[0].bggId) {
            await payload.update({
              collection: "types",
              id: existingTypes.docs[0].id,
              data: {
                bggId: type.id,
              },
            });
          }
        } else {
          // Create new type with BGG ID if available
          const typeData: { name: string; bggId?: number } = {
            name: type.value,
          };

          // Add BGG ID if it exists
          if (type.id) {
            typeData.bggId = type.id;
          }

          const newType = await payload.create({
            collection: "types",
            data: typeData,
          });
          typeIds.push(newType.id);
        }
      }
    }

    // Upload images if available
    let imageId = null;
    if (bggGame && bggGame.image) {
      try {
        // Download the image to a temp file
        const tempFilePath = await downloadImageToTemp(bggGame.image);

        if (tempFilePath) {
          // Get game name for folder structure and alt text
          let gameName = "unknown-game";
          if (bggGame.name) {
            if (Array.isArray(bggGame.name) && bggGame.name.length > 0) {
              const primaryName = bggGame.name.find(
                (n: any) => n.type === "primary"
              );
              gameName = primaryName?.value || bggGame.name[0].value;
            } else if (typeof bggGame.name === "object" && bggGame.name.value) {
              gameName = bggGame.name.value;
            } else if (typeof bggGame.name === "string") {
              gameName = bggGame.name;
            }
          }

          // Create a payload file
          const imageFile = await createPayloadFile(tempFilePath, gameName);

          // Upload to Payload
          const uploadedImage = await payload.create({
            collection: "media",
            data: {
              alt: gameName,
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

    // Prepare game data
    let gameName = "Unknown Game";
    if (bggGame.name) {
      if (Array.isArray(bggGame.name) && bggGame.name.length > 0) {
        const primaryName = bggGame.name.find((n: any) => n.type === "primary");
        gameName = primaryName?.value || bggGame.name[0].value;
      } else if (typeof bggGame.name === "object" && bggGame.name.value) {
        gameName = bggGame.name.value;
      } else if (typeof bggGame.name === "string") {
        gameName = bggGame.name;
      }
    }

    const gameData: any = {
      bggId: bggId, // Use the BGG ID from the request
      name: gameName,
      type: typeIds.length > 0 ? typeIds : undefined,
    };

    // Add original name if different from primary name
    if (Array.isArray(bggGame.name) && bggGame.name.length > 1) {
      const alternateNames = bggGame.name.filter(
        (n: any) => n.type !== "primary"
      );
      if (alternateNames.length > 0) {
        gameData.originalName = alternateNames[0].value;
      }
    }

    // Only add fields if they exist in the BGG data
    if (bggGame.description) {
      // Convert plain text description to Lexical editor format
      gameData.description = formatRichText(bggGame.description);
    }

    if (bggGame.yearpublished?.value) {
      gameData.yearPublished = bggGame.yearpublished.value;
    }

    if (bggGame.minplayers?.value) {
      gameData.minPlayers = bggGame.minplayers.value;
    }

    if (bggGame.maxplayers?.value) {
      gameData.maxPlayers = bggGame.maxplayers.value;
    }

    if (bggGame.playingtime?.value) {
      gameData.playingTime = bggGame.playingtime.value;
    }

    if (bggGame.minplaytime?.value) {
      gameData.minPlaytime = bggGame.minplaytime.value;
    }

    if (bggGame.maxplaytime?.value) {
      gameData.maxPlaytime = bggGame.maxplaytime.value;
    }

    if (bggGame.minage?.value) {
      gameData.minAge = bggGame.minage.value;
    }

    // Add rating and complexity data
    if (bggGame.statistics?.ratings?.average?.value) {
      gameData.userRating = parseFloat(
        bggGame.statistics.ratings.average.value
      );
    }

    if (bggGame.statistics?.ratings?.usersrated?.value) {
      gameData.userRatedCount = parseInt(
        bggGame.statistics.ratings.usersrated.value
      );
    }

    if (bggGame.statistics?.ratings?.averageweight?.value) {
      gameData.complexity = parseFloat(
        bggGame.statistics.ratings.averageweight.value
      );
    }

    if (bggGame.statistics?.ratings?.ranks) {
      const ranks = Array.isArray(bggGame.statistics.ratings.ranks)
        ? bggGame.statistics.ratings.ranks
        : [bggGame.statistics.ratings.ranks];

      const overallRank = ranks.find(
        (r: any) => r.id === "1" || r.name === "boardgame"
      );
      if (overallRank && overallRank.value !== "Not Ranked") {
        gameData.bggRank = parseInt(overallRank.value);
      }
    }

    // Process suggested player counts if available
    if (bggGame.poll) {
      const polls = Array.isArray(bggGame.poll) ? bggGame.poll : [bggGame.poll];
      const playerCountPoll = polls.find(
        (p: any) => p.name === "suggested_numplayers"
      );

      if (playerCountPoll && playerCountPoll.results) {
        const playerCounts = Array.isArray(playerCountPoll.results)
          ? playerCountPoll.results
          : [playerCountPoll.results];

        const suggestedPlayerCount = playerCounts.map((pc: any) => {
          const votes = pc.result;
          const voteData = Array.isArray(votes) ? votes : [votes];

          const bestCount =
            voteData.find((v: any) => v.value === "Best")?.numvotes || 0;
          const recommendedCount =
            voteData.find((v: any) => v.value === "Recommended")?.numvotes || 0;
          const notRecommendedCount =
            voteData.find((v: any) => v.value === "Not Recommended")
              ?.numvotes || 0;

          return {
            playerCount: parseInt(pc.numplayers),
            bestCount: parseInt(bestCount),
            recommendedCount: parseInt(recommendedCount),
            notRecommendedCount: parseInt(notRecommendedCount),
          };
        });

        if (suggestedPlayerCount.length > 0) {
          gameData.suggestedPlayerCount = suggestedPlayerCount;
        }
      }

      // Get language dependence
      const languagePoll = polls.find(
        (p: any) => p.name === "language_dependence"
      );
      if (languagePoll && languagePoll.results) {
        const results = Array.isArray(languagePoll.results.result)
          ? languagePoll.results.result
          : [languagePoll.results.result];

        // Find the highest voted language dependence
        if (results.length > 0) {
          const sortedResults = [...results].sort(
            (a: any, b: any) => parseInt(b.numvotes) - parseInt(a.numvotes)
          );

          const mapping: Record<string, string> = {
            "No necessary in-game text": "0",
            "Some necessary text - easily memorized or small crib sheet": "1",
            "Moderate in-game text - needs crib sheet or paste ups": "2",
            "Extensive use of text - massive conversion needed to be playable":
              "3",
            "Unplayable in another language": "4",
          };

          const topResult = sortedResults[0];
          if (topResult.value in mapping) {
            gameData.languageDependence = mapping[topResult.value];
          }
        }
      }
    }

    // Add category, mechanic, designer, and publisher data
    if (categoryIds.length > 0) {
      gameData.categories = categoryIds;
    }

    if (mechanicIds.length > 0) {
      gameData.mechanics = mechanicIds;
    }

    if (designerIds.length > 0) {
      gameData.designers = designerIds;
    }

    if (publisherIds.length > 0) {
      gameData.publishers = publisherIds;
    }

    if (artistIds.length > 0) {
      gameData.artists = artistIds;
    }

    // Add image reference if available
    if (imageId) {
      gameData.images = [imageId];
    }

    // Initialize expansions and implementations arrays appropriately based on existing data
    gameData.expansions = needsProcessing ? game?.expansions || [] : [];
    gameData.implementations = needsProcessing
      ? game?.implementations || []
      : [];

    // Create a new game or update the existing one
    if (needsProcessing) {
      // Update existing game with new data
      game = await payload.update({
        collection: "games",
        id: game!.id,
        data: gameData,
      });
    } else {
      // Create a new game with the prepared data
      game = await payload.create({
        collection: "games",
        data: gameData,
      });
    }

    // Process expansions if there are any and we're not already processing expansions
    if (expansions.length > 0 && !isProcessingExpansions) {
      const expansionIds = [];

      // Set delay between API calls to avoid rate limiting
      const RATE_LIMIT_DELAY = 500; // 0.5 second delay between calls

      for (const expansion of expansions) {
        try {
          // First check if this expansion already exists in our database
          const existingExpansion = await payload.find({
            collection: "games",
            where: {
              bggId: {
                equals: expansion.id,
              },
            },
          });

          if (existingExpansion.docs.length > 0) {
            // Expansion already exists, use its ID
            console.log(
              `Expansion ${expansion.value} (ID: ${expansion.id}) already exists, skipping API call`
            );
            expansionIds.push(existingExpansion.docs[0].id);

            // Update existing expansion with base game relationship if needed
            await payload.update({
              collection: "games",
              id: existingExpansion.docs[0].id,
              data: {
                baseGame: game.id,
              } as any,
            });
          } else {
            // Call the same endpoint to add each expansion, but with a flag to avoid recursion
            console.log(
              `Adding expansion ${expansion.value} (ID: ${expansion.id})`
            );
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const host = request.headers.get("host") || "";
            const expansionApiUrl = `${protocol}://${host}/api/games/add?processingExpansions=true`;

            const response = await fetch(expansionApiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ bggId: expansion.id }),
            });

            const result = await response.json();

            if (result.game && result.game.id) {
              expansionIds.push(result.game.id);

              // Set this game as the baseGame for the expansion
              await payload.update({
                collection: "games",
                id: result.game.id,
                data: {
                  baseGame: game.id,
                } as any,
              });
            }

            // Add delay before processing next expansion to avoid rate limiting
            await delay(RATE_LIMIT_DELAY);
          }
        } catch (error) {
          console.error(`Error adding expansion ${expansion.value}:`, error);
          // Continue with next expansion even if this one fails
          await delay(RATE_LIMIT_DELAY);
        }
      }

      // Update the game with the expansion IDs if any were successfully added
      if (expansionIds.length > 0) {
        await payload.update({
          collection: "games",
          id: game.id,
          data: {
            expansions: expansionIds,
          },
        });
      }
    }

    // Process implementations if there are any
    if (implementations.length > 0) {
      const implementationIds = [];
      const RATE_LIMIT_DELAY = 500; // 1 second delay between calls

      for (const implementation of implementations) {
        try {
          // First check if this implementation already exists in our database
          const existingImplementation = await payload.find({
            collection: "games",
            where: {
              bggId: {
                equals: implementation.id,
              },
            },
          });

          if (existingImplementation.docs.length > 0) {
            // Implementation already exists, use its ID
            console.log(
              `Implementation ${implementation.value} (ID: ${implementation.id}) already exists, skipping API call`
            );
            implementationIds.push(existingImplementation.docs[0].id);

            // Update existing implementation (no changes needed beyond ensuring its existence)
            await payload.update({
              collection: "games",
              id: existingImplementation.docs[0].id,
              data: {},
            });
          } else {
            // Call the same endpoint to add each implementation, with a flag to avoid recursion
            console.log(
              `Adding implementation ${implementation.value} (ID: ${implementation.id})`
            );
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            const host = request.headers.get("host") || "";
            const implementationApiUrl = `${protocol}://${host}/api/games/add?processingExpansions=true`;

            const response = await fetch(implementationApiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ bggId: implementation.id }),
            });

            const result = await response.json();

            if (result.game && result.game.id) {
              implementationIds.push(result.game.id);
            }

            // Add delay before processing next implementation to avoid rate limiting
            await delay(RATE_LIMIT_DELAY);
          }
        } catch (error) {
          console.error(
            `Error adding implementation ${implementation.value}:`,
            error
          );
          // Continue with next implementation even if this one fails
          await delay(RATE_LIMIT_DELAY);
        }
      }

      // Update the game with the implementation IDs if any were successfully added
      if (implementationIds.length > 0) {
        await payload.update({
          collection: "games",
          id: game.id,
          data: {
            implementations: implementationIds,
          },
        });
      }
    }

    // Update the game to mark processing as complete
    await payload.update({
      collection: "games",
      id: game.id,
      data: {
        processing: false,
      },
    });

    return NextResponse.json({
      game,
      message: "Game successfully added from BGG",
    });
  } catch (error) {
    console.error("Error adding game from BGG:", error);
    return NextResponse.json(
      { error: "Failed to add game from BGG" },
      { status: 500 }
    );
  }
}
