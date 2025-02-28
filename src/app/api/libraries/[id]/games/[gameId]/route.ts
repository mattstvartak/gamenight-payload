import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers as getHeaders } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const payload = await getPayload({ config });

    // Get the library
    const library = await payload.findByID({
      collection: "library",
      id: params.id,
    });

    if (!library) {
      return NextResponse.json({ error: "Library not found" }, { status: 404 });
    }

    // Filter out the game to remove
    const updatedGames =
      library.games?.filter(
        (game) =>
          typeof game.game === "object" &&
          game.game !== null &&
          game.game.id !== Number(params.gameId)
      ) || [];

    // Update the library
    await payload.update({
      collection: "library",
      id: params.id,
      data: {
        games: updatedGames,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing game from library:", error);
    return NextResponse.json(
      { error: "Failed to remove game from library" },
      { status: 500 }
    );
  }
}
