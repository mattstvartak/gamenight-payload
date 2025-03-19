import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Cache for entity existence checks to minimize DB queries
 * Format: { [collection_id]: Set<bggId> }
 */
const existenceCache: Record<string, Set<string>> = {
  games: new Set(),
  accessories: new Set(),
};

/**
 * Checks if multiple BGG IDs exist in a collection in a single query
 * Much faster than checking each ID individually
 *
 * @param collection The Payload collection to check
 * @param bggIds Array of BGG IDs to check (can be string or number)
 * @returns Object mapping bggId to document ID if it exists
 */
export async function batchCheckExistence(
  collection: "games" | "accessories",
  bggIds: (string | number)[]
): Promise<Record<string, string>> {
  // If no IDs to check, return empty result
  if (!bggIds || bggIds.length === 0) {
    return {};
  }

  // Convert all IDs to strings for consistency
  const stringIds = bggIds.map((id) => String(id));

  // Get payload instance
  const payload = await getPayload({ config });

  // Filter out IDs we already know exist in the cache
  const cachedSet = existenceCache[collection] || new Set();
  const idsToCheck = stringIds.filter((id) => !cachedSet.has(id));

  // If all IDs are in cache, do a more efficient lookup
  if (idsToCheck.length === 0) {
    // Still need to get the actual document IDs
    const result: Record<string, string> = {};
    for (const bggId of stringIds) {
      // If in cache, get the ID from database
      if (cachedSet.has(bggId)) {
        try {
          const doc = await payload.find({
            collection,
            where: {
              bggId: {
                equals: bggId,
              } as any,
            },
            limit: 1,
          });

          if (doc.docs.length > 0) {
            // Use unknown as intermediate type to avoid direct conversion error
            const id: unknown = doc.docs[0].id;
            result[bggId] = String(id);
          }
        } catch (err) {
          console.error(
            `Error looking up cached ${collection} ID ${bggId}:`,
            err
          );
        }
      }
    }
    return result;
  }

  // Perform batch query for all IDs we need to check
  try {
    const response = await payload.find({
      collection,
      where: {
        bggId: {
          in: idsToCheck,
        } as any,
      },
      limit: idsToCheck.length,
    });

    // Create map of bggId to document ID
    const result: Record<string, string> = {};
    for (const doc of response.docs as any[]) {
      if (doc.bggId) {
        const bggIdStr = String(doc.bggId);
        // Use unknown as intermediate type to avoid direct conversion error
        const id: unknown = doc.id;
        result[bggIdStr] = String(id);
        // Also update our cache
        cachedSet.add(bggIdStr);
      }
    }

    // Update the collection's cache
    existenceCache[collection] = cachedSet;

    return result;
  } catch (err) {
    console.error(`Error batch checking ${collection}:`, err);
    return {};
  }
}

/**
 * Adds a BGG ID to the existence cache once we know it exists
 * Call this after creating a new item to avoid redundant DB checks
 *
 * @param collection The collection name
 * @param bggId The BGG ID that now exists
 * @param docId The document ID in the database
 */
export function updateExistenceCache(
  collection: "games" | "accessories",
  bggId: string | number,
  docId: string
): void {
  if (!existenceCache[collection]) {
    existenceCache[collection] = new Set();
  }

  // Ensure we're adding a string to the Set
  existenceCache[collection].add(String(bggId));
}

/**
 * Clears all existence caches
 * Call this if you need to reset the state
 */
export function clearExistenceCaches(): void {
  existenceCache.games = new Set();
  existenceCache.accessories = new Set();
}
