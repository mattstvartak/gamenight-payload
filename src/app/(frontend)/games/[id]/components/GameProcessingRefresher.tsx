"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

export const GameProcessingRefresher = ({
  gameId,
  initialMessage,
}: {
  gameId: string;
  initialMessage?: string;
}) => {
  const [countdown, setCountdown] = useState(15);
  const [message, setMessage] = useState(
    initialMessage ||
      "Game is being processed. Page will refresh automatically..."
  );
  const [isPolling, setIsPolling] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return;

    let pollInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const checkGameStatus = async () => {
      try {
        // Check the game's processing status
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/games/get?id=${gameId}`,
          {
            cache: "no-store",
          }
        );

        if (response.ok) {
          const data = await response.json();

          // If the game exists and processing is completed
          if (data && data.processed === true) {
            // Stop polling and refresh the page
            setMessage("Game processing complete! Refreshing page...");
            setIsPolling(false);

            // Refresh the page to show the completed game
            setTimeout(() => {
              router.refresh();
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error checking game status:", error);
      }
    };

    // Start polling
    if (isPolling) {
      // Check immediately
      checkGameStatus();

      // Then check every 15 seconds
      pollInterval = setInterval(checkGameStatus, 15000);

      // Countdown timer for better user experience
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Reset countdown to 15 when it reaches 0
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [gameId, isPolling, router]);

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
      <div className="flex items-center justify-between">
        <p className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {message}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm">Refreshing in {countdown}s</span>
          <button
            onClick={() => router.refresh()}
            className="p-1 rounded-full hover:bg-yellow-200 transition-colors"
            aria-label="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
