import type { CollectionConfig } from "payload";

export const Games: CollectionConfig = {
  slug: "games",
  admin: {
    useAsTitle: "name",
  },
  auth: true,
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
  ],
};
