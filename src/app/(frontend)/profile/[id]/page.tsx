import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Media } from '@/payload-types';
import { cookies } from 'next/headers';
import { SendFriendRequest } from './SendFriendRequest';
import { Gamepad2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    if (!process.env.NEXT_PUBLIC_SERVER_URL) {
      throw new Error('NEXT_PUBLIC_SERVER_URL is not defined in environment variables');
    }

    // Fetch current user
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token')?.value;
    
    let currentUser = null;
    if (token) {
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      });
      if (meResponse.ok) {
        currentUser = await meResponse.json();
      }
    }

    // Fetch profile user
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/profile/${id}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      const errorText = await response.text();
      console.error('Fetch error:', response.status, errorText);
      throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
    }

    const user = await response.json();

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-md">
          <CardHeader className="pb-2">
            <div className="flex flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                {user.avatar && typeof user.avatar !== 'number' && (
                  <AvatarImage 
                    src={`/media/${user.avatar.filename}`} 
                    alt={user.username} 
                  />
                )}
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col space-y-1 flex-grow">
                <h1 className="text-3xl font-bold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h1>
                <p className="text-lg">@{user.username}</p>
                <p className="text-sm mt-2">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {currentUser?.user && currentUser.user.username !== user.username && (
                  <div className="mt-4">
                    <SendFriendRequest targetUserId={id} />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {user.libraries && user.libraries.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Game Libraries</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {user.libraries.map((lib: any) => (
                    <Card key={lib.id}>
                      <CardContent className="p-4">
                        <h3 className="font-medium">
                          {lib.library?.name || 'Unnamed Library'}
                        </h3>
                        {lib.library?.description && (
                          <p className="text-sm mt-1">
                            {lib.library.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error in ProfilePage:', error);
    throw error;
  }
}
