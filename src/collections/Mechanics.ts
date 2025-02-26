import type { CollectionConfig } from "payload";

export const Mechanics: CollectionConfig = {
  slug: "mechanics",
  auth: false,
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
