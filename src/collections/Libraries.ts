import type { CollectionConfig } from "payload";

export const Libraries: CollectionConfig = {
  slug: "libraries",
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
      name: "games",
      type: "array",
      fields: [
        {
          name: "game",
          type: "relationship",
          relationTo: "games",
        }
      ]
    }
  ],
};
