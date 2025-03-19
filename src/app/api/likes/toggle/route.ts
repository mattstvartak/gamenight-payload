import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@payload-config";

export async function POST(request: Request) {
  try {
    // Initialize payload
    const payload = await getPayload({
      config,
    });

    // Get request body
    const body = await request.json();
    const { id, collection, userId } = body;

    if (!id || !collection || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: id, collection, and userId" },
        { status: 400 }
      );
    }

    console.log(`Toggling like for ${collection} ID ${id} by user ${userId}`);

    // Validate collection is one of the allowed collections
    const allowedCollections = [
      "games",
      "accessories",
      "artists",
      "categories",
      "designers",
      "publishers",
    ];
    if (!allowedCollections.includes(collection)) {
      return NextResponse.json(
        {
          error: `Collection must be one of: ${allowedCollections.join(", ")}`,
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user) {
      console.log(`User ${userId} not found`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this item is already liked
    const likes = user.likes || [];
    console.log(`User ${userId} has ${likes.length} likes before update`);

    // Ensure IDs are consistently compared as strings
    const gameIdString = String(id);
    const gameIdNumber = parseInt(gameIdString, 10);

    // In Payload, relationship fields with multiple collections use a format like { relationTo: 'games', value: 'id' }
    const existingLikeIndex = likes.findIndex((like: any) => {
      // Handle different possible formats of relationship data
      if (typeof like === "object" && like !== null) {
        return (
          like.relationTo === collection && String(like.value) === gameIdString
        );
      }
      return false;
    });

    let isLiked = false;
    const updatedLikes = [...likes];

    if (existingLikeIndex >= 0) {
      // Remove the like
      console.log(`Removing like for ${collection} ID ${id}`);
      updatedLikes.splice(existingLikeIndex, 1);
      isLiked = false;
    } else {
      // Add the like
      console.log(`Adding like for ${collection} ID ${id}`);

      // Format relationship data per Payload expectations
      // For relationship fields that support multiple collections, use this format
      updatedLikes.push({
        relationTo: collection,
        value: gameIdNumber, // Use number ID
      });
      isLiked = true;
    }

    console.log(
      `User ${userId} will have ${updatedLikes.length} likes after update`
    );
    console.log("Updated likes array:", JSON.stringify(updatedLikes));

    // Update the user
    try {
      const updateResult = await payload.update({
        collection: "users",
        id: userId,
        data: {
          likes: updatedLikes,
        },
        // Add the authenticated user to the request context
        // This ensures access control checks will pass
        user: {
          id: userId,
          roles: user.roles, // Pass the user's roles to maintain them
        },
        overrideAccess: false, // Still apply access control rules
      });
      console.log(`Successfully updated likes for user ${userId}`);
      return NextResponse.json({ isLiked });
    } catch (updateError: any) {
      console.error("Error updating user:", updateError);
      // Log the full error for debugging
      console.log("Full error details:", JSON.stringify(updateError));

      return NextResponse.json(
        {
          error:
            "Failed to update likes: " +
            (updateError.message || "Unknown error"),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to update likes" },
      { status: 500 }
    );
  }
}
