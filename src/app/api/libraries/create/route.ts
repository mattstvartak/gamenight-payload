import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@/payload.config";
import { headers as getHeaders } from "next/headers";

export async function POST(req: Request) {
  try {
    const headers = await getHeaders();
    const payload = await getPayload({
      config,
    });

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Library name is required" },
        { status: 400 }
      );
    }

    const { user } = await payload.auth({ headers });

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Create the library
    const library = await payload.create({
      collection: "library",
      data: {
        name,
        description,
        games: [],
      },
    });

    // Add the library to the user's library
    await payload.update({
      collection: "users",
      id: user.id,
      data: {
        library: [
          ...(user.library || []),
          {
            library: library.id,
          },
        ],
      },
    });

    return NextResponse.json(library);
  } catch (error) {
    console.error("Error creating library:", error);
    return NextResponse.json(
      { error: "Failed to create library" },
      { status: 500 }
    );
  }
}
