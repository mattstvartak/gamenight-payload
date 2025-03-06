import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Types: CollectionConfig = {
  slug: "types",
  labels: {
    singular: "Type",
    plural: "Types",
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
      name: "name",
      type: "text",
    },
    {
      name: "games",
      type: "join",
      collection: "games",
      on: "type",
    },
    {
      name: "processing",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Indicates whether the type is still being processed. Set to false when the type and all related content are complete.",
      },
    },
  ],
};
