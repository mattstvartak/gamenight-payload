"use client";

import Image from "next/image";
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
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
import { RichText } from "@payloadcms/richtext-lexical/react";

import {
  Game as GameType,
  Media,
  Designer,
  Publisher,
  Category,
  Mechanic,
} from "@/payload-types";

export const GameContent = ({ game }: { game: GameType }) => {
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

  return (
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
              <span className="text-sm">{game.yearPublished || "Unknown"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium">Rating</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating =
                    typeof game.userRating === "number" &&
                    !isNaN(game.userRating)
                      ? game.userRating
                      : 0;
                  return (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(rating / 2)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-lg font-bold">
                {typeof game.userRating === "number" && !isNaN(game.userRating)
                  ? game.userRating.toFixed(1)
                  : "0.0"}
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
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{game.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <span>{designerName}</span>
                <span>•</span>
                <span>{game.yearPublished || "Unknown Year"}</span>
              </div>
            </div>
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
          </div>

          <div className="relative prose prose-sm max-w-none dark:prose-invert">
            <div className="rich-text-content">
              {(() => {
                // Simplified approach - handle string descriptions directly
                if (typeof game.description === "string") {
                  // If it's a string, display it as a paragraph
                  const descriptionStr = game.description as string;
                  return (
                    <div>
                      {descriptionStr
                        .split("\n")
                        .map((paragraph: string, idx: number) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                    </div>
                  );
                }
                // Only use RichText for objects confirmed to be in the right format
                else if (
                  typeof game.description === "object" &&
                  game.description !== null
                ) {
                  try {
                    return <RichText data={game.description} />;
                  } catch (error) {
                    console.error("Error rendering RichText:", error);
                    // If the RichText component fails, convert to string if possible
                    const fallbackText = JSON.stringify(game.description);
                    return <p>{fallbackText.slice(0, 500)}...</p>;
                  }
                } else {
                  return <p>No description available.</p>;
                }
              })()}
            </div>
          </div>

          <Separator className="my-6" />
        </div>

        <div className="mt-8">
          <Tabs defaultValue="mechanics">
            <TabsList className="bg-background/50 border w-full flex overflow-hidden">
              <TabsTrigger
                value="mechanics"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Mechanics
              </TabsTrigger>
              <TabsTrigger
                value="expansions"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Expansions
              </TabsTrigger>
              <TabsTrigger
                value="accessories"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Accessories
              </TabsTrigger>
              <TabsTrigger
                value="artists"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Artists
              </TabsTrigger>
              <TabsTrigger
                value="publishers"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Publishers
              </TabsTrigger>
              <TabsTrigger
                value="designers"
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Designers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mechanics" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[100px]">
                {mechanicNames && mechanicNames.length > 0 ? (
                  mechanicNames.map((mechanic, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 rounded-md border bg-background/50"
                    >
                      <span>{mechanic}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center p-4 text-muted-foreground">
                    No mechanics listed for this game.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="expansions" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {game.expansions && game.expansions.length > 0 ? (
                  game.expansions.map((expansion, index) => {
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
                  })
                ) : (
                  <div className="col-span-2 text-center p-4 text-muted-foreground">
                    No expansions available for this game.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="accessories" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[100px]">
                {game.accessories && game.accessories.length > 0 ? (
                  game.accessories.map((accessory, index) => {
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
                  })
                ) : (
                  <div className="col-span-2 text-center p-4 text-muted-foreground">
                    No accessories available for this game.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="artists" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[100px]">
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

            <TabsContent value="publishers" className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[100px]">
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

            <TabsContent value="designers" className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[100px]">
                {game.designers && game.designers.length > 0 ? (
                  game.designers.map((designer, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 rounded-md border bg-background/50"
                    >
                      <span>
                        {typeof designer === "number"
                          ? "Unknown Designer"
                          : (designer as Designer).name || "Unknown Designer"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center p-4 text-muted-foreground">
                    No designers listed for this game.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-6" />
      </div>
    </div>
  );
};
