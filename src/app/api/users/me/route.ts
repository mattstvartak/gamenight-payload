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
      return NextResponse.json({
        id: null,
        username: null,
        firstName: null,
        lastName: null,
        email: null,
        roles: [],
        libraries: [],
        gameNights: [],
        phone: null,
        isAuthenticated: false,
      });
    }

    // Return all user fields
    const publicUser = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      libraries: user.libraries,
      gameNights: user.gameNights,
      phone: user.phone,
      isAuthenticated: true,
    };

    return NextResponse.json(publicUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({
      id: null,
      username: null,
      firstName: null,
      lastName: null,
      email: null,
      roles: [],
      libraries: [],
      gameNights: [],
      phone: null,
      isAuthenticated: false,
    });
  }
}
