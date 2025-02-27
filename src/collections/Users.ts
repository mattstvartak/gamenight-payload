import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { protectRoles } from "./hooks/protectRoles";
import { loginAfterCreate } from "./hooks/loginAfterCreate";
import { adminsAndUser } from "./access/adminsAndUser";
import { admins } from "./access/admins";
import { anyone } from "./access/anyone";
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
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
  hooks: {
    afterChange: [loginAfterCreate],
  },
  defaultSort: "username",
  fields: [
    {
      name: "roles",
      type: "select",
      hasMany: true,
      saveToJWT: true,
      defaultValue: ["user"],
      hooks: {
        beforeChange: [protectRoles],
      },
      options: [
        {
          label: "Admin",
          value: "admin",
        },
        {
          label: "User",
          value: "user",
        },
      ],
    },
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "firstName",
      type: "text",
    },
    {
      name: "lastName",
      type: "text",
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "number",
    },
    {
      name: "libraries",
      type: "array",
      fields: [
        {
          name: "library",
          type: "relationship",
          relationTo: "libraries",
        },
      ],
    },
    {
      name: "gameNights",
      type: "array",
      fields: [
        {
          name: "game night",
          type: "relationship",
          relationTo: "gamenights",
        },
      ],
    },
    {
      name: "friends",
      type: "array",
      fields: [
        {
          name: "friend",
          type: "relationship",
          relationTo: "users",
          hasMany: true,
        },
      ],
    },
    {
      name: "notebooks",
      type: "array",
      fields: [
        {
          name: "notes",
          type: "relationship",
          relationTo: "notes",
          hasMany: true,
        },
      ],
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      unique: true,
    },
  ],
};
