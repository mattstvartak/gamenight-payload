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
      name: "firstName",
      type: "text",
    },
    {
      name: "lastName",
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
      type: "array",
      fields: [
        {
          name: "library",
          type: "relationship",
          relationTo: "libraries",
        }
      ]
    },
    {
      name: "gameNights",
      type: "array",
      fields: [
        {
          name: "game night",
          type: "relationship",
          relationTo: "gamenights",
        }
      ]
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
    {
      name: "role",
      type: "select",
      options: ["admin", "user"],
      defaultValue: "user",
    },
  ],
};
