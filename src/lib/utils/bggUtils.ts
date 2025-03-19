import { fetchXMLAndConvertToObject } from "./fetchXMLAndConvertToJson";

// Simple in-memory cache for BGG responses with expiration
const bggCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
 * Fetches game data from BGG API with caching
 * @param bggId The BoardGameGeek ID of the game to fetch
 * @returns The parsed game data from BGG
 */
export async function fetchBggGameData(bggId: string | number) {
  try {
    const cacheKey = `game_${bggId}`;

    // Check if we have a valid cached response
    if (
      bggCache[cacheKey] &&
      Date.now() - bggCache[cacheKey].timestamp < CACHE_EXPIRY
    ) {
      return bggCache[cacheKey].data;
    }

    // Apply debouncing to avoid hitting BGG's rate limits
    await debounceApiBgg();

    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data received from BGG");
    }

    // Cache the response
    bggCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error: any) {
    console.error(`Error fetching data from BGG for ID ${bggId}:`, error);
    throw new Error(
      `Failed to fetch data from BoardGameGeek: ${error.message}`
    );
  }
}

/**
 * Fetches publisher data from BGG API with caching
 * @param publisherId The BoardGameGeek publisher ID
 * @returns The parsed publisher data from BGG
 */
export async function fetchBggPublisherData(publisherId: string | number) {
  try {
    const cacheKey = `publisher_${publisherId}`;

    // Check if we have a valid cached response
    if (
      bggCache[cacheKey] &&
      Date.now() - bggCache[cacheKey].timestamp < CACHE_EXPIRY
    ) {
      return bggCache[cacheKey].data;
    }

    // Apply debouncing to avoid hitting BGG's rate limits
    await debounceApiBgg();

    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/family?id=${publisherId}`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      // Invalid data but not a critical error, so continue with empty object
      return {};
    }

    // Cache the response
    bggCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error(
      `Error fetching publisher details for ID ${publisherId}:`,
      error
    );
    return {};
  }
}

export function formatBggGameData(bggGame: any) {
  // Handle case where the item is directly in the response
  const item = bggGame.items?.item || bggGame.item || bggGame;

  // Debug log to see the exact structure
  console.log(
    "Raw BGG response structure:",
    JSON.stringify(bggGame, null, 2).substring(0, 500) + "..."
  );

  // Ensure we have proper name extraction - primary name is usually the first one or has type="primary"
  let primaryName = "";
  let alternateNames: string[] = [];

  if (Array.isArray(item.name)) {
    // Find the primary name (either first or marked as primary)
    const primary =
      item.name.find((n: any) => n.type === "primary") || item.name[0];
    primaryName = primary.value || primary;

    // Get all alternate names
    alternateNames = item.name
      .filter(
        (name: any) =>
          name.type === "alternate" ||
          (name !== primary && name.value !== primary.value)
      )
      .map((name: any) => name.value || name);
  } else if (item.name) {
    // If only one name is provided
    primaryName = item.name.value || item.name;
  }

  // Extract statistics data more comprehensively
  const statistics = item.statistics?.ratings || {};

  // Log the raw statistics data to help debug
  console.log("BGG Statistics data:", JSON.stringify(statistics, null, 2));

  // Handle ranks properly - they may be in an array or a single object
  let bggRank;
  if (statistics.ranks && Array.isArray(statistics.ranks.rank)) {
    const overallRank = statistics.ranks.rank.find(
      (rank: any) => rank.id === "1" && rank.value !== "Not Ranked"
    );
    bggRank = overallRank ? Number(overallRank.value) : undefined;
  } else if (
    statistics.ranks?.rank?.id === "1" &&
    statistics.ranks.rank.value !== "Not Ranked"
  ) {
    bggRank = Number(statistics.ranks.rank.value);
  }

  // Process website links
  interface Website {
    type: string;
    url: string;
  }

  const websites: Website[] = [];
  if (item.link) {
    // Convert to array if it's a single object
    const links = Array.isArray(item.link) ? item.link : [item.link];

    // Get website links
    const websiteLinks = links.filter((link: any) => link.type === "website");
    if (websiteLinks && websiteLinks.length > 0) {
      websiteLinks.forEach((site: any) => {
        websites.push({
          type: site.subtype || "general",
          url: site.value,
        });
      });
    }
  }

  // Find official website for the 'official link' field
  const officialSite = websites.find(
    (site) =>
      site.type === "official" ||
      site.type === "publisher" ||
      site.type === "boardgamepublisher"
  );

  // Process expansions and base games more carefully
  // For debugging, print all expansions
  if (item.link) {
    const links = Array.isArray(item.link) ? item.link : [item.link];
    console.log(
      "All expansion links:",
      links
        .filter((link: any) => link.type === "boardgameexpansion")
        .map((link: any) => ({
          id: link.id,
          name: link.value,
          inbound: link.inbound,
        }))
    );
  }

  // Normalize link arrays
  const normalizeLinks = (
    links: any,
    linkType: string,
    inboundCheck?: boolean
  ) => {
    if (!links) return [];

    // Convert to array if it's a single object
    const linkArray = Array.isArray(links) ? links : [links];

    return linkArray
      .filter((link: any) => {
        if (link.type !== linkType) return false;

        // Handle special case for expansions - look at inbound attribute
        if (linkType === "boardgameexpansion" && inboundCheck !== undefined) {
          // For debugging
          console.log(
            `Link ${link.value} inbound: ${link.inbound}, check: ${inboundCheck}`
          );

          // Special handling - some APIs return inbound as a string
          if (typeof link.inbound === "string") {
            return (link.inbound === "true") === inboundCheck;
          }

          return !!link.inbound === inboundCheck;
        }

        return true;
      })
      .map((link: any) => ({ id: link.id, name: link.value }));
  };

  // Process polls - particularly the language dependence poll
  let languageDependence = null;
  if (item.poll) {
    const polls = Array.isArray(item.poll) ? item.poll : [item.poll];
    const langPoll = polls.find(
      (poll: any) => poll.name === "language_dependence"
    );

    if (langPoll?.results?.result) {
      const results = Array.isArray(langPoll.results.result)
        ? langPoll.results.result
        : [langPoll.results.result];

      if (results.length > 0) {
        // Find the result with the highest votes
        const highestVotedResult = [...results].sort(
          (a, b) => parseInt(b.numvotes) - parseInt(a.numvotes)
        )[0];

        languageDependence = {
          level: highestVotedResult.level,
          value: highestVotedResult.value,
          votes: parseInt(highestVotedResult.numvotes),
        };
      }
    }
  }

  // Process player count poll
  let suggestedPlayerCount = [];
  if (item.poll) {
    const polls = Array.isArray(item.poll) ? item.poll : [item.poll];
    const playerPoll = polls.find(
      (poll: any) => poll.name === "suggested_numplayers"
    );

    if (playerPoll?.results) {
      const results = Array.isArray(playerPoll.results)
        ? playerPoll.results
        : [playerPoll.results];

      suggestedPlayerCount = results.map((result: any) => {
        // Ensure result.result is an array, or default to empty array if undefined
        const voteResults = result.result
          ? Array.isArray(result.result)
            ? result.result
            : [result.result]
          : [];

        return {
          playerCount: Number(result.numplayers),
          bestCount: Number(
            voteResults.find((r: any) => r?.value === "Best")?.numvotes || 0
          ),
          recommendedCount: Number(
            voteResults.find((r: any) => r?.value === "Recommended")
              ?.numvotes || 0
          ),
          notRecommendedCount: Number(
            voteResults.find((r: any) => r?.value === "Not Recommended")
              ?.numvotes || 0
          ),
        };
      });
    }
  }

  // Extract min age from the item and ensure it's a number
  const minAge = item.minage?.value ? Number(item.minage.value) : undefined;

  // Extract complexity (weight) from the averageweight field in statistics
  const complexity = statistics.averageweight?.value
    ? Number(statistics.averageweight.value)
    : undefined;

  // Extract user rating from the average field in statistics
  const userRating = statistics.average?.value
    ? Number(statistics.average.value)
    : undefined;

  // Extract user rated count from the usersrated field in statistics
  const userRatedCount = statistics.usersrated?.value
    ? Number(statistics.usersrated.value)
    : undefined;

  // Create expansions - include all expansions regardless of inbound flag
  // to maximize chances of capturing them
  let expansions = [];
  if (item.link) {
    const links = Array.isArray(item.link) ? item.link : [item.link];
    expansions = links
      .filter(
        (link: any) =>
          link.type === "boardgameexpansion" &&
          // Either it has no inbound property, or inbound is false or "false"
          (link.inbound === undefined ||
            link.inbound === false ||
            link.inbound === "false")
      )
      .map((link: any) => ({ id: link.id, name: link.value }));
  }

  const game = {
    id: item.id,
    bggId: Number(item.id), // Make sure bggId is set properly
    name: primaryName,
    alternateNames: alternateNames,
    type: item.type,
    yearPublished: item.yearpublished?.value
      ? Number(item.yearpublished.value)
      : undefined,
    minPlayers: item.minplayers?.value
      ? Number(item.minplayers.value)
      : undefined,
    maxPlayers: item.maxplayers?.value
      ? Number(item.maxplayers.value)
      : undefined,
    minPlaytime: item.minplaytime?.value
      ? Number(item.minplaytime.value)
      : undefined,
    maxPlaytime: item.maxplaytime?.value
      ? Number(item.maxplaytime.value)
      : undefined,
    playingTime: item.playingtime?.value
      ? Number(item.playingtime.value)
      : item.maxplaytime?.value
        ? Number(item.maxplaytime.value)
        : undefined,
    minAge: minAge,
    image: item.image,
    thumbnail: item.thumbnail,
    description: item.description,

    // Add statistics fields with explicit conversion to numbers
    complexity: complexity,
    userRating: userRating,
    userRatedCount: userRatedCount,
    bggRank: bggRank,

    // Add website links and official links
    websites: websites,
    "official link": officialSite?.url,

    // Normalize all link types
    publishers: normalizeLinks(item.link, "boardgamepublisher"),
    designers: normalizeLinks(item.link, "boardgamedesigner"),
    artists: normalizeLinks(item.link, "boardgameartist"),
    categories: normalizeLinks(item.link, "boardgamecategory"),
    mechanics: normalizeLinks(item.link, "boardgamemechanic"),
    // Use our custom expansions array instead of normalizeLinks for better handling
    expansions: expansions,
    // BaseGames where inbound=true or "true" means "this game expands these games"
    baseGames: normalizeLinks(item.link, "boardgameexpansion", true),
    implementations: normalizeLinks(item.link, "boardgameimplementation"),
    languages: normalizeLinks(item.link, "boardgamelanguage"),
    accessories: normalizeLinks(item.link, "boardgameaccessory"),
    compilations: normalizeLinks(item.link, "boardgamecompilation"),
    families: normalizeLinks(item.link, "boardgamefamily"),

    // Add poll data
    languageDependence: languageDependence,
    suggestedPlayerCount: suggestedPlayerCount,

    // Flag for processing as specified in the collection schema
    processed: true,
  };

  // Log the final mapped values for debugging
  console.log("Game data extraction results:");
  console.log(`Min Age: ${game.minAge}`);
  console.log(`Complexity: ${game.complexity}`);
  console.log(`User Rating: ${game.userRating}`);
  console.log(`User Rated Count: ${game.userRatedCount}`);
  console.log(`Official Link: ${game["official link"]}`);
  console.log(`BGG Rank: ${game.bggRank}`);
  console.log(`Expansions count: ${game.expansions.length}`);

  return game;
}

/**
 * Extracts entity links from BGG game data
 * @param bggGame The game data object from BGG
 * @param entityType The type of entity to extract (e.g. boardgamepublisher)
 * @returns Array of extracted entities with id and value
 */
export function extractBggEntityLinks(bggGame: any, entityType: string) {
  const links = Array.isArray(bggGame?.link)
    ? bggGame.link.filter((item: any) => item?.type === entityType)
    : bggGame?.link &&
        typeof bggGame.link === "object" &&
        bggGame.link?.type === entityType
      ? [bggGame.link]
      : [];

  return links.map((entity: any) => ({
    id: entity?.id,
    value: entity?.value,
  }));
}

/**
 * Fetches accessory data from BGG API with caching
 * @param accessoryId The BoardGameGeek ID of the accessory to fetch
 * @returns The parsed accessory data from BGG
 */
export async function fetchBggAccessoryData(accessoryId: string | number) {
  try {
    const cacheKey = `accessory_${accessoryId}`;

    // Check if we have a valid cached response
    if (
      bggCache[cacheKey] &&
      Date.now() - bggCache[cacheKey].timestamp < CACHE_EXPIRY
    ) {
      return bggCache[cacheKey].data;
    }

    // Apply debouncing to avoid hitting BGG's rate limits
    await debounceApiBgg();

    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/thing?id=${accessoryId}`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data received from BGG");
    }

    // Cache the response
    bggCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error: any) {
    console.error(
      `Error fetching data from BGG for accessory ID ${accessoryId}:`,
      error
    );
    throw new Error(
      `Failed to fetch accessory data from BoardGameGeek: ${error.message}`
    );
  }
}

// Re-export the XML conversion function for compatibility
export { fetchXMLAndConvertToObject } from "@/lib/utils/fetchXMLAndConvertToJson";
