import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
    group: "Content",
  },
  access: {
    // Only admins can access admin panel and manage media
    admin: ({ req: { user } }) => {
      return user?.role === "admin";
    },
    create: ({ req: { user } }) => {
      return user?.role === "admin";
    },
    delete: ({ req: { user } }) => {
      return user?.role === "admin";
    },
  },
  upload: {
    staticURL: "/media",
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
