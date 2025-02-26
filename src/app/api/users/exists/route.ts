import { getPayload } from 'payload';
import { NextResponse } from 'next/server';
import config from '@/payload.config';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    const payload = await getPayload({
      config,
    });

    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      depth: 0,
    });

    return NextResponse.json({ exists: users.docs.length > 0 });
  } catch (error) {
    console.error('Error checking user existence:', error);
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
  }
} 