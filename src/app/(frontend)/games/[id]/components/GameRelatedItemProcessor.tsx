"use client";

import { useEffect, useState } from "react";
import { Game, Accessory } from "@/payload-types";

interface GameRelatedItemProcessorProps {
  game: Game;
}

/**
 * This component scans a game's related items for any that are not processed
 * and queues them for background processing.
 */
export function GameRelatedItemProcessor({
  game,
}: GameRelatedItemProcessorProps) {
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Skip if we've already run the processing check
    if (processed) return;

    // Skip if the game itself is marked as processed
    if (game.processed === true) {
      setProcessed(true);
      return;
    }

    // Function to check if an item is not processed
    const isNotProcessed = (item: any): boolean => {
      if (!item) return false;

      // Check if the item is just an ID reference
      if (typeof item === "number") return true;

      // Check if the item has a processed flag set to false
      if (typeof item.processed !== "undefined")
        return item.processed === false;

      // For accessories with processing flag
      if (typeof item.processing !== "undefined")
        return item.processing === true;

      // Default to treating complex items with no processed flag as needing processing
      return true;
    };

    // Collect all related items that need processing
    const itemsToProcess: {
      id: number | string;
      collection: string;
      parentGameId?: number | string;
    }[] = [];

    // Check expansions
    if (game.expansions && game.expansions.length > 0) {
      game.expansions.forEach((expansion) => {
        if (typeof expansion === "number") {
          // It's just an ID reference
          itemsToProcess.push({
            id: expansion,
            collection: "games",
            parentGameId: game.id,
          });
        } else if (isNotProcessed(expansion)) {
          // It's an object reference that needs processing
          itemsToProcess.push({
            id: expansion.id,
            collection: "games",
            parentGameId: game.id,
          });
        }
      });
    }

    // Check accessories
    if (game.accessories && game.accessories.length > 0) {
      game.accessories.forEach((accessory) => {
        if (typeof accessory === "number") {
          // It's just an ID reference
          itemsToProcess.push({
            id: accessory,
            collection: "accessories",
            parentGameId: game.id,
          });
        } else if (isNotProcessed(accessory)) {
          // It's an object reference that needs processing
          itemsToProcess.push({
            id: accessory.id,
            collection: "accessories",
            parentGameId: game.id,
          });
        }
      });
    }

    // Check implementations (versions)
    if (game.implementations && game.implementations.length > 0) {
      game.implementations.forEach((implementation) => {
        if (typeof implementation === "number") {
          // It's just an ID reference
          itemsToProcess.push({
            id: implementation,
            collection: "games",
            parentGameId: game.id,
          });
        } else if (isNotProcessed(implementation)) {
          // It's an object reference that needs processing
          itemsToProcess.push({
            id: implementation.id,
            collection: "games",
            parentGameId: game.id,
          });
        }
      });
    }

    // If we found items to process, queue them
    if (itemsToProcess.length > 0) {
      console.log(
        `Found ${itemsToProcess.length} unprocessed related items for game ${game.id}`
      );

      // Queue them for processing
      fetch("/api/games/queue-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: itemsToProcess }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error(
              "Failed to queue items for processing:",
              response.statusText
            );
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((result) => {
          console.log("Successfully queued items for processing:", result);
          setProcessed(true);
        })
        .catch((error) => {
          console.error("Error queueing items for processing:", error);
          // We still mark as processed to avoid endless retries
          setProcessed(true);
        });
    } else {
      console.log("No unprocessed related items found");
      setProcessed(true);
    }
  }, [game, processed]);

  // This component doesn't render anything
  return null;
}
