import { NextResponse } from "next/server";
import payload from "payload";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // First, try to find the user to check verification status
    const users = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: email,
        },
      },
    });

    const user = users.docs[0];

    // If user exists but is not verified
    if (user && !user._verified) {
      return NextResponse.json(
        {
          error:
            "Please verify your email before logging in. Check your inbox for the verification link.",
        },
        { status: 403 }
      );
    }

    // Attempt to log in
    const result = await payload.login({
      collection: "users",
      data: {
        email,
        password,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
}
