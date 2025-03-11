import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { formatRichText } from "@/lib/utils/formatUtils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
  }

  // Check our database for the game
  const payload = await getPayload({ config });
  try {
    const game = await payload.find({
      collection: "games",
      where: { bggId: { equals: id } },
    });

    if (game.docs.length > 0) {
      const gameData = game.docs[0];

      // Ensure the description is properly formatted as rich text
      if (gameData.description && typeof gameData.description === "string") {
        const formattedDescription = formatRichText(gameData.description);
        if (formattedDescription) {
          // Need to cast to any to avoid TypeScript errors with the rich text format
          gameData.description = formattedDescription as any;
        }
      }

      return NextResponse.json(gameData);
    }

    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Error fetching game" }, { status: 500 });
  }
}
