import { NextResponse } from "next/server";
import { getPayload } from "payload";
import type { Media } from "@/payload-types";
import config from "@/payload.config";

interface BGGGameDetails {
  name: string;
  description?: string;
  yearPublished?: string;
  image?: string;
  images?: string[];
  minPlayers?: number;
  maxPlayers?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  weight?: number;
  categories: string[];
  mechanics: string[];
}

// Helper function to extract filename from URL
function getFilenameFromUrl(url: string): string {
  try {
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split("/").pop();
    console.log("filename", filename);
    return filename || "image.jpg";
  } catch (e) {
    // If URL parsing fails, extract filename from the last part of the URL
    const parts = url.split("/");
    return parts[parts.length - 1] || "image.jpg";
  }
}

// Helper function to create storage path
function createStoragePath(gameName: string, filename: string): string {
  const gamePath = gameName.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
  return `games/${gamePath}/images/${filename}`;
}

// Helper function to fetch image and convert to File object
async function fetchImageAsFile(
  url: string,
  filename: string
): Promise<{
  data: Buffer;
  mimetype: string;
  name: string;
  size: number;
}> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimetype = response.headers.get("content-type") || "image/jpeg";
  const size = buffer.length;

  return {
    data: buffer,
    mimetype,
    name: filename,
    size,
  };
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({
      config,
    });

    if (!payload) {
      return NextResponse.json(
        { error: "Failed to initialize payload" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { bggId, gameDetails } = body as {
      bggId: string;
      gameDetails: BGGGameDetails;
    };

    if (!bggId || !gameDetails) {
      return NextResponse.json(
        { error: "BGG ID and game details are required" },
        { status: 400 }
      );
    }

    // Check if game already exists in Payload
    const existingGame = await payload.find({
      collection: "games",
      where: {
        bggId: {
          equals: bggId,
        },
      },
    });

    if (existingGame.docs.length > 0) {
      return NextResponse.json(existingGame.docs[0]);
    }

    // Create media entries for all game images
    const imageIds = [];

    // Handle main image
    if (gameDetails.image) {
      console.log("gameDetails.image", gameDetails.image);
      const filename = getFilenameFromUrl(gameDetails.image);
      const storagePath = createStoragePath(gameDetails.name, filename);

      // Fetch and convert image to File object
      const file = await fetchImageAsFile(gameDetails.image, filename);

      const mainMedia = await payload.create({
        collection: "media",
        data: {
          alt: `${gameDetails.name} main image`,
          prefix: storagePath.replace(filename, ""), // Store the path prefix separately
          gameId: bggId,
          gameName: gameDetails.name
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase(),
        },
        file,
      });
      imageIds.push({ image: mainMedia.id });
    }

    // Handle additional images
    if (gameDetails.images?.length) {
      const additionalImagePromises = gameDetails.images.map(
        async (imageUrl) => {
          const filename = getFilenameFromUrl(imageUrl);
          const storagePath = createStoragePath(gameDetails.name, filename);

          // Fetch and convert image to File object
          const file = await fetchImageAsFile(imageUrl, filename);

          const media = await payload.create({
            collection: "media",
            data: {
              alt: `${gameDetails.name} additional image`,
              prefix: storagePath.replace(filename, ""), // Store the path prefix separately
              gameId: bggId,
              gameName: gameDetails.name
                .replace(/[^a-zA-Z0-9-_]/g, "-")
                .toLowerCase(),
            },
            file,
          });
          return { image: media.id };
        }
      );

      const additionalImageIds = await Promise.all(additionalImagePromises);
      imageIds.push(...additionalImageIds);
    }

    // Create or get category documents
    const categoryIds = await Promise.all(
      gameDetails.categories.map(async (categoryName: string) => {
        try {
          const existingCategory = await payload.find({
            collection: "categories",
            where: {
              name: {
                equals: categoryName,
              },
            },
          });

          if (existingCategory.docs.length > 0) {
            return existingCategory.docs[0].id;
          }

          const newCategory = await payload.create({
            collection: "categories",
            data: { name: categoryName },
          });
          return newCategory.id;
        } catch (error) {
          console.error(
            `Error creating/finding category ${categoryName}:`,
            error
          );
          return null;
        }
      })
    );

    // Create or get mechanic documents
    const mechanicIds = await Promise.all(
      gameDetails.mechanics.map(async (mechanicName: string) => {
        try {
          const existingMechanic = await payload.find({
            collection: "mechanics",
            where: {
              name: {
                equals: mechanicName,
              },
            },
          });

          if (existingMechanic.docs.length > 0) {
            return existingMechanic.docs[0].id;
          }

          const newMechanic = await payload.create({
            collection: "mechanics",
            data: { name: mechanicName },
          });
          return newMechanic.id;
        } catch (error) {
          console.error(
            `Error creating/finding mechanic ${mechanicName}:`,
            error
          );
          return null;
        }
      })
    );

    // Create the game using Payload
    const game = await payload.create({
      collection: "games",
      data: {
        bggId,
        name: gameDetails.name,
        description: gameDetails.description,
        type: "boardgame",
        yearPublished: gameDetails.yearPublished
          ? Number(gameDetails.yearPublished)
          : undefined,
        minPlayers: gameDetails.minPlayers,
        maxPlayers: gameDetails.maxPlayers,
        minPlaytime: gameDetails.minPlaytime,
        maxPlaytime: gameDetails.maxPlaytime,
        minAge: gameDetails.minAge,
        complexity: gameDetails.weight,
        categories: categoryIds
          .filter((id): id is number => id !== null)
          .map((id) => ({ category: id })),
        mechanics: mechanicIds
          .filter((id): id is number => id !== null)
          .map((id) => ({ mechanic: id })),
        images: imageIds,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
