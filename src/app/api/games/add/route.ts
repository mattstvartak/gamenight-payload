import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { unlink } from "fs/promises";
import { formatRichText } from "@/lib/utils/formatUtils";
import { createPayloadFile, downloadImageToTemp } from "@/lib/utils/fileUtils";
import { delay } from "@/lib/utils/asyncUtils";
import { extractBggEntityLinks } from "@/lib/utils/bggUtils";
import { fetchBggGameData } from "@/lib/utils/bggUtils";
import {
  batchCheckExistence,
  updateExistenceCache,
} from "@/lib/utils/databaseUtils";

// Create a TypeData interface for operations that include bggId
interface TypeData {
  name: string;
  bggId?: number;
}

// BGG data interfaces
interface BGGNameItem {
  value: string;
  type?: string;
  sortindex?: number;
}

interface BGGLink {
  id: number;
  value: string;
  type?: string;
}

interface BGGValueItem {
  value: string | number;
}

interface BGGPollResult {
  value: string;
  numvotes: string | number;
}

interface BGGPollResultContainer {
  result: BGGPollResult | BGGPollResult[];
  numplayers?: string | number;
}

interface BGGPoll {
  name: string;
  title?: string;
  totalvotes?: number;
  results: BGGPollResultContainer | BGGPollResultContainer[];
}

interface BGGRank {
  id: string;
  name: string;
  value: string;
  type?: string;
  friendlyname?: string;
  bayesaverage?: string;
}

interface BGGRating {
  average?: BGGValueItem;
  averageweight?: BGGValueItem;
  usersrated?: BGGValueItem;
  ranks?: BGGRank | BGGRank[];
}

interface BGGStatistics {
  ratings: BGGRating;
}

interface BGGGame {
  id?: number;
  type?: string;
  name?: BGGNameItem | BGGNameItem[] | string;
  description?: string;
  image?: string;
  yearpublished?: BGGValueItem;
  minplayers?: BGGValueItem;
  maxplayers?: BGGValueItem;
  playingtime?: BGGValueItem;
  minplaytime?: BGGValueItem;
  maxplaytime?: BGGValueItem;
  minage?: BGGValueItem;
  statistics?: BGGStatistics;
  poll?: BGGPoll | BGGPoll[];
  link?: BGGLink[];
}

// Define a type for BGG linked entities
interface BGGLinkedEntity {
  id: string | number;
  value: string;
  [key: string]: any;
}

// Shared variables for rate limiting
const accessoryConsecutiveFailures = 0;
const ACCESSORY_MAX_CONSECUTIVE_FAILURES = 3;
const ACCESSORY_RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

