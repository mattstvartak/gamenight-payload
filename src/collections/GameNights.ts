import type { CollectionConfig } from "payload";

export const GameNights: CollectionConfig = {
  slug: "gamenights",
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
      name: "notes",
      type: "relationship",
      relationTo: "notes",
      hasMany: true,
    },
    {
      name: "users",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
    },
    {
      name: "games",
      type: "relationship",
      relationTo: "games",
      hasMany: true,
    },
    {
      name: "library",
      type: "relationship",
      relationTo: "libraries",
      hasMany: true,
    },
    {
      name: "recurring",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
