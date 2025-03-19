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
  auth: {
    verify: {
      generateEmailHTML: ({ token, user }) => {
        // Create verification URL using your frontend URL
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`;

        return `
          <h1>Verify Your Email</h1>
          <p>Hello ${user.username || user.email},</p>
          <p>Please click the link below to verify your email address:</p>
          <p>
            <a href="${url}" style="
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
            ">
              Verify Email
            </a>
          </p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `;
      },
      generateEmailSubject: ({ user }) => {
        return `Verify your email for GameNight`;
      },
    },
    maxLoginAttempts: 5,
    lockTime: 600000, // Lock for 10 minutes
    useAPIKey: false,
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      domain: process.env.COOKIE_DOMAIN,
    },
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
      unique: true,
    },
    {
      name: "phone",
      type: "number",
    },
    {
      name: "libraries",
      type: "relationship",
      relationTo: "libraries",
      hasMany: true,
    },
    {
      name: "gameNights",
      type: "relationship",
      relationTo: "gamenights",
      hasMany: true,
    },
    {
      name: "friends",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
    },
    {
      name: "notes",
      type: "relationship",
      relationTo: "notes",
      hasMany: true,
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "usermedia",
      unique: true,
    },
    {
      name: "likes",
      type: "relationship",
      relationTo: [
        "games",
        "accessories",
        "artists",
        "categories",
        "designers",
        "publishers",
      ],
      hasMany: true,
    },
  ],
};
