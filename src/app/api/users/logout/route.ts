import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response with redirect
    const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SERVER_URL), {
      status: 302
    });

    // Clear the auth cookie
    response.cookies.delete('payload-token');

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SERVER_URL), {
      status: 302
    });
  }
} 