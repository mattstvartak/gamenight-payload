import type { CollectionConfig } from "payload";

export const Friends: CollectionConfig = {
  slug: "friends",
  admin: {
    useAsTitle: "friends",
  },
  auth: true,
  fields: [
    {
      name: "friends",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
    },
  ],
};
