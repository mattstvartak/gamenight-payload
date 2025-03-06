import { NextResponse } from "next/server";
import { fetchXMLAndConvertToObject } from "@/lib/utils/fetchXMLAndConvertToJson";

export async function GET(request: Request) {
  try {
    // Get the search query from the URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Create the BGG API URL for searching games
    const bggApiUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;

    // Fetch and parse the XML data
    const jsonData = await fetchXMLAndConvertToObject(bggApiUrl);

    // Log the results to console
    console.log("BGG API Search Results:", JSON.stringify(jsonData, null, 2));

    // Process the data to a more usable format
    const games = processGameData(jsonData);

    // Return the processed data
    return NextResponse.json({
      query,
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Error searching games:", error);
    return NextResponse.json(
      { error: "Failed to search games" },
      { status: 500 }
    );
  }
}

// Helper function to process the BGG API response into a more usable format
function processGameData(data: any) {
  // BGG API returns data with the structure: items.item[...]
  const items = data?.items?.item || [];

  // Convert to an array if it's not already one
  const itemsArray = Array.isArray(items) ? items : [items];

  return itemsArray.map((item) => {
    // Extract the game information
    const id = item?.["@attributes"]?.id;
    const name =
      item?.name?.["@attributes"]?.value ||
      (Array.isArray(item?.name)
        ? item.name.find((n: any) => n?.["@attributes"]?.type === "primary")?.[
            "@attributes"
          ]?.value
        : item?.name?.["@attributes"]?.value);
    const yearPublished = item?.yearpublished?.["@attributes"]?.value;

    return {
      id,
      name,
      yearPublished: yearPublished ? parseInt(yearPublished) : null,
      thumbnailUrl: item?.thumbnail?.["#text"] || null,
    };
  });
}
