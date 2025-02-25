import type { CollectionConfig } from "payload";

export const Games: CollectionConfig = {
  slug: "games",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "affiliate link",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      options: ["boardgame", "videogame", "cardgame", "tabletop","other"],
    },
    {
      name: "minPlayers",
      type: "number",
    },
    {
      name: "maxPlayers",
      type: "number",
    },
    {
      name: "minPlaytime",
      type: "number",
    },
    {
      name: "maxPlaytime",
      type: "number",
    },
    {
      name: "minAge",
      type: "number",
    },
    {
      name: "complexity",
      type: "number",
    }, 
    {
      name: "official link",
      type: "text",
    }
  ],
};
