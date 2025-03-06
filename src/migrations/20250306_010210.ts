import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_games_language_dependence" AS ENUM('0', '1', '2', '3', '4');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'user');
  CREATE TABLE IF NOT EXISTS "accessories_alternate_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "accessories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"description" jsonb,
  	"affiliate_link" varchar,
  	"year_published" numeric,
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "accessories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"publishers_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"description" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "designers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"description" jsonb,
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "gamenights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" jsonb,
  	"date" timestamp(3) with time zone,
  	"location" geometry(Point),
  	"recurring" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "gamenights_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"games_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "games_suggested_player_count" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"player_count" numeric,
  	"best_count" numeric,
  	"recommended_count" numeric,
  	"not_recommended_count" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "games" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"original_name" varchar,
  	"description" jsonb,
  	"affiliate_link" varchar,
  	"year_published" numeric,
  	"min_players" numeric,
  	"max_players" numeric,
  	"playing_time" numeric,
  	"min_playtime" numeric,
  	"max_playtime" numeric,
  	"min_age" numeric,
  	"complexity" numeric,
  	"user_rating" numeric,
  	"user_rated_count" numeric,
  	"official_link" varchar,
  	"bgg_rank" numeric,
  	"base_game_id" integer,
  	"language_dependence" "enum_games_language_dependence",
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "games_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"types_id" integer,
  	"categories_id" integer,
  	"mechanics_id" integer,
  	"designers_id" integer,
  	"publishers_id" integer,
  	"artists_id" integer,
  	"games_id" integer,
  	"accessories_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "libraries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"description" jsonb,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "libraries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"games_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "mechanics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'games',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"notes" jsonb,
  	"user_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "publishers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"description" jsonb,
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "publishers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bgg_id" numeric,
  	"name" varchar,
  	"description" jsonb,
  	"processing" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "usermedia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"game_id" varchar,
  	"game_name" varchar,
  	"prefix" varchar DEFAULT 'usermedia',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"username" varchar NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"phone" numeric,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"libraries_id" integer,
  	"gamenights_id" integer,
  	"users_id" integer,
  	"notes_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"accessories_id" integer,
  	"artists_id" integer,
  	"categories_id" integer,
  	"designers_id" integer,
  	"gamenights_id" integer,
  	"games_id" integer,
  	"libraries_id" integer,
  	"mechanics_id" integer,
  	"media_id" integer,
  	"notes_id" integer,
  	"publishers_id" integer,
  	"types_id" integer,
  	"usermedia_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DO $$ BEGIN
   ALTER TABLE "accessories_alternate_names" ADD CONSTRAINT "accessories_alternate_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accessories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "accessories_rels" ADD CONSTRAINT "accessories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."accessories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "accessories_rels" ADD CONSTRAINT "accessories_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "accessories_rels" ADD CONSTRAINT "accessories_rels_publishers_fk" FOREIGN KEY ("publishers_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gamenights_rels" ADD CONSTRAINT "gamenights_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gamenights"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gamenights_rels" ADD CONSTRAINT "gamenights_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gamenights_rels" ADD CONSTRAINT "gamenights_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_suggested_player_count" ADD CONSTRAINT "games_suggested_player_count_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games" ADD CONSTRAINT "games_base_game_id_games_id_fk" FOREIGN KEY ("base_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_mechanics_fk" FOREIGN KEY ("mechanics_id") REFERENCES "public"."mechanics"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_designers_fk" FOREIGN KEY ("designers_id") REFERENCES "public"."designers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_publishers_fk" FOREIGN KEY ("publishers_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games_rels" ADD CONSTRAINT "games_rels_accessories_fk" FOREIGN KEY ("accessories_id") REFERENCES "public"."accessories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "libraries" ADD CONSTRAINT "libraries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "libraries_rels" ADD CONSTRAINT "libraries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "libraries_rels" ADD CONSTRAINT "libraries_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "publishers_rels" ADD CONSTRAINT "publishers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "publishers_rels" ADD CONSTRAINT "publishers_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_usermedia_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."usermedia"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_libraries_fk" FOREIGN KEY ("libraries_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_gamenights_fk" FOREIGN KEY ("gamenights_id") REFERENCES "public"."gamenights"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accessories_fk" FOREIGN KEY ("accessories_id") REFERENCES "public"."accessories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_designers_fk" FOREIGN KEY ("designers_id") REFERENCES "public"."designers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gamenights_fk" FOREIGN KEY ("gamenights_id") REFERENCES "public"."gamenights"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_libraries_fk" FOREIGN KEY ("libraries_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mechanics_fk" FOREIGN KEY ("mechanics_id") REFERENCES "public"."mechanics"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publishers_fk" FOREIGN KEY ("publishers_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_types_fk" FOREIGN KEY ("types_id") REFERENCES "public"."types"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_usermedia_fk" FOREIGN KEY ("usermedia_id") REFERENCES "public"."usermedia"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "accessories_alternate_names_order_idx" ON "accessories_alternate_names" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "accessories_alternate_names_parent_id_idx" ON "accessories_alternate_names" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "accessories_bgg_id_idx" ON "accessories" USING btree ("bgg_id");
  CREATE INDEX IF NOT EXISTS "accessories_updated_at_idx" ON "accessories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "accessories_created_at_idx" ON "accessories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "accessories_rels_order_idx" ON "accessories_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "accessories_rels_parent_idx" ON "accessories_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "accessories_rels_path_idx" ON "accessories_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "accessories_rels_media_id_idx" ON "accessories_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "accessories_rels_publishers_id_idx" ON "accessories_rels" USING btree ("publishers_id");
  CREATE INDEX IF NOT EXISTS "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "designers_updated_at_idx" ON "designers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "designers_created_at_idx" ON "designers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "gamenights_updated_at_idx" ON "gamenights" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "gamenights_created_at_idx" ON "gamenights" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "gamenights_rels_order_idx" ON "gamenights_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "gamenights_rels_parent_idx" ON "gamenights_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "gamenights_rels_path_idx" ON "gamenights_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "gamenights_rels_users_id_idx" ON "gamenights_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "gamenights_rels_games_id_idx" ON "gamenights_rels" USING btree ("games_id");
  CREATE INDEX IF NOT EXISTS "games_suggested_player_count_order_idx" ON "games_suggested_player_count" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "games_suggested_player_count_parent_id_idx" ON "games_suggested_player_count" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "games_bgg_id_idx" ON "games" USING btree ("bgg_id");
  CREATE INDEX IF NOT EXISTS "games_base_game_idx" ON "games" USING btree ("base_game_id");
  CREATE INDEX IF NOT EXISTS "games_updated_at_idx" ON "games" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "games_created_at_idx" ON "games" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "games_rels_order_idx" ON "games_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "games_rels_parent_idx" ON "games_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "games_rels_path_idx" ON "games_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "games_rels_media_id_idx" ON "games_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "games_rels_types_id_idx" ON "games_rels" USING btree ("types_id");
  CREATE INDEX IF NOT EXISTS "games_rels_categories_id_idx" ON "games_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "games_rels_mechanics_id_idx" ON "games_rels" USING btree ("mechanics_id");
  CREATE INDEX IF NOT EXISTS "games_rels_designers_id_idx" ON "games_rels" USING btree ("designers_id");
  CREATE INDEX IF NOT EXISTS "games_rels_publishers_id_idx" ON "games_rels" USING btree ("publishers_id");
  CREATE INDEX IF NOT EXISTS "games_rels_artists_id_idx" ON "games_rels" USING btree ("artists_id");
  CREATE INDEX IF NOT EXISTS "games_rels_games_id_idx" ON "games_rels" USING btree ("games_id");
  CREATE INDEX IF NOT EXISTS "games_rels_accessories_id_idx" ON "games_rels" USING btree ("accessories_id");
  CREATE INDEX IF NOT EXISTS "libraries_created_by_idx" ON "libraries" USING btree ("created_by_id");
  CREATE INDEX IF NOT EXISTS "libraries_updated_at_idx" ON "libraries" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "libraries_created_at_idx" ON "libraries" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "libraries_rels_order_idx" ON "libraries_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "libraries_rels_parent_idx" ON "libraries_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "libraries_rels_path_idx" ON "libraries_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "libraries_rels_games_id_idx" ON "libraries_rels" USING btree ("games_id");
  CREATE INDEX IF NOT EXISTS "mechanics_updated_at_idx" ON "mechanics" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "mechanics_created_at_idx" ON "mechanics" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "notes_user_idx" ON "notes" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "notes_updated_at_idx" ON "notes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "notes_created_at_idx" ON "notes" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "publishers_updated_at_idx" ON "publishers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "publishers_created_at_idx" ON "publishers" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "publishers_rels_order_idx" ON "publishers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "publishers_rels_parent_idx" ON "publishers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "publishers_rels_path_idx" ON "publishers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "publishers_rels_media_id_idx" ON "publishers_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "types_updated_at_idx" ON "types" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "types_created_at_idx" ON "types" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "usermedia_updated_at_idx" ON "usermedia" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "usermedia_created_at_idx" ON "usermedia" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "usermedia_filename_idx" ON "usermedia" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "usermedia_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "usermedia" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "usermedia_sizes_card_sizes_card_filename_idx" ON "usermedia" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "users_rels_libraries_id_idx" ON "users_rels" USING btree ("libraries_id");
  CREATE INDEX IF NOT EXISTS "users_rels_gamenights_id_idx" ON "users_rels" USING btree ("gamenights_id");
  CREATE INDEX IF NOT EXISTS "users_rels_users_id_idx" ON "users_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "users_rels_notes_id_idx" ON "users_rels" USING btree ("notes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_accessories_id_idx" ON "payload_locked_documents_rels" USING btree ("accessories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_designers_id_idx" ON "payload_locked_documents_rels" USING btree ("designers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gamenights_id_idx" ON "payload_locked_documents_rels" USING btree ("gamenights_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_games_id_idx" ON "payload_locked_documents_rels" USING btree ("games_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_libraries_id_idx" ON "payload_locked_documents_rels" USING btree ("libraries_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_mechanics_id_idx" ON "payload_locked_documents_rels" USING btree ("mechanics_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("notes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_publishers_id_idx" ON "payload_locked_documents_rels" USING btree ("publishers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_types_id_idx" ON "payload_locked_documents_rels" USING btree ("types_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_usermedia_id_idx" ON "payload_locked_documents_rels" USING btree ("usermedia_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "accessories_alternate_names" CASCADE;
  DROP TABLE "accessories" CASCADE;
  DROP TABLE "accessories_rels" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "designers" CASCADE;
  DROP TABLE "gamenights" CASCADE;
  DROP TABLE "gamenights_rels" CASCADE;
  DROP TABLE "games_suggested_player_count" CASCADE;
  DROP TABLE "games" CASCADE;
  DROP TABLE "games_rels" CASCADE;
  DROP TABLE "libraries" CASCADE;
  DROP TABLE "libraries_rels" CASCADE;
  DROP TABLE "mechanics" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "notes" CASCADE;
  DROP TABLE "publishers" CASCADE;
  DROP TABLE "publishers_rels" CASCADE;
  DROP TABLE "types" CASCADE;
  DROP TABLE "usermedia" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_games_language_dependence";
  DROP TYPE "public"."enum_users_roles";`)
}
