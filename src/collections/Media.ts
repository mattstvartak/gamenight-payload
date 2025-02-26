import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
    formatOptions: {
      format: "webp",
      options: {
        quality: 85,
      },
    },
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
      },
      {
        name: "card",
        width: 768,
        height: 1024,
      },
    ],
    adminThumbnail: "thumbnail",
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
      name: "width",
      type: "number",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "height",
      type: "number",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "sizes",
      type: "json",
      admin: {
        readOnly: true,
      },
    },
  ],
};
