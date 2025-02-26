import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { admins } from "./access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { anyone } from "./access/anyone";

export const Mechanics: CollectionConfig = {
  slug: "mechanics",
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
      return checkRole(['admin'], user);
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
