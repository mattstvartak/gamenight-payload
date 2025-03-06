import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { admins } from "./access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { anyone } from "./access/anyone";

export const Categories: CollectionConfig = {
  slug: "categories",
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
      name: "games",
      type: "join",
      collection: "games",
      on: "categories",
    },
  ],
};
