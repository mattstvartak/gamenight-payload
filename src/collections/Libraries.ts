import type { CollectionConfig } from "payload";

export const Libraries: CollectionConfig = {
  slug: "libraries",
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
  ],
};
