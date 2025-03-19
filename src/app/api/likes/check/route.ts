import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@payload-config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const userId = searchParams.get("userId");

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // If no user ID is provided, return not liked
    if (!userId) {
      return NextResponse.json({ isLiked: false });
    }

    console.log(`Checking if game ${gameId} is liked by user ${userId}`);

    // Initialize payload
    const payload = await getPayload({
      config,
    });

    // Get user with likes
    let user;
    try {
      user = await payload.findByID({
        collection: "users",
        id: userId,
        depth: 0,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json({ isLiked: false });
    }

    if (!user) {
      console.log(`User ${userId} not found`);
      return NextResponse.json({ isLiked: false });
    }

    // Check if this game is already liked
    const likes = user.likes || [];
    console.log(`User ${userId} has ${likes.length} likes`);

    // In Payload, relationship fields with multiple collections use a format like { relationTo: 'games', value: 'id' }
    const isLiked = likes.some(
      (like: any) =>
        like.relationTo === "games" && String(like.value) === String(gameId)
    );

    console.log(`Game ${gameId} isLiked: ${isLiked}`);
    return NextResponse.json({ isLiked });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    );
  }
}
