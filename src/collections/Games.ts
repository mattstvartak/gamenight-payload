import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Games: CollectionConfig = {
  slug: "games",
  labels: {
    singular: "Game",
    plural: "Games",
  },
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  access: {
    read: adminsAndUser,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => {
      if (!user) return false;
      return checkRole(["admin"], user);
    },
  },
  fields: [
    {
      name: "bggId",
      type: "number" ,
      unique: true,
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "images",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          // hasMany: true,
        },
      ],
    },
    {
      name: "affiliate link",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      options: ["boardgame", "videogame", "cardgame", "tabletop", "other"],
    },
    {
      name: "yearPublished",
      type: "number",
    },
    {
      name: "minPlayers",
      type: "number",
    },
    {
      name: "maxPlayers",
      type: "number",
    },
    {
      name: "minPlaytime",
      type: "number",
    },
    {
      name: "maxPlaytime",
      type: "number",
    },
    {
      name: "minAge",
      type: "number",
    },
    {
      name: "complexity",
      type: "number",
    },
    {
      name: "official link",
      type: "text",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    {
      name: "mechanics",
      type: "relationship",
      relationTo: "mechanics",
      hasMany: true,
    },
  ],
};
