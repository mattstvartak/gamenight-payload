import type { CollectionConfig } from "payload";
import { anyone } from "./access/anyone";
import { admins } from "./access/admins";
import { checkRole } from "./access/checkRole";
import { adminsAndUser } from "./access/adminsAndUser";

export const Games: CollectionConfig = {
  slug: "games",
  labels: {
    singular: "Game",
    plural: "Games",
  },
  admin: {
    useAsTitle: "name",
    group: "Collections",
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
  fields: [
    {
      name: "bggId",
      type: "number",
      unique: true,
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "originalName",
      type: "text",
      admin: {
        description: "Original name if different from primary name",
      },
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "images",
      type: "relationship",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "affiliate link",
      type: "text",
    },
    {
      name: "type",
      type: "relationship",
      relationTo: "types",
      hasMany: true,
    },
    {
      name: "yearPublished",
      type: "number",
    },
    {
      name: "minPlayers",
      type: "number",
    },
    {
      name: "maxPlayers",
      type: "number",
    },
    {
      name: "playingTime",
      type: "number",
      admin: {
        description: "Average playing time in minutes",
      },
    },
    {
      name: "minPlaytime",
      type: "number",
    },
    {
      name: "maxPlaytime",
      type: "number",
    },
    {
      name: "minAge",
      type: "number",
    },
    {
      name: "complexity",
      type: "number",
      admin: {
        description: "Game weight/complexity rating (1-5)",
      },
    },
    {
      name: "userRating",
      type: "number",
      admin: {
        description: "Average user rating from BGG (1-10)",
      },
    },
    {
      name: "userRatedCount",
      type: "number",
      admin: {
        description: "Number of users who rated the game on BGG",
      },
    },
    {
      name: "official link",
      type: "text",
    },
    {
      name: "bggRank",
      type: "number",
      admin: {
        description: "Board Game Geek overall rank",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    {
      name: "mechanics",
      type: "relationship",
      relationTo: "mechanics",
      hasMany: true,
    },
    {
      name: "designers",
      type: "relationship",
      relationTo: "designers",
      hasMany: true,
    },
    {
      name: "publishers",
      type: "relationship",
      relationTo: "publishers",
      hasMany: true,
    },
    {
      name: "artists",
      type: "relationship",
      relationTo: "artists",
      hasMany: true,
    },
    {
      name: "expansions",
      type: "relationship",
      relationTo: "games",
      hasMany: true,
    },
    {
      name: "baseGame",
      type: "relationship",
      relationTo: "games",
      admin: {
        description: "Base game if this is an expansion",
      },
    },
    {
      name: "implementations",
      type: "relationship",
      relationTo: "games",
      hasMany: true,
    },
    {
      name: "accessories",
      type: "relationship",
      relationTo: "accessories",
      hasMany: true,
      label: "Game Accessories",
    },
    {
      name: "libraries",
      type: "join",
      collection: "libraries",
      on: "games",
    },
    {
      name: "suggestedPlayerCount",
      type: "array",
      admin: {
        description: "Recommended player counts from BGG polls",
      },
      fields: [
        {
          name: "playerCount",
          type: "number",
        },
        {
          name: "bestCount",
          type: "number",
          admin: {
            description: "Number of 'Best' votes for this player count",
          },
        },
        {
          name: "recommendedCount",
          type: "number",
          admin: {
            description: "Number of 'Recommended' votes for this player count",
          },
        },
        {
          name: "notRecommendedCount",
          type: "number",
          admin: {
            description:
              "Number of 'Not Recommended' votes for this player count",
          },
        },
      ],
    },
    {
      name: "languageDependence",
      type: "select",
      options: [
        { label: "No necessary in-game text", value: "0" },
        {
          label: "Some necessary text - easily memorized or small crib sheet",
          value: "1",
        },
        {
          label: "Moderate in-game text - needs crib sheet or paste ups",
          value: "2",
        },
        {
          label:
            "Extensive use of text - massive conversion needed to be playable",
          value: "3",
        },
        { label: "Unplayable in another language", value: "4" },
      ],
    },
    {
      name: "processing",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Indicates whether the game is still being processed. Set to false when the game and all related content are complete.",
      },
    },
  ],
};
