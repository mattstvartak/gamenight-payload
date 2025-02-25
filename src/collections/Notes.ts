import type { CollectionConfig } from "payload";

export const Notes: CollectionConfig = {
  slug: "notes",
  auth: false,
  admin: {
    useAsTitle: "name",
  },
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
