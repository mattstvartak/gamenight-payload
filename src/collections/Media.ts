import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { admins } from "./access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { anyone } from "./access/anyone";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
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
  upload: {
    staticDir: "media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "filename",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "mimeType",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "filesize",
      type: "number",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "gameId",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "gameName",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
};
