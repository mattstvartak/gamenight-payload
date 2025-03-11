// storage-adapter-import-placeholder
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Accessories } from "./collections/Accessories";
import { Artists } from "./collections/Artists";
import { Categories } from "./collections/Categories";
import { Designers } from "./collections/Designers";
import { GameNights } from "./collections/GameNights";
import { Games } from "./collections/Games";
import { Libraries } from "./collections/Libraries";
import { Mechanics } from "./collections/Mechanics";
import { Media } from "./collections/Media";
import { Notes } from "./collections/Notes";
import { Publishers } from "./collections/Publishers";
import { Types } from "./collections/Types";
import { UserMedia } from "./collections/UserMedia";
import { Users } from "./collections/Users";
import { Expansions } from "./collections/Expansions";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    suppressHydrationWarning: true,
    meta: {
      titleSuffix: "- GameNight",
    },
  },
  email: nodemailerAdapter({
    defaultFromAddress: "noreply@game-night.io",
    defaultFromName: "GameNight",
    // Nodemailer transportOptions
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  collections: [
    Accessories,
    Artists,
    Categories,
    Designers,
    Expansions,
    GameNights,
    Games,
    Libraries,
    Mechanics,
    Media,
    Notes,
    Publishers,
    Types,
    UserMedia,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    vercelBlobStorage({
      enabled: true,
      access: "public",
      collections: {
        media: {
          prefix: "games",
          generateFileURL: (args) => {
            const { filename } = args;
            // Support nested folder structure by preserving paths in filename
            return `${process.env.NEXT_PUBLIC_BLOB_URL_PREFIX}/games/${filename}`;
          },
        },
        usermedia: {
          prefix: "usermedia",
          generateFileURL: (args) => {
            const { filename, prefix = "usermedia" } = args;
            return `${process.env.NEXT_PUBLIC_BLOB_URL_PREFIX}/${prefix}/${filename}`;
          },
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  upload: {
    limits: {
      fileSize: 10000000, // 10MB
    },
  },
});
