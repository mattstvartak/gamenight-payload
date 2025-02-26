// storage-adapter-import-placeholder
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
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
    meta: {
      titleSuffix: "- GameNight",
    },
  },
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
      connectionString: process.env.POSTGRES_URL || "",
      ssl: {
        ca: process.env.SUPABASE_CA_CERT?.includes('-----BEGIN CERTIFICATE-----')
        ? process.env.SUPABASE_CA_CERT
        : readFileSync(process.env.SUPABASE_CA_CERT!),
      }
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
