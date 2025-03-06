import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    // Get the referer header to determine where to redirect back to
    const headersList = await headers();
    const referer = headersList.get("referer");

    // Default to homepage if no referer is available
    const redirectUrl =
      referer || new URL("/", process.env.NEXT_PUBLIC_SERVER_URL).toString();

    // Create response with redirect
    const response = NextResponse.redirect(redirectUrl, {
      status: 302,
    });

    // Clear the auth cookie
    response.cookies.delete("payload-token");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_SERVER_URL),
      {
        status: 302,
      }
    );
  }
}
