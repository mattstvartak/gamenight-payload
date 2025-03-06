import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Designers: CollectionConfig = {
  slug: "designers",
  labels: {
    singular: "Designer",
    plural: "Designers",
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
      name: "games",
      type: "join",
      collection: "games",
      on: "designers",
    },
    {
      name: "processing",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Indicates whether the designer is still being processed. Set to false when the designer and all related content are complete.",
      },
    },
  ],
};
