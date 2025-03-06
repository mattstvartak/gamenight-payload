import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Accessories: CollectionConfig = {
  slug: "accessories",
  labels: {
    singular: "Accessory",
    plural: "Accessories",
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
      unique: true,
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
      name: "affiliate link",
      type: "text",
    },
    {
      name: "yearPublished",
      type: "number",
    },
    {
      name: "publishers",
      type: "relationship",
      relationTo: "publishers",
      hasMany: true,
    },
    {
      name: "games",
      label: "Related Games",
      type: "join",
      collection: "games",
      on: "accessories",
    },
    {
      name: "alternateNames",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
        },
      ],
    },
    {
      name: "processing",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Indicates whether the accessory is still being processed. Set to false when the accessory and all related content are complete.",
      },
    },
  ],
};
