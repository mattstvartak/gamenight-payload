import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { admins } from "./access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { anyone } from "./access/anyone";

export const GameNights: CollectionConfig = {
  slug: "gamenights",
  admin: {
    useAsTitle: "name",
    group: "User Collentions",
  },
  labels: {
    singular: "Game Night",
    plural: "Game Nights",
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
      name: "players",
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
      name: "recurring",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
