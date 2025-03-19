import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getPayload } from "payload";
import config from "@payload-config";

import { Header } from "@/components/header";
import { Game as GameType } from "@/payload-types";
import { GameSkeleton } from "@/app/(frontend)/games/[id]/components/GameSkeleton";
import { GameContent } from "@/app/(frontend)/games/[id]/components/GameContent";
import { GameProcessingRefresher } from "@/app/(frontend)/games/[id]/components/GameProcessingRefresher";
import { GameRelatedItemProcessor } from "@/app/(frontend)/games/[id]/components/GameRelatedItemProcessor";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Function to get expansion details with parent game info
async function getExpansionDetails(id: string) {
  try {
    const payload = await getPayload({ config });

    // First try to find the expansion by bggId
    let expansion = null;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
      // Try to find by bggId first
      const expansionsByBggId = await payload.find({
        collection: "games",
        where: { bggId: { equals: parseInt(id, 10) } },
        depth: 2, // Get relationships like the base game
      });

      if (expansionsByBggId.docs.length > 0) {
        expansion = expansionsByBggId.docs[0];
      }
    }

    // If not found by bggId, try to find by internal ID
    if (!expansion) {
      try {
        expansion = await payload.findByID({
          collection: "games",
          id,
          depth: 2, // Get relationships like the base game
        });
      } catch (error) {
        console.log(`Expansion not found by ID: ${id}`);
        // Continue to the next check
      }
    }

    if (!expansion) {
      return {
        game: null,
        parentGame: null,
        error: new Error("Expansion not found"),
        processingInBackground: false,
      };
    }

    // Get the parent game if available
    let parentGame = null;
    if (expansion.baseGame) {
      console.log("Expansion baseGame data:", expansion.baseGame);

      try {
        // If baseGame is an object with id
        if (typeof expansion.baseGame === "object" && expansion.baseGame.id) {
          console.log(
            `Found baseGame as object with id: ${expansion.baseGame.id}`
          );

          // If the baseGame object already has a name and fields we need, use it directly
          if (expansion.baseGame.name) {
            console.log(
              `BaseGame object already has name: ${expansion.baseGame.name}`
            );
            parentGame = expansion.baseGame;
          } else {
            // First try to get the parent game by internal ID
            try {
              parentGame = await payload.findByID({
                collection: "games",
                id: expansion.baseGame.id,
                depth: 0, // We just need basic parent info
              });
              console.log(
                `Found parent game by internal ID: ${parentGame.name}`
              );
            } catch (err) {
              console.log(
                `Couldn't find parent game by internal ID: ${expansion.baseGame.id}`
              );
              // If that fails and we have a bggId, try by bggId
              if (expansion.baseGame.bggId) {
                console.log(
                  `Trying to find parent game by bggId: ${expansion.baseGame.bggId}`
                );
                const parentGamesByBggId = await payload.find({
                  collection: "games",
                  where: { bggId: { equals: expansion.baseGame.bggId } },
                  depth: 0,
                });

                if (parentGamesByBggId.docs.length > 0) {
                  parentGame = parentGamesByBggId.docs[0];
                  console.log(`Found parent game by bggId: ${parentGame.name}`);
                }
              }
            }
          }
        }
        // If baseGame is just an ID
        else if (
          typeof expansion.baseGame === "string" ||
          typeof expansion.baseGame === "number"
        ) {
          const baseGameId = expansion.baseGame;
          console.log(`Found baseGame as ID: ${baseGameId}`);

          // First try to interpret as internal ID
          try {
            parentGame = await payload.findByID({
              collection: "games",
              id: baseGameId,
              depth: 0,
            });
            console.log(`Found parent game by internal ID: ${parentGame.name}`);
          } catch (err) {
            console.log(
              `Couldn't find parent game by internal ID: ${baseGameId}`
            );

            // If numeric, try interpreting as bggId
            if (typeof baseGameId === "number" || !isNaN(Number(baseGameId))) {
              console.log(`Trying to find parent game by bggId: ${baseGameId}`);
              const numericId =
                typeof baseGameId === "number"
                  ? baseGameId
                  : Number(baseGameId);

              const parentGamesByBggId = await payload.find({
                collection: "games",
                where: { bggId: { equals: numericId } },
                depth: 0,
              });

              if (parentGamesByBggId.docs.length > 0) {
                parentGame = parentGamesByBggId.docs[0];
                console.log(`Found parent game by bggId: ${parentGame.name}`);
              }
            }
          }
        }

        console.log(
          "Loaded parentGame:",
          parentGame ? `${parentGame.name} (ID: ${parentGame.id})` : "Not found"
        );
      } catch (error) {
        console.error("Error loading parent game:", error);
        // Even if we fail to load the detailed parent game, keep the baseGame reference
        // This will allow the UI to still show a link with the ID
        parentGame = null;
      }
    } else {
      console.log("No baseGame found for this expansion.");
    }

    return {
      game: expansion,
      parentGame,
      error: null,
      processingInBackground: expansion.processed === false,
      processingDetails: {}, // Details about what's being processed
    };
  } catch (error) {
    console.error("Error fetching expansion details:", error);
    return {
      game: null,
      parentGame: null,
      error,
      processingInBackground: false,
    };
  }
}

