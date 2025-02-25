import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  fields: [
    {
      name: "libraries",
      type: "relationship",
      relationTo: "libraries",
      hasMany: true,
    },
    {
      name: "gamenights",
      type: "relationship",
      relationTo: "gamenights",
      hasMany: true,
    },
    {
      name: "friends",
      type: "relationship",
      relationTo: "friends",
      hasMany: false,
    },
    {
      name: "notes",
      type: "relationship",
      relationTo: "notes",
      hasMany: true,
    },
  ],
};
