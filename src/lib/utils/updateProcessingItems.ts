/**
 * Utility function to find and update games or accessories that are still in processing state
 */

/**
 * Search for games that are still in processing state and update them
 * @param baseUrl The base URL of the API
 * @param limit The maximum number of items to process (default: 10)
 * @returns The results of the update operation
 */
export async function updateProcessingGames(
  baseUrl: string,
  limit: number = 10
) {
  try {
    // Create API URL with the current domain
    const apiUrl = `${baseUrl}/api/games/update`;

    // First, fetch games that are still processing
    const payload = await fetch(
      `${baseUrl}/api/payload/games?where[processed][equals]=false&limit=${limit}`
    );
    const gamesData = await payload.json();

    if (!gamesData?.docs || gamesData.docs.length === 0) {
      return {
        message: "No processing games found",
        updated: 0,
      };
    }

    console.log(`Found ${gamesData.docs.length} games still processing`);

    // Extract the IDs
    const gameIds = gamesData.docs.map((game: any) => game.id);

    // Call the update endpoint
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: gameIds,
        collection: "games",
      }),
    });

    const result = await response.json();

    return {
      message: `Updated ${result.results?.length || 0} games`,
      results: result,
    };
  } catch (error) {
    console.error("Error updating processing games:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      updated: 0,
    };
  }
}

/**
 * Search for accessories that are still in processing state and update them
 * @param baseUrl The base URL of the API
 * @param limit The maximum number of items to process (default: 10)
 * @returns The results of the update operation
 */
export async function updateProcessingAccessories(
  baseUrl: string,
  limit: number = 10
) {
  try {
    // Create API URL with the current domain
    const apiUrl = `${baseUrl}/api/games/update`;

    // First, fetch accessories that are still processing
    const payload = await fetch(
      `${baseUrl}/api/payload/accessories?where[processing][equals]=true&limit=${limit}`
    );
    const accessoriesData = await payload.json();

    if (!accessoriesData?.docs || accessoriesData.docs.length === 0) {
      return {
        message: "No processing accessories found",
        updated: 0,
      };
    }

    console.log(
      `Found ${accessoriesData.docs.length} accessories still processing`
    );

    // Extract the IDs
    const accessoryIds = accessoriesData.docs.map(
      (accessory: any) => accessory.id
    );

    // Call the update endpoint
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: accessoryIds,
        collection: "accessories",
      }),
    });

    const result = await response.json();

    return {
      message: `Updated ${result.results?.length || 0} accessories`,
      results: result,
    };
  } catch (error) {
    console.error("Error updating processing accessories:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      updated: 0,
    };
  }
}

/**
 * Update all processing items (both games and accessories)
 * @param baseUrl The base URL of the API
 * @param limit The maximum number of items to process per collection (default: 10)
 * @returns The results of the update operation
 */
export async function updateAllProcessingItems(
  baseUrl: string,
  limit: number = 10
) {
  const gamesResult = await updateProcessingGames(baseUrl, limit);
  const accessoriesResult = await updateProcessingAccessories(baseUrl, limit);

  return {
    games: gamesResult,
    accessories: accessoriesResult,
    totalUpdated:
      (gamesResult.results?.results?.length || 0) +
      (accessoriesResult.results?.results?.length || 0),
  };
}
