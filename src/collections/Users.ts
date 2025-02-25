import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  defaultSort: "username",
  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "first Name",
      type: "text",
    },
    {
      name: "last Name",
      type: "text",
    },
    {
      name: "email",
        type: "email",
    required: true,
    },
    {
      name: "phone",
      type: "number",
    },
    {
      name: "libraries",
      type: "relationship",
      relationTo: "libraries",
      hasMany: true,
    },
    {
      name: "game nights",
      type: "relationship",
      relationTo: "gamenights",
      hasMany: true,
    },
    {
      name: "friends",
      type: "array",
      fields: [
        {
          name: "friend",
          type: "relationship",
          relationTo: "users",
          hasMany: true,
        }
      ]
    },
    {
      name: "notebooks",
      type: "array",
      fields: [
        {
          name: "notes",
          type: "relationship",
          relationTo: "notes",
          hasMany: true,
        }
      ]
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      unique: true,
    },
  ],
};
