import type { CollectionConfig } from "payload";

export const GameNights: CollectionConfig = {
  slug: "gamenights",
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
      type: "richText",
    },
    {
      name: "date",
      type: "date",
    },
    {
      name: "location",
      type: "point",
    },
    {
      name: "players",
      type: "array",
      fields: [
        {
          name: "player",
          type: "relationship",
          relationTo: "users",
        }
      ]
    },
    {
      name: "games",
      type: "array",
      fields: [
        {
          name: "game",
          type: "relationship",
          relationTo: "games",
        }
      ]
    },
    {
      name: "recurring",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
