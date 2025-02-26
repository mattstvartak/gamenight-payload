import { NextResponse } from "next/server";
import payload from "payload";
import type { Game } from "../../../../payload-types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    // Create the game using Payload
    const game = await payload.create({
      collection: "games",
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        "affiliate link": body["affiliate link"],
        type: body.type,
        minPlayers: body.minPlayers,
        maxPlayers: body.maxPlayers,
        minPlaytime: body.minPlaytime,
        maxPlaytime: body.maxPlaytime,
        minAge: body.minAge,
        complexity: body.complexity,
        "official link": body["official link"],
        categories: body.categories?.map((category) => ({
          category: category,
        })),
        mechanics: body.mechanics?.map((mechanic) => ({
          mechanic: mechanic,
        })),
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
