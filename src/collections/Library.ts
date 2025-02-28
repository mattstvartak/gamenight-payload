import type { CollectionConfig } from "payload";
import { adminsAndUser } from "./access/adminsAndUser";
import { admins } from "./access/admins";
import { anyone } from "./access/anyone";
import { checkRole } from "./access/checkRole";

export const Library: CollectionConfig = {
  slug: "library",
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === "create") {
          if (req.user) {
            data.createdBy = req.user.id;
            return data;
          }
        }
      },
    ],
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
      name: "name",
      type: "text",
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
    },
    {
      name: "games",
      type: "array",
      fields: [
        {
          name: "game",
          type: "relationship",
          relationTo: "games",
          hasMany: true,
        },
      ],
    },
  ],
};
