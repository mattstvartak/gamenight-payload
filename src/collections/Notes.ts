import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Notes: CollectionConfig = {
  slug: "notes",
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create') {
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
      return checkRole(['admin'], user);
    },
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
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
    },
  ],
};
