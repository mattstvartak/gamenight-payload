import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { JSDOM } from "jsdom";

async function fetchBGGGameDetails(bggId: string) {
  const response = await fetch(
    `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`
  );
  const text = await response.text();
  const dom = new JSDOM(text, { contentType: "text/xml" });
  const xmlDoc = dom.window.document;
  const item = xmlDoc.querySelector("item");

  if (!item) {
    throw new Error("Game not found on BoardGameGeek");
  }

  const nameElement = item.querySelector('name[type="primary"]');
  const description = item.querySelector("description")?.textContent;
  const yearPublished = item
    .querySelector("yearpublished")
    ?.getAttribute("value");
  const thumbnail = item.querySelector("thumbnail")?.textContent;
  const image = item.querySelector("image")?.textContent;
  const minPlayers = Number(
    item.querySelector("minplayers")?.getAttribute("value")
  );
  const maxPlayers = Number(
    item.querySelector("maxplayers")?.getAttribute("value")
  );
  const minPlaytime = Number(
    item.querySelector("minplaytime")?.getAttribute("value")
  );
  const maxPlaytime = Number(
    item.querySelector("maxplaytime")?.getAttribute("value")
  );
  const minAge = Number(item.querySelector("minage")?.getAttribute("value"));
  const rating = Number(
    item.querySelector("statistics > ratings > average")?.getAttribute("value")
  );
  const weight = Number(
    item
      .querySelector("statistics > ratings > averageweight")
      ?.getAttribute("value")
  );

  const categories = Array.from(
    item.querySelectorAll(
      'link[type="boardgamecategory"]'
    ) as NodeListOf<Element>
  ).map((el) => el.getAttribute("value") || "");
  const mechanics = Array.from(
    item.querySelectorAll(
      'link[type="boardgamemechanic"]'
    ) as NodeListOf<Element>
  ).map((el) => el.getAttribute("value") || "");
  const designers = Array.from(
    item.querySelectorAll(
      'link[type="boardgamedesigner"]'
    ) as NodeListOf<Element>
  ).map((el) => el.getAttribute("value") || "");
  const publishers = Array.from(
    item.querySelectorAll(
      'link[type="boardgamepublisher"]'
    ) as NodeListOf<Element>
  ).map((el) => el.getAttribute("value") || "");

  return {
    name: nameElement?.getAttribute("value") || "",
    description: description || undefined,
    yearPublished: yearPublished || undefined,
    thumbnail: thumbnail || undefined,
    image: image || undefined,
    minPlayers: minPlayers || undefined,
    maxPlayers: maxPlayers || undefined,
    minPlaytime: minPlaytime || undefined,
    maxPlaytime: maxPlaytime || undefined,
    minAge: minAge || undefined,
    rating: rating || undefined,
    weight: weight || undefined,
    categories,
    mechanics,
    designers,
    publishers,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bggId = searchParams.get("bggId");

    if (!bggId) {
      return NextResponse.json(
        { error: "BoardGameGeek ID is required" },
        { status: 400 }
      );
    }

    const payload = await getPayload({
      config,
    });

    // First try to get the game from our database
    const existingGame = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: bggId,
        },
      },
      depth: 2,
    });

    // If game exists in Payload, return it
    if (existingGame.docs.length > 0) {
      const payloadGame = existingGame.docs[0];
      return NextResponse.json({
        source: "payload",
        game: {
          id: bggId,
          name: payloadGame.name || "",
          description: payloadGame.description || undefined,
          image:
            payloadGame.image && typeof payloadGame.image !== "number"
              ? payloadGame.image.url
              : undefined,
          yearPublished: payloadGame.yearPublished?.toString(),
          minPlayers: payloadGame.minPlayers || undefined,
          maxPlayers: payloadGame.maxPlayers || undefined,
          minPlaytime: payloadGame.minPlaytime || undefined,
          maxPlaytime: payloadGame.maxPlaytime || undefined,
          minAge: payloadGame.minAge || undefined,
          weight: payloadGame.complexity || undefined,
          categories:
            payloadGame.categories
              ?.map((c) => {
                if (!c.category || typeof c.category === "number") return "";
                return c.category.name || "";
              })
              .filter((name) => name !== "") || [],
          mechanics:
            payloadGame.mechanics
              ?.map((m) => {
                if (!m.mechanic || typeof m.mechanic === "number") return "";
                return m.mechanic.name || "";
              })
              .filter((name) => name !== "") || [],
        },
      });
    }

    // If game doesn't exist, get it from BGG
    const bggGame = await fetchBGGGameDetails(bggId);

    // Create the game using the create endpoint
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/games/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bggId,
          gameDetails: bggGame,
        }),
      }
    );

    if (!createResponse.ok) {
      throw new Error("Failed to create game in database");
    }

    // Return the BGG data immediately while the game is being created
    return NextResponse.json({
      source: "bgg",
      game: {
        id: bggId,
        ...bggGame,
      },
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch game details",
      },
      { status: 500 }
    );
  }
}
