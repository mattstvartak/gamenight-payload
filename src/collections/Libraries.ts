import type { CollectionConfig } from "payload";
import { adminsAndUser } from "./access/adminsAndUser";
import { admins } from "./access/admins";
import { anyone } from "./access/anyone";
import { checkRole } from "./access/checkRole";

export const Libraries: CollectionConfig = {
  slug: "libraries",
  labels: {
    singular: "Library",
    plural: "Libraries",
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
      type: "relationship",
      relationTo: "games",
      hasMany: true,
    },
  ],
};
