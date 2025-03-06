import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Publishers: CollectionConfig = {
  slug: "publishers",
  labels: {
    singular: "Publisher",
    plural: "Publishers",
  },
  admin: {
    useAsTitle: "name",
    group: "Collections",
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
      type: "number",
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "images",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "games",
      type: "join",
      collection: "games",
      on: "publishers",
    },
    {
      name: "accessories",
      type: "join",
      collection: "accessories",
      on: "publishers",
    },
    {
      name: "processing",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Indicates whether the publisher is still being processed. Set to false when the publisher and all related content are complete.",
      },
    },
  ],
};
