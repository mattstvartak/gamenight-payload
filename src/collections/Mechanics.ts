import type { CollectionConfig } from "payload";

export const Mechanics: CollectionConfig = {
  slug: "mechanics",
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
  access: {
    // Only admins can access admin panel and manage mechanics
    admin: ({ req: { user } }) => {
      return user?.role === "admin";
    },
    create: ({ req: { user } }) => {
      return user?.role === "admin";
    },
    delete: ({ req: { user } }) => {
      return user?.role === "admin";
    },
    update: ({ req: { user } }) => {
      return user?.role === "admin";
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
