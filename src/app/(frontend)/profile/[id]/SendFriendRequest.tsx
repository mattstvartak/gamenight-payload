'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

interface SendFriendRequestProps {
  targetUserId: string;
}

export function SendFriendRequest({ targetUserId }: SendFriendRequestProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      toast.success('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleSendRequest} 
      disabled={isLoading}
    >
      {isLoading ? 'Sending...' : 'Send Friend Request'}
    </Button>
  );
} 