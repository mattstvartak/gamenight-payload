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

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Libraries } from "./collections/Libraries";
import { Notes } from "./collections/Notes";
import { GameNights } from "./collections/GameNights";
import { Games } from "./collections/Games";
import { Categories } from "./collections/Categories";
import { Mechanics } from "./collections/Mechanics";

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
    defaultFromAddress: "noreply@trial-z3m5jgr3y90gdpyo.mlsender.net",
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
    Users,
    Media,
    Libraries,
    Notes,
    GameNights,
    Games,
    Categories,
    Mechanics,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: {
          prefix: "games",
          generateFileURL: (args) => {
            const { filename, prefix = "games" } = args;
            return `${process.env.NEXT_PUBLIC_BLOB_URL_PREFIX}/${prefix}${filename}`;
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
      fileSize: 5000000, // 5MB
    },
  },
});
