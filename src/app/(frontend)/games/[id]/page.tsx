import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Suspense } from "react";
import { Header } from "@/components/header";
import {
  Game as GameType,
  Media,
  Designer,
  Publisher,
  Category,
  Mechanic,
} from "@/payload-types";
import { GameSkeleton } from "@/app/(frontend)/games/[id]/components/GameSkeleton";
import { GameContent } from "@/app/(frontend)/games/[id]/components/GameContent";
import { GameProcessingRefresher } from "@/app/(frontend)/games/[id]/components/GameProcessingRefresher";
import { GameRelatedItemProcessor } from "@/app/(frontend)/games/[id]/components/GameRelatedItemProcessor";

// Define the response from the API
interface GameResponse {
  game: GameType | null;
  error: Error | null;
  processingInBackground?: boolean;
  processingDetails?: {
    publishers?: boolean;
    accessories?: boolean;
    expansions?: boolean;
    implementations?: boolean;
  };
  message?: string;
}

// Utility function to format plain text into Payload CMS Rich Text format
function formatRichText(text: string) {
  if (!text) return null;

  // Create paragraphs by splitting on newlines
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");

  // Format according to Payload CMS Lexical format
  return {
    root: {
      type: "root",
      version: 1,
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        version: 1,
        children: [
          {
            type: "text",
            version: 1,
            text: paragraph,
            // Required fields for Lexical format
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      })),
    },
  };
}

// Fetch game details from the API
async function getGameDetails(id: string): Promise<GameResponse> {
  try {
    // First, check if the game exists in the database
    const apiUrl = `${process.env.NEXT_PUBLIC_URL}/api/games/get?id=${id}`;
    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.log(
        `Game with ID ${id} not found in database, attempting to add it...`
      );

      // If not found, try to add the game from BGG
      try {
        const addResponse = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/games/add?id=${id}`
        );

        if (!addResponse.ok) {
          console.error(
            `Failed to add game with ID ${id}:`,
            await addResponse.text()
          );
          return {
            game: null,
            error: new Error(`Failed to add game with ID ${id}`),
            processingInBackground: false,
          };
        }

        const addData = await addResponse.json();

        // Even if the game is being processed, return a minimal game object
        // with the processing status to show the skeleton UI
        return {
          // Always return at least a minimal game object with an ID to show loading state
          game: {
            id: id,
            name: addData.name || `Game #${id}`,
            ...addData,
          },
          error: null,
          processingInBackground: true,
          message: "Game is being imported and processed. Please wait...",
        };
      } catch (error) {
        console.error("Error adding game:", error);
        return {
          game: null,
          error:
            error instanceof Error ? error : new Error("Error adding game"),
          processingInBackground: false,
        };
      }
    }

    // Game was found in the database
    try {
      const data = await response.json();

      if (!data) {
        console.error("API returned invalid game data");
        return {
          game: null,
          error: new Error("Invalid game data"),
          processingInBackground: false,
        };
      }

      // Check if the game is still being processed
      const stillProcessing = data.processed === false;

      // Convert the description to the proper Payload CMS Rich Text format
      if (data.description && typeof data.description === "string") {
        // Convert string to Payload CMS Rich Text format
        data.description = formatRichText(data.description);
      } else if (data.description && typeof data.description === "object") {
        // If it's already an object, ensure it's valid
        try {
          // Validate by stringifying and parsing (catches circular references)
          JSON.stringify(data.description);
        } catch (error) {
          console.error("Invalid description object format:", error);
          // Create an empty valid rich text object
          data.description = formatRichText(
            "Description could not be loaded properly."
          );
        }
      } else if (!data.description) {
        // Create an empty valid rich text object
        data.description = formatRichText("");
      }

      return {
        game: data,
        error: null,
        processingInBackground: stillProcessing,
        processingDetails: data.processingDetails,
        message: stillProcessing
          ? "Game data is still being processed. Check back soon for complete information."
          : data.message,
      };
    } catch (parseError) {
      console.error("Failed to parse game data response:", parseError);
      return {
        game: null,
        error:
          parseError instanceof Error
            ? parseError
            : new Error("Failed to parse response"),
        processingInBackground: false,
      };
    }
  } catch (error) {
    console.error("Error fetching game details:", error);
    return {
      game: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
      processingInBackground: false,
      processingDetails: {
        publishers: false,
        accessories: false,
        expansions: false,
        implementations: false,
      },
    };
  }
}

// Server component for the game details page
export default async function GameDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const pageParams = await params;
  const id = pageParams.id;

  const {
    game: gameData,
    error,
    processingInBackground,
    processingDetails,
    message,
  } = await getGameDetails(id);

  // If we can't find the game and it's not being processed, show error
  if (!gameData && !processingInBackground) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <p className="text-muted-foreground mt-2 mb-4">
          We couldn&apos;t find a game with ID {id}. The game might not exist or
          there was an error.
        </p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <Header />

      <main className="flex-1 container py-6 mx-auto max-w-screen-xl">
        {processingInBackground && (
          <GameProcessingRefresher gameId={id} initialMessage={message} />
        )}

        {gameData && <GameRelatedItemProcessor game={gameData} />}

        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <Suspense fallback={<GameSkeleton />}>
            {gameData && <GameContent game={gameData} />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