/**
 * Adds a game from BoardGameGeek to the Payload CMS database
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });
    const { bggId, isExpansion, baseGameId } = await request.json();

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
        return NextResponse.json({
          game,
          message: "Game already exists and is fully processed",
          alreadyProcessed: true,
        });
      }

      // Always process relationships when a game exists but is still processing
      needsProcessing = true;
    }

    // If we're handling an expansion, add a delay to respect BGG rate limits
    if (isProcessingExpansions) {
      await delay(1000); // Add a 1 second delay for BGG API calls
    }

    // Fetch game data from BGG using our new API endpoint
    let bggGame;
    try {
      const response = await fetch(`${url.origin}/api/bgg/game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bggId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data from BGG API");
      }

      bggGame = await response.json();
    } catch (error) {
      console.error(`Error fetching data from BGG for ID ${bggId}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch data from BoardGameGeek" },
        { status: 500 }
      );
    }

    // Extract all related data using our utility function
    const bggGameData = bggGame?.items?.item || bggGame?.item;
    if (!bggGameData) {
      throw new Error("Invalid BGG response: missing game data");
    }

    const publishers = extractBggEntityLinks(bggGameData, "boardgamepublisher");
    const designers = extractBggEntityLinks(bggGameData, "boardgamedesigner");
    const categories = extractBggEntityLinks(bggGameData, "boardgamecategory");
    const mechanics = extractBggEntityLinks(bggGameData, "boardgamemechanic");
    const artists = extractBggEntityLinks(bggGameData, "boardgameartist");
    const accessories = extractBggEntityLinks(
      bggGameData,
      "boardgameaccessory"
    );

    // Extract expansion information
    const expansions = extractBggEntityLinks(bggGameData, "boardgameexpansion");

    // Extract implementation information (base games that this expansion is for)
    const implementations = extractBggEntityLinks(
      bggGameData,
      "boardgameimplementation"
    );

    // Extract type information - if BGG doesn't have boardgametype specifically,
    // we'll use the general type field as a fallback
    const typeNames: string[] = [];
    const types: { id?: number; value: string }[] = [];
    if (bggGameData?.type) {
      // For the general type field, we don't have a direct BGG ID
      typeNames.push(bggGameData.type);
      types.push({ value: bggGameData.type });
    }
    // Also check if there are any boardgametype entries in the link array
    const boardgameTypes = extractBggEntityLinks(bggGameData, "boardgametype");
    for (const type of boardgameTypes) {
      if (type?.value && !typeNames.includes(type.value)) {
        typeNames.push(type.value);
        types.push({ id: Number(type.id), value: type.value });
      }
    }

    // Create a cache for entities to avoid duplicate lookups
    interface EntityCache {
      publishers: Record<string, number>;
      designers: Record<string, number>;
      categories: Record<string, number>;
      mechanics: Record<string, number>;
      artists: Record<string, number>;
      types: Record<string, number>;
      accessories: Record<string, number>;
    }

    const entityCache: EntityCache = {
      publishers: {},
      designers: {},
      categories: {},
      mechanics: {},
      artists: {},
      types: {},
      accessories: {},
    };

    // Create or find publishers
    const publisherIds = [];
    if (publishers && Array.isArray(publishers)) {
      for (const publisher of publishers) {
        if (!publisher || !publisher.value) continue; // Skip if publisher or publisher.value is undefined

        // Use cached value if available
        if (entityCache.publishers[publisher.value]) {
          publisherIds.push(Number(entityCache.publishers[publisher.value]));
          continue;
        }

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
          const publisherId = existingPublishers.docs[0].id;
          publisherIds.push(Number(publisherId));
          entityCache.publishers[publisher.value] = Number(publisherId);

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
          // Fetch additional publisher info from BGG family API using our new API endpoint
          try {
            // Add a slight delay to avoid BGG rate limits
            await delay(300);

            console.log(
              `Fetching detailed publisher info for ${publisher.value} (ID: ${publisher.id})`
            );

            let publisherData: any = {};
            try {
              const response = await fetch(`${url.origin}/api/bgg/publisher`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ publisherId: publisher.id }),
              });

              if (response.ok) {
                publisherData = await response.json();
              } else {
                console.log(
                  `Invalid publisher data format for ${publisher.value}, proceeding with basic info only`
                );
              }
            } catch (error) {
              console.error(
                `Error fetching publisher details for ${publisher.value}:`,
                error
              );
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

            // Store in cache
            const publisherId = newPublisher.id;
            entityCache.publishers[publisher.value] = Number(publisherId);

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

            publisherIds.push(Number(publisherId));
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
            const publisherId = newPublisher.id;
            publisherIds.push(Number(publisherId));
            entityCache.publishers[publisher.value] = Number(publisherId);
          }
        }
      }
    }

    // Create or find designers
    const designerIds = [];
    if (designers && Array.isArray(designers)) {
      for (const designer of designers) {
        if (!designer || !designer.value) continue; // Skip if designer or designer.value is undefined

        // Use cached value if available
        if (entityCache.designers[designer.value]) {
          designerIds.push(Number(entityCache.designers[designer.value]));
          continue;
        }

        const existingDesigners = await payload.find({
          collection: "designers",
          where: {
            name: {
              equals: designer.value,
            },
          },
        });

        if (existingDesigners.docs.length > 0) {
          const designerId = existingDesigners.docs[0].id;
          designerIds.push(Number(designerId));
          entityCache.designers[designer.value] = Number(designerId);

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
          const designerId = newDesigner.id;
          designerIds.push(Number(designerId));
          entityCache.designers[designer.value] = Number(designerId);
        }
      }
    }

    // Create or find categories
    const categoryIds = [];
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        if (!category || !category.value) continue; // Skip if category or category.value is undefined

        // Use cached value if available
        if (entityCache.categories[category.value]) {
          categoryIds.push(Number(entityCache.categories[category.value]));
          continue;
        }

        const existingCategories = await payload.find({
          collection: "categories",
          where: {
            name: {
              equals: category.value,
            },
          },
        });

        if (existingCategories.docs.length > 0) {
          // Category exists, use its ID
          const categoryId = existingCategories.docs[0].id;
          categoryIds.push(Number(categoryId));
          entityCache.categories[category.value] = Number(categoryId);

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
          const categoryId = newCategory.id;
          categoryIds.push(Number(categoryId));
          entityCache.categories[category.value] = Number(categoryId);
        }
      }
    }

    // Create or find mechanics
    const mechanicIds = [];
    if (mechanics && Array.isArray(mechanics)) {
      for (const mechanic of mechanics) {
        if (!mechanic || !mechanic.value) continue; // Skip if mechanic or mechanic.value is undefined

        // Use cached value if available
        if (entityCache.mechanics[mechanic.value]) {
          mechanicIds.push(Number(entityCache.mechanics[mechanic.value]));
          continue;
        }

        const existingMechanics = await payload.find({
          collection: "mechanics",
          where: {
            name: {
              equals: mechanic.value,
            },
          },
        });

        if (existingMechanics.docs.length > 0) {
          // Mechanic exists, use its ID
          const mechanicId = existingMechanics.docs[0].id;
          mechanicIds.push(Number(mechanicId));
          entityCache.mechanics[mechanic.value] = Number(mechanicId);

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
          const mechanicId = newMechanic.id;
          mechanicIds.push(Number(mechanicId));
          entityCache.mechanics[mechanic.value] = Number(mechanicId);
        }
      }
    }

    // Create or find artists
    const artistIds = [];
    if (artists && Array.isArray(artists)) {
      for (const artist of artists) {
        if (!artist || !artist.value) continue; // Skip if artist or artist.value is undefined

        // Use cached value if available
        if (entityCache.artists[artist.value]) {
          artistIds.push(Number(entityCache.artists[artist.value]));
          continue;
        }

        const existingArtists = await payload.find({
          collection: "artists",
          where: {
            name: {
              equals: artist.value,
            },
          },
        });

        if (existingArtists.docs.length > 0) {
          // Artist exists, use its ID
          const artistId = existingArtists.docs[0].id;
          artistIds.push(Number(artistId));
          entityCache.artists[artist.value] = Number(artistId);

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
          const artistId = newArtist.id;
          artistIds.push(Number(artistId));
          entityCache.artists[artist.value] = Number(artistId);
        }
      }
    }

    // Create or find types
    const typeIds = [];
    if (types && Array.isArray(types)) {
      for (const type of types) {
        if (!type || !type.value) continue; // Skip if type or type.value is undefined

        // Use cached value if available
        if (entityCache.types[type.value]) {
          typeIds.push(Number(entityCache.types[type.value]));
          continue;
        }

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
          // Type exists, use its ID
          const typeId = existingTypes.docs[0].id;
          typeIds.push(Number(typeId));
          entityCache.types[type.value] = Number(typeId);

          // Update the type with BGG ID if missing
          if (type.id && !("bggId" in existingTypes.docs[0])) {
            await payload.update({
              collection: "types",
              id: existingTypes.docs[0].id,
              data: {
                bggId: type.id,
              } as TypeData,
            });
          }
        } else {
          // Create new type with BGG ID if available
          const typeData: TypeData = {
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
          const typeId = newType.id;
          typeIds.push(Number(typeId));
          entityCache.types[type.value] = Number(typeId);
        }
      }
    }

    // Upload images if available
    let imageId = null;
    if (bggGameData && bggGameData.image) {
      try {
        // Download the image to a temp file
        const tempFilePath = await downloadImageToTemp(bggGameData.image);

        if (tempFilePath) {
          // Get game name for folder structure and alt text
          let gameName = "unknown-game";
          if (bggGameData.name) {
            if (
              Array.isArray(bggGameData.name) &&
              bggGameData.name.length > 0
            ) {
              const primaryName = bggGameData.name.find(
                (n: BGGNameItem) => n.type === "primary"
              );
              gameName = primaryName?.value || bggGameData.name[0].value;
            } else if (
              typeof bggGameData.name === "object" &&
              "value" in bggGameData.name
            ) {
              gameName = bggGameData.name.value;
            } else if (typeof bggGameData.name === "string") {
              gameName = bggGameData.name;
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

    // Helper function to extract game name
    function extractGameName(bggGame: BGGGame): string {
      if (!bggGame.name) return "Unknown Game";

      if (Array.isArray(bggGame.name) && bggGame.name.length > 0) {
        const primaryName = bggGame.name.find(
          (n: BGGNameItem) => n.type === "primary"
        );
        return primaryName?.value || bggGame.name[0].value;
      } else if (typeof bggGame.name === "object" && "value" in bggGame.name) {
        return bggGame.name.value;
      } else if (typeof bggGame.name === "string") {
        return bggGame.name;
      }

      return "Unknown Game";
    }

    // Prepare game data
    const gameName = extractGameName(bggGameData);

    const gameData: any = {
      bggId: bggId,
      name: gameName,
      type: typeIds.length > 0 ? typeIds.map((id) => Number(id)) : undefined,
      // Initialize expansions and implementations arrays
      expansions: needsProcessing ? game?.expansions || [] : [],
      implementations: needsProcessing ? game?.implementations || [] : [],
      // Set baseGame reference if this is an expansion
      baseGame: isExpansion && baseGameId ? Number(baseGameId) : undefined,
    };

    // Add original name if different from primary name
    if (Array.isArray(bggGameData.name) && bggGameData.name.length > 1) {
      const alternateNames = bggGameData.name.filter(
        (n: BGGNameItem) => n.type !== "primary"
      );
      if (alternateNames.length > 0) {
        gameData.originalName = alternateNames[0].value;
      }
    }

    // Only add fields if they exist in the BGG data
    if (bggGameData.description) {
      // Convert plain text description to Lexical editor format
      gameData.description = formatRichText(bggGameData.description);
    }

    // Add numeric fields efficiently
    const numericFields = {
      yearPublished: bggGameData.yearpublished?.value,
      minPlayers: bggGameData.minplayers?.value,
      maxPlayers: bggGameData.maxplayers?.value,
      playingTime: bggGameData.playingtime?.value,
      minPlaytime: bggGameData.minplaytime?.value,
      maxPlaytime: bggGameData.maxplaytime?.value,
      minAge: bggGameData.minage?.value,
    };

    Object.entries(numericFields).forEach(([key, value]) => {
      if (value !== undefined) {
        gameData[key] = value;
      }
    });

    // Add rating and complexity data
    if (bggGameData.statistics?.ratings?.average?.value) {
      gameData.userRating = parseFloat(
        bggGameData.statistics.ratings.average.value.toString()
      );
    }

    if (bggGameData.statistics?.ratings?.usersrated?.value) {
      gameData.userRatedCount = parseInt(
        bggGameData.statistics.ratings.usersrated.value.toString()
      );
    }

    if (bggGameData.statistics?.ratings?.averageweight?.value) {
      gameData.complexity = parseFloat(
        bggGameData.statistics.ratings.averageweight.value.toString()
      );
    }

    if (bggGameData.statistics?.ratings?.ranks) {
      const ranks = Array.isArray(bggGameData.statistics.ratings.ranks)
        ? bggGameData.statistics.ratings.ranks
        : [bggGameData.statistics.ratings.ranks];

      const overallRank = ranks.find(
        (r: BGGRank) => r.id === "1" || r.name === "boardgame"
      );
      if (overallRank && overallRank.value !== "Not Ranked") {
        gameData.bggRank = parseInt(overallRank.value);
      }
    }

    // Process suggested player counts if available
    if (bggGameData.poll) {
      const polls = Array.isArray(bggGameData.poll)
        ? bggGameData.poll
        : [bggGameData.poll];
      const playerCountPoll = polls.find(
        (p: BGGPoll) => p.name === "suggested_numplayers"
      );

      if (playerCountPoll && playerCountPoll.results) {
        const playerCounts = Array.isArray(playerCountPoll.results)
          ? playerCountPoll.results
          : [playerCountPoll.results];

        const suggestedPlayerCount = playerCounts.map(
          (pc: BGGPollResultContainer) => {
            const votes = pc.result;
            const voteData = Array.isArray(votes) ? votes : [votes];

            const bestCount =
              voteData.find((v: BGGPollResult) => v.value === "Best")
                ?.numvotes || 0;
            const recommendedCount =
              voteData.find((v: BGGPollResult) => v.value === "Recommended")
                ?.numvotes || 0;
            const notRecommendedCount =
              voteData.find((v: BGGPollResult) => v.value === "Not Recommended")
                ?.numvotes || 0;

            return {
              playerCount: parseInt(pc.numplayers as string),
              bestCount: parseInt(bestCount as string),
              recommendedCount: parseInt(recommendedCount as string),
              notRecommendedCount: parseInt(notRecommendedCount as string),
            };
          }
        );

        if (suggestedPlayerCount.length > 0) {
          gameData.suggestedPlayerCount = suggestedPlayerCount;
        }
      }

      // Get language dependence
      const languagePoll = polls.find(
        (p: BGGPoll) => p.name === "language_dependence"
      );
      if (languagePoll && languagePoll.results) {
        const results = Array.isArray(languagePoll.results.result)
          ? languagePoll.results.result
          : [languagePoll.results.result];

        // Find the highest voted language dependence
        if (results.length > 0) {
          const sortedResults = [...results].sort(
            (a: BGGPollResult, b: BGGPollResult) =>
              parseInt(b.numvotes as string) - parseInt(a.numvotes as string)
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
      gameData.categories = categoryIds.map((id) => Number(id));
    }

    if (mechanicIds.length > 0) {
      gameData.mechanics = mechanicIds.map((id) => Number(id));
    }

    if (designerIds.length > 0) {
      gameData.designers = designerIds.map((id) => Number(id));
    }

    if (publisherIds.length > 0) {
      gameData.publishers = publisherIds.map((id) => Number(id));
    }

    if (artistIds.length > 0) {
      gameData.artists = artistIds.map((id) => Number(id));
    }

    // Process accessories
    const accessoryIds = [];
    if (accessories && accessories.length > 0) {
      // Extract all accessory BGG IDs
      const accessoryBggIds = accessories
        .filter((accessory: BGGLinkedEntity) => accessory && accessory.id)
        .map((accessory: BGGLinkedEntity) => String(accessory.id));

      // Check which accessories already exist in a single batch query
      const existingAccessoryMap = await batchCheckExistence(
        "accessories",
        accessoryBggIds
      );

      for (const accessory of accessories as BGGLinkedEntity[]) {
        if (!accessory || !accessory.value) {
          continue; // Skip if accessory or accessory.value is undefined
        }

        const accessoryBggId = String(accessory.id);

        // Use cached value if available
        if (entityCache.accessories[accessory.value]) {
          accessoryIds.push(Number(entityCache.accessories[accessory.value]));
        } else if (existingAccessoryMap[accessoryBggId]) {
          const accessoryId = existingAccessoryMap[accessoryBggId];
          accessoryIds.push(Number(accessoryId));

          // Convert string ID to number for entityCache
          entityCache.accessories[accessory.value] = Number(accessoryId);
          continue;
        }

        // Add delay between accessory processing
        await delay(ACCESSORY_RATE_LIMIT_DELAY);
      }
    }

    // Add accessories to game data
    if (accessoryIds.length > 0) {
      // Ensure all accessory IDs are numbers
      gameData.accessories = accessoryIds.map((id) => Number(id));
    }

    // Add image reference if available
    if (imageId) {
      gameData.images = [Number(imageId)];
    }

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

      // If this is an expansion, update the base game's expansions array
      if (isExpansion && baseGameId) {
        try {
          console.log(
            `This is an expansion for base game ID: ${baseGameId}, updating base game`
          );

          // Get the base game to see its current expansions
          const baseGame = await payload.findByID({
            collection: "games",
            id: baseGameId,
          });

          // Get existing expansion IDs, properly handling the case where they might be objects
          const existingExpansionIds =
            baseGame.expansions?.map((exp) =>
              typeof exp === "object" ? exp.id : exp
            ) || [];

          // Add this expansion to the list if it's not already there
          if (!existingExpansionIds.includes(game.id)) {
            const updatedExpansions = [...existingExpansionIds, game.id].map(
              (id) => Number(id)
            );

            // Update the base game with the new expansion
            await payload.update({
              collection: "games",
              id: baseGameId,
              data: {
                expansions: updatedExpansions,
              },
            });
            console.log(
              `Updated base game ${baseGame.name} with expansion ${game.name}`
            );
          } else {
            console.log(
              `Base game ${baseGame.name} already has this expansion`
            );
          }
        } catch (error) {
          console.error(`Error updating base game with expansion:`, error);
        }
      }
    }

    // Process expansions and implementations asynchronously
    // This allows us to return the response to the user faster
    const processRelationships = async () => {
      try {
        // Process expansions if there are any and we're not already processing expansions
        if (expansions.length > 0 && !isProcessingExpansions) {
          const expansionIds = [];
          // Increase delay to avoid rate limiting
          const RATE_LIMIT_DELAY = 2000; // 2 second delay between calls (increased from 500ms)
          // Track consecutive failures to implement adaptive backoff
          let consecutiveFailures = 0;
          const MAX_CONSECUTIVE_FAILURES = 3;

          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host") || "";
          const expansionApiUrl = `${protocol}://${host}/api/games/add?processingExpansions=true`;

          // Extract all expansion BGG IDs
          const expansionBggIds = expansions
            .filter((expansion: BGGLinkedEntity) => expansion && expansion.id)
            .map((expansion: BGGLinkedEntity) => String(expansion.id));

          // Batch check which expansions already exist
          const existingExpansionMap = await batchCheckExistence(
            "games",
            expansionBggIds
          );

          for (const expansion of expansions as BGGLinkedEntity[]) {
            try {
              // First check if this expansion already exists in our database
              const expansionBggId = String(expansion.id);

              // Check if it was found in our batch query
              if (existingExpansionMap[expansionBggId]) {
                const existingExpansionId =
                  existingExpansionMap[expansionBggId];
                expansionIds.push(Number(existingExpansionId));
                continue;
              }

              // Call our games/add endpoint to create the expansion
              const response = await fetch(expansionApiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  bggId: expansion.id,
                  isExpansion: true,
                  baseGameId: game.id,
                }),
              });

              if (!response.ok) {
                // If we get a 429, increase the consecutive failures counter
                if (response.status === 429) {
                  consecutiveFailures++;

                  // Implement exponential backoff for consecutive failures
                  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    const backoffTime = Math.min(
                      30000,
                      RATE_LIMIT_DELAY *
                        Math.pow(
                          2,
                          consecutiveFailures - MAX_CONSECUTIVE_FAILURES
                        )
                    );
                    await delay(backoffTime);
                  }
                }

                console.error(
                  `Failed to process expansion ${expansion.value} (${expansion.id}): ${response.statusText}`
                );
                continue;
              }

              // Reset consecutive failures on success
              consecutiveFailures = 0;

              const expansionData = await response.json();
              if (expansionData?.id) {
                expansionIds.push(Number(expansionData.id));
                // Also update our existence cache
                updateExistenceCache("games", expansionBggId, expansionData.id);
              }

              // Apply rate limiting between expansion calls
              await delay(RATE_LIMIT_DELAY);
            } catch (error) {
              console.error(
                `Error processing expansion ${expansion.value}:`,
                error
              );
            }
          }

          // Update the game with the expansion IDs
          if (expansionIds.length > 0) {
            try {
              // First get the current expansions to avoid overwriting any existing ones
              const currentGameData = await payload.findByID({
                collection: "games",
                id: game.id,
              });

              // Combine existing and new expansion IDs, avoiding duplicates
              const existingExpansionIds =
                currentGameData.expansions?.map((exp) =>
                  typeof exp === "object" ? exp.id : exp
                ) || [];

              // Create a Set to remove duplicates
              const combinedExpansionIds = [
                ...new Set([...existingExpansionIds, ...expansionIds]),
              ].map((id) => Number(id)); // Ensure all IDs are numbers

              // Update the game with the combined list of expansions
              await payload.update({
                collection: "games",
                id: game.id,
                data: {
                  expansions: combinedExpansionIds,
                  // Mark as no longer processing if this was the last step
                  processing: implementations.length === 0,
                },
              });
            } catch (error) {
              console.error(
                `Error updating game ${game.name} with expansions:`,
                error
              );
            }
          }
        }

        // Process implementations if there are any
        if (implementations.length > 0) {
          const implementationIds = [];
          // Increase delay to avoid rate limiting
          const RATE_LIMIT_DELAY = 2000; // 2 second delay between calls (increased from 500ms)
          const protocol = request.headers.get("x-forwarded-proto") || "http";
          const host = request.headers.get("host") || "";
          const implementationApiUrl = `${protocol}://${host}/api/games/add?processingExpansions=true`;

          for (const implementation of implementations) {
            try {
              // First check if this implementation already exists in our database
              const existingImplementation = await payload.find({
                collection: "games",
                where: {
                  bggId: {
                    equals: Number(implementation.id),
                  },
                },
              });

              if (existingImplementation.docs.length > 0) {
                implementationIds.push(
                  Number(existingImplementation.docs[0].id)
                );
                continue;
              }

              // Call the same endpoint to add each implementation, with a flag to avoid recursion
              const response = await fetch(implementationApiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ bggId: implementation.id }),
              });

              const result = await response.json();

              if (result?.game?.id) {
                implementationIds.push(Number(result.game.id));
              }

              // Add delay before processing next implementation to avoid rate limiting
              await delay(RATE_LIMIT_DELAY);
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
            try {
              await payload.update({
                collection: "games",
                id: game.id,
                data: {
                  implementations: implementationIds.map((id) => Number(id)), // Ensure all IDs are numbers
                  processing: false, // Mark as no longer processing
                },
              });
            } catch (error) {
              console.error(
                `Error updating game ${game.name} with implementations:`,
                error
              );
            }
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
      } catch (error) {
        console.error(`Error in async processing for game ${game.id}:`, error);
      }
    };

    // Start async processing without waiting for it to complete
    processRelationships().catch((error) => {
      console.error("Error in async relationship processing:", error);
    });

    return NextResponse.json({
      game,
      message: "Game successfully added from BGG",
      processing: expansions.length > 0 || implementations.length > 0,
    });
  } catch (error) {
    console.error("Error adding game from BGG:", error);
    return NextResponse.json(
      { error: "Failed to add game from BGG" },
      { status: 500 }
    );
  }
}
