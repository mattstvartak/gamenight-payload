import type { CollectionConfig } from "payload";
import { checkRole } from "./access/checkRole";
import { admins } from "./access/admins";
import { adminsAndUser } from "./access/adminsAndUser";
import { anyone } from "./access/anyone";

export const FriendRequests: CollectionConfig = {
  slug: "friend-requests",
  admin: {
    useAsTitle: "requester",
    group: "Content",
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create') {
          if (req.user) {
            data.createdBy = req.user.id;
            return data;
          }
        }
      },
    ],
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
      name: "requester",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "requestee",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "status",
      type: "select",
      options: ["pending", "accepted", "rejected"],
      required: true,
      defaultValue: "pending",
    },
  ],
};
