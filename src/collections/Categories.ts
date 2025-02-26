import type { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories",
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
