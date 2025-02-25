import type { CollectionConfig } from "payload";

export const Notes: CollectionConfig = {
  slug: "notes",
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
      name: "notes",
      type: "richText",
    }, 
  ],
};
