import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Share,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GameReview } from "@/components/game-review";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Header } from "@/components/header";
import {
  Game as GameType,
  Media,
  Designer,
  Publisher,
  Category,
  Mechanic,
} from "@/payload-types";

// Define the review interface since it's not directly available in payload-types
interface Review {
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
}

// Fetch game details from the API
async function getGameDetails(
  id: string
): Promise<{ game: GameType | null; error: Error | null }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/games/get?id=${id}`,
      {
        cache: "no-store",
      }
    );

    console.log(response);

    if (!response.ok) {
      throw new Error("Failed to fetch game data");
    }

    const data = await response.json();
    return { game: data.game, error: null };
  } catch (error) {
    console.error("Error fetching game details:", error);
    return {
      game: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export const GameDetailsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { game, error } = await getGameDetails(id);

  // Add error handling for when a game isn't found
  if (!game || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <Link href="/" className="mt-4 text-blue-500 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Extract the first image URL or use a placeholder
  const imageUrl =
    game.images && game.images.length > 0
      ? typeof game.images[0] === "number"
        ? "/placeholder.svg"
        : (game.images[0] as Media).url || "/placeholder.svg"
      : "/placeholder.svg";

  // Get the first designer name or use a placeholder
  const designerName =
    game.designers && game.designers.length > 0
      ? typeof game.designers[0] === "number"
        ? "Unknown Designer"
        : (game.designers[0] as Designer).name || "Unknown Designer"
      : "Unknown Designer";

  // Format player count
  const playerCount =
    game.minPlayers && game.maxPlayers
      ? `${game.minPlayers}-${game.maxPlayers}`
      : "Unknown";

  // Format play time
  const playTime =
    game.minPlaytime && game.maxPlaytime
      ? `${game.minPlaytime}-${game.maxPlaytime} min`
      : game.playingTime
        ? `${game.playingTime} min`
        : "Unknown";

  // Get complexity label based on complexity value
  const complexityLabel = game.complexity
    ? game.complexity < 2
      ? "Low"
      : game.complexity < 3.5
        ? "Medium"
        : "High"
    : "Unknown";

  // Mock reviews since they're not in the Game type
  const reviews: Review[] = [
    {
      author: "Michael Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
      date: "January 15, 2025",
      content:
        "An incredible gaming experience that keeps on giving. The campaign is massive and every scenario feels unique and challenging.",
    },
    {
      author: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 4,
      date: "February 3, 2025",
      content:
        "Fantastic game with deep strategy. Setup time is a bit long, but the gameplay more than makes up for it.",
    },
  ];

  // Extract category names
  const categoryNames = game.categories
    ? game.categories.map((cat: number | Category) =>
        typeof cat === "number"
          ? "Unknown Category"
          : cat.name || "Unknown Category"
      )
    : [];

  // Extract mechanic names
  const mechanicNames = game.mechanics
    ? game.mechanics.map((mech: number | Mechanic) =>
        typeof mech === "number"
          ? "Unknown Mechanic"
          : mech.name || "Unknown Mechanic"
      )
    : [];

  console.log(game);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <Header />

      <main className="flex-1 container py-6 mx-auto max-w-screen-xl">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            <div className="space-y-4">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border">
                <Image
                  src={imageUrl}
                  alt={game.name || "Game image"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  Add to Collection
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share className="h-4 w-4" />
                </Button>
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Players</span>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">{playerCount}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Play Time</span>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">{playTime}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Complexity</span>
                    <Badge
                      variant={
                        complexityLabel === "Low"
                          ? "outline"
                          : complexityLabel === "Medium"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {complexityLabel}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Age</span>
                    <span className="text-sm">
                      {game.minAge ? `${game.minAge}+` : "Unknown"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Year</span>
                    <span className="text-sm">
                      {game.yearPublished || "Unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium">Rating</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round((game.userRating || 0) / 2)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold">
                      {game.userRating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 10</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gameplay</span>
                      <span>4.5/5</span>
                    </div>
                    <Progress value={90} className="h-2" />

                    <div className="flex justify-between text-sm">
                      <span>Components</span>
                      <span>4.8/5</span>
                    </div>
                    <Progress value={96} className="h-2" />

                    <div className="flex justify-between text-sm">
                      <span>Replayability</span>
                      <span>4.3/5</span>
                    </div>
                    <Progress value={86} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {game.name || "Unknown Game"}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-background/80">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {designerName}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80">
                    <Calendar className="h-3 w-3 mr-1" />
                    {game.yearPublished || "Unknown"}
                  </Badge>
                  {categoryNames.slice(0, 3).map((category, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-background/80"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="text-muted-foreground leading-relaxed mb-6">
                  {game.description ? (
                    typeof game.description === "string" ? (
                      game.description
                    ) : (
                      <RichText data={game.description} />
                    )
                  ) : (
                    "Game description unavailable"
                  )}
                </div>

                <Separator className="my-6" />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Game Details</h2>

                <Tabs defaultValue="mechanics" className="space-y-4">
                  <TabsList className="bg-background/50 border">
                    <TabsTrigger
                      value="mechanics"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Mechanics
                    </TabsTrigger>
                    <TabsTrigger
                      value="expansions"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Expansions
                    </TabsTrigger>
                    <TabsTrigger
                      value="accessories"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Accessories
                    </TabsTrigger>
                    <TabsTrigger
                      value="artists"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Artists
                    </TabsTrigger>
                    <TabsTrigger
                      value="publishers"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                    >
                      Publishers
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mechanics" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mechanicNames.map((mechanic: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center p-3 rounded-md border bg-background/50"
                        >
                          <span>{mechanic}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="expansions" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {game.expansions?.map((expansion, index) => {
                        // Assert that expansion is always a GameType
                        const exp = expansion as GameType;
                        return (
                          <Card
                            key={index}
                            className="bg-background/50 border-muted"
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={
                                    exp.images?.[0] &&
                                    typeof exp.images[0] !== "number"
                                      ? `${(exp.images[0] as Media).sizes?.thumbnail?.url || "/placeholder.svg"}?height=64&width=64`
                                      : "/placeholder.svg?height=64&width=64"
                                  }
                                  alt={exp.name || "Unknown Expansion"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {exp.name || "Unknown Expansion"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Expansion
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="accessories" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {game.accessories?.map((accessory, index) => {
                        // Assert that accessory is always a GameType
                        const acc = accessory as GameType;
                        return (
                          <Card
                            key={index}
                            className="bg-background/50 border-muted"
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="h-16 w-16 relative rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={
                                    acc.images?.[0] &&
                                    typeof acc.images[0] !== "number"
                                      ? `${(acc.images[0] as Media).sizes?.thumbnail?.url || "/placeholder.svg"}?height=64&width=64`
                                      : "/placeholder.svg?height=64&width=64"
                                  }
                                  alt={acc.name || "Unknown Accessory"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {acc.name || "Unknown Accessory"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Accessory
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {(!game.accessories || game.accessories.length === 0) && (
                        <div className="col-span-2 text-center p-4 text-muted-foreground">
                          No accessories available for this game.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="artists" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {game.artists && game.artists.length > 0 ? (
                        game.artists.map((artist, index) => (
                          <div
                            key={index}
                            className="flex items-center p-3 rounded-md border bg-background/50"
                          >
                            <span>
                              {typeof artist === "number"
                                ? "Unknown Artist"
                                : artist.name || "Unknown Artist"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center p-4 text-muted-foreground">
                          No artists listed for this game.
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="publishers" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {game.publishers && game.publishers.length > 0 ? (
                        game.publishers.map((publisher, index) => (
                          <div
                            key={index}
                            className="flex items-center p-3 rounded-md border bg-background/50"
                          >
                            <span>
                              {typeof publisher === "number"
                                ? "Unknown Publisher"
                                : (publisher as Publisher).name ||
                                  "Unknown Publisher"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center p-4 text-muted-foreground">
                          No publishers listed for this game.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Separator className="my-6" />

              {/* Reviews section - commented out as requested
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Write a Review
                  </Button>
                </div>

                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <GameReview
                      key={index}
                      author={review.author}
                      avatar={review.avatar}
                      rating={review.rating}
                      date={review.date}
                      content={review.content}
                    />
                  ))}
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameDetailsPage;
