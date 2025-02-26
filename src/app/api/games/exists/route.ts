import { NextResponse } from "next/server";
import payload from "payload";

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

    const existingGame = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: bggId,
        },
      },
      limit: 1,
    });

    return NextResponse.json({
      exists: existingGame.docs.length > 0,
      game: existingGame.docs[0] || null,
    });
  } catch (error) {
    console.error("Error checking game existence:", error);
    return NextResponse.json(
      { error: "Failed to check game existence" },
      { status: 500 }
    );
  }
}