// Server component for the expansion details page
export default async function ExpansionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const pageParams = await params;
  const id = pageParams.id;

  const {
    game: expansionData,
    parentGame,
    error,
    processingInBackground,
    processingDetails,
  } = await getExpansionDetails(id);

  // If we can't find the expansion and it's not being processed, show error
  if (!expansionData && !processingInBackground) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Expansion not found</h1>
        <p className="text-muted-foreground mt-2 mb-4">
          We couldn&apos;t find an expansion with ID {id}. The expansion might
          not exist or there was an error.
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
          <GameProcessingRefresher
            gameId={id}
            initialMessage="Expansion is being processed. Page will refresh automatically..."
          />
        )}

        {expansionData && <GameRelatedItemProcessor game={expansionData} />}

        <div className="mb-6">
          {/* Breadcrumb navigation */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              {/* Always ensure Dashboard > Base Game > Expansion order */}
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />

              {parentGame ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={`/games/${parentGame.bggId || parentGame.id}`}
                      >
                        {parentGame.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : (
                // Only show this if we have baseGame data but couldn't load parent details
                expansionData?.baseGame && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        {/* If baseGame is an object with name, use it */}
                        {typeof expansionData.baseGame === "object" &&
                        expansionData.baseGame.name ? (
                          <Link
                            href={`/games/${
                              typeof expansionData.baseGame === "object" &&
                              expansionData.baseGame.bggId
                                ? expansionData.baseGame.bggId
                                : typeof expansionData.baseGame === "object" &&
                                    expansionData.baseGame.id
                                  ? expansionData.baseGame.id
                                  : typeof expansionData.baseGame === "number"
                                    ? expansionData.baseGame
                                    : ""
                            }`}
                          >
                            {typeof expansionData.baseGame === "object" &&
                              expansionData.baseGame.name}
                          </Link>
                        ) : (
                          // If baseGame is just an ID and we don't have name info, show the ID
                          <Link
                            href={`/games/${
                              typeof expansionData.baseGame === "number" ||
                              typeof expansionData.baseGame === "string"
                                ? expansionData.baseGame
                                : ""
                            }`}
                          >
                            Base Game #
                            {typeof expansionData.baseGame === "number" ||
                            typeof expansionData.baseGame === "string"
                              ? expansionData.baseGame
                              : "?"}
                          </Link>
                        )}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )
              )}

              <BreadcrumbItem>
                <BreadcrumbLink className="font-medium">
                  {expansionData?.name || "Expansion"}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back link */}
          {parentGame ? (
            <Link
              href={`/games/${parentGame.bggId || parentGame.id}`}
              className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {parentGame.name}
            </Link>
          ) : expansionData?.baseGame ? (
            <Link
              href={`/games/${
                typeof expansionData.baseGame === "object" &&
                expansionData.baseGame.bggId
                  ? expansionData.baseGame.bggId
                  : typeof expansionData.baseGame === "object" &&
                      expansionData.baseGame.id
                    ? expansionData.baseGame.id
                    : typeof expansionData.baseGame === "number" ||
                        typeof expansionData.baseGame === "string"
                      ? expansionData.baseGame
                      : ""
              }`}
              className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to{" "}
              {typeof expansionData.baseGame === "object" &&
              expansionData.baseGame.name
                ? expansionData.baseGame.name
                : `Base Game #${
                    typeof expansionData.baseGame === "number" ||
                    typeof expansionData.baseGame === "string"
                      ? expansionData.baseGame
                      : "?"
                  }`}
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          )}

          <Suspense fallback={<GameSkeleton />}>
            {expansionData && <GameContent game={expansionData} />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
