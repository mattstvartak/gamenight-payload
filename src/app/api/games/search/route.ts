import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

interface SearchResult {
  id: string;
  type: string;
  name: string;
}

// Keep track of last request times for rate limiting
const requestTimes: { [key: string]: number } = {};
const RATE_LIMIT_WINDOW = 2000; // 2 seconds between requests from the same IP

async function fetchWithRetry(
  url: string,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      // BGG API sometimes returns 202 when the request is accepted but not ready
      if (response.status === 202) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      if (response.ok) {
        return response;
      }

      // If we get here, the response wasn't ok
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i === retries - 1) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error(`Failed to fetch after ${retries} retries`);
}

export async function GET(req: Request) {
  try {
    // Basic rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const lastRequest = requestTimes[ip] || 0;

    if (now - lastRequest < RATE_LIMIT_WINDOW) {
      return NextResponse.json(
        { error: "Please wait a moment before searching again" },
        { status: 429 }
      );
    }

    requestTimes[ip] = now;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const response = await fetchWithRetry(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
        query
      )}&type=boardgame,boardgameexpansion`,
      3,
      1000
    );

    const text = await response.text();
    
    if (!text.trim()) {
      return NextResponse.json({ results: [] });
    }

    const dom = new JSDOM(text, { contentType: "text/xml" });
    const xmlDoc = dom.window.document;
    
    if (!xmlDoc || !xmlDoc.documentElement) {
      throw new Error("Invalid XML response from BGG API");
    }

    const items = xmlDoc.getElementsByTagName("item");

    const results = Array.from(items)
      .map((item) => {
        const id = item.getAttribute("id");
        const type = item.getAttribute("type");
        const nameElement = item.querySelector("name");
        const name = nameElement?.getAttribute("value") || "";
        return id && type && name ? { id, type, name } : null;
      })
      .filter((item): item is SearchResult => item !== null)
      // Limit to first 50 results to prevent overwhelming the client
      .slice(0, 50);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching games:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while searching games",
      },
      { status: 500 }
    );
  }
} 