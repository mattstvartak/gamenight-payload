import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@/payload.config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const payload = await getPayload({
      config,
    });

    const { docs: users } = await payload.find({
      collection: "users",
      where: {
        username: {
          equals: username,
        },
      },
      depth: 1,
    });

    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only return public information
    const publicUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      library: user.library,
      createdAt: user.createdAt,
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
