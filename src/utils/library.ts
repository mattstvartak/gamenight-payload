import { getPayload } from "payload";
import config from "@payload-config";

export const removeGameFromLibrary = async (
  gameId: string,
  libraryId: string
) => {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "library",
    id: libraryId,
    depth: 2,
    data: {
      games: (
        await payload.findByID({
          collection: "library",
          id: libraryId,
          depth: 2,
        })
      ).games?.filter((game) => {
        if (typeof game.game === "object" && game.game !== null) {
          return game.game.id.toString() !== gameId;
        }
        return false;
      }),
    },
  });
};
