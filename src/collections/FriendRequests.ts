import type { CollectionConfig } from "payload";

export const FriendRequests: CollectionConfig = {
  slug: "friend-requests",
  auth: false,
  admin: {
    useAsTitle: "requester",
  },
  fields: [
    {
      name: "requester",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "requestee",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "status",
      type: "select",
      options: ["pending", "accepted", "rejected"],
    },
  ],
};
