import { getPayload } from "payload";
import { NextResponse } from "next/server";
import config from "@/payload.config";
import { headers as getHeaders } from "next/headers";

export async function GET(req: Request) {
  try {
    const headers = await getHeaders();
    const payload = await getPayload({
      config,
    });

    const { user } = await payload.auth({ headers });

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Only return necessary information
    const publicUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      libraries: user.libraries,
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
