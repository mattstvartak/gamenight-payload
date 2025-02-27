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
      // Return a default response for unauthenticated users
      return NextResponse.json({
        id: null,
        username: null,
        firstName: null,
        lastName: null,
        libraries: [],
        isAuthenticated: false
      });
    }

    // Only return necessary information
    const publicUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      libraries: user.libraries,
      isAuthenticated: true
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    // Return the same default response on error
    return NextResponse.json({
      id: null,
      username: null,
      firstName: null,
      lastName: null,
      libraries: [],
      isAuthenticated: false
    });
  }
}
