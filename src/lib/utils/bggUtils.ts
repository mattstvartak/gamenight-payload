import { delay } from "./asyncUtils";
import { fetchXMLAndConvertToObject } from "./fetchXMLAndConvertToJson";

/**
 * Fetches game data from BGG API
 * @param bggId The BoardGameGeek ID of the game to fetch
 * @returns The parsed game data from BGG
 */
export async function fetchBggGameData(bggId: string | number) {
  try {
    console.log(`Fetching BGG data for game ID: ${bggId}`);
    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data received from BGG");
    }

    return data;
  } catch (error: any) {
    console.error(`Error fetching data from BGG for ID ${bggId}:`, error);
    throw new Error(
      `Failed to fetch data from BoardGameGeek: ${error.message}`
    );
  }
}

/**
 * Fetches publisher data from BGG API
 * @param publisherId The BoardGameGeek publisher ID
 * @returns The parsed publisher data from BGG
 */
export async function fetchBggPublisherData(publisherId: string | number) {
  try {
    console.log(`Fetching detailed publisher info for ID: ${publisherId}`);

    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/family?id=${publisherId}`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      console.log(
        `Invalid publisher data format for ID ${publisherId}, proceeding with basic info only`
      );
      return {};
    }

    return data;
  } catch (error) {
    console.error(
      `Error fetching publisher details for ID ${publisherId}:`,
      error
    );
    return {};
  }
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
 * Fetches accessory data from BGG API
 * @param accessoryId The BoardGameGeek ID of the accessory to fetch
 * @returns The parsed accessory data from BGG
 */
export async function fetchBggAccessoryData(accessoryId: string | number) {
  try {
    console.log(`Fetching BGG data for accessory ID: ${accessoryId}`);
    const data = await fetchXMLAndConvertToObject(
      `https://boardgamegeek.com/xmlapi2/thing?id=${accessoryId}`
    );

    // Check if the data has the expected structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data received from BGG");
    }

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
