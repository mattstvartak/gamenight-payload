import { getPayload } from 'payload';
import { NextResponse } from 'next/server';
import config from '@/payload.config';
import { validatePassword } from '@/utils/validation/password';
import { isValidEmail } from '@/utils/validation/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, username } = body;

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!Object.values(passwordValidation).every(Boolean)) {
      return NextResponse.json(
        { error: 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    const payload = await getPayload({
      config,
    });

    // Check if user with email already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    });

    if (existingUsers.docs.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username is taken
    const existingUsernames = await payload.find({
      collection: 'users',
      where: {
        username: {
          equals: username,
        },
      },
    });

    if (existingUsernames.docs.length > 0) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Create the user
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        username,
        roles: ['user'],
      },
    });

    // Return user data without sensitive information
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 