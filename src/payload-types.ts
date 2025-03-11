/* tslint:disable */
/* eslint-disable */
/**
 * This file was automatically generated by Payload.
 * DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,
 * and re-run `payload generate:types` to regenerate this file.
 */

/**
 * Supported timezones in IANA format.
 *
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "supportedTimezones".
 */
export type SupportedTimezones =
  | 'Pacific/Midway'
  | 'Pacific/Niue'
  | 'Pacific/Honolulu'
  | 'Pacific/Rarotonga'
  | 'America/Anchorage'
  | 'Pacific/Gambier'
  | 'America/Los_Angeles'
  | 'America/Tijuana'
  | 'America/Denver'
  | 'America/Phoenix'
  | 'America/Chicago'
  | 'America/Guatemala'
  | 'America/New_York'
  | 'America/Bogota'
  | 'America/Caracas'
  | 'America/Santiago'
  | 'America/Buenos_Aires'
  | 'America/Sao_Paulo'
  | 'Atlantic/South_Georgia'
  | 'Atlantic/Azores'
  | 'Atlantic/Cape_Verde'
  | 'Europe/London'
  | 'Europe/Berlin'
  | 'Africa/Lagos'
  | 'Europe/Athens'
  | 'Africa/Cairo'
  | 'Europe/Moscow'
  | 'Asia/Riyadh'
  | 'Asia/Dubai'
  | 'Asia/Baku'
  | 'Asia/Karachi'
  | 'Asia/Tashkent'
  | 'Asia/Calcutta'
  | 'Asia/Dhaka'
  | 'Asia/Almaty'
  | 'Asia/Jakarta'
  | 'Asia/Bangkok'
  | 'Asia/Shanghai'
  | 'Asia/Singapore'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Australia/Sydney'
  | 'Pacific/Guam'
  | 'Pacific/Noumea'
  | 'Pacific/Auckland'
  | 'Pacific/Fiji';

export interface Config {
  auth: {
    users: UserAuthOperations;
  };
  blocks: {};
  collections: {
    accessories: Accessory;
    artists: Artist;
    categories: Category;
    designers: Designer;
    expansions: Expansion;
    gamenights: Gamenight;
    games: Game;
    libraries: Library;
    mechanics: Mechanic;
    media: Media;
    notes: Note;
    publishers: Publisher;
    types: Type;
    usermedia: Usermedia;
    users: User;
    'payload-locked-documents': PayloadLockedDocument;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  collectionsJoins: {
    accessories: {
      games: 'games';
    };
    artists: {
      games: 'games';
    };
    categories: {
      games: 'games';
    };
    designers: {
      games: 'games';
    };
    expansions: {
      libraries: 'libraries';
    };
    games: {
      libraries: 'libraries';
    };
    mechanics: {
      games: 'games';
    };
    publishers: {
      games: 'games';
      accessories: 'accessories';
    };
    types: {
      games: 'games';
    };
  };
  collectionsSelect: {
    accessories: AccessoriesSelect<false> | AccessoriesSelect<true>;
    artists: ArtistsSelect<false> | ArtistsSelect<true>;
    categories: CategoriesSelect<false> | CategoriesSelect<true>;
    designers: DesignersSelect<false> | DesignersSelect<true>;
    expansions: ExpansionsSelect<false> | ExpansionsSelect<true>;
    gamenights: GamenightsSelect<false> | GamenightsSelect<true>;
    games: GamesSelect<false> | GamesSelect<true>;
    libraries: LibrariesSelect<false> | LibrariesSelect<true>;
    mechanics: MechanicsSelect<false> | MechanicsSelect<true>;
    media: MediaSelect<false> | MediaSelect<true>;
    notes: NotesSelect<false> | NotesSelect<true>;
    publishers: PublishersSelect<false> | PublishersSelect<true>;
    types: TypesSelect<false> | TypesSelect<true>;
    usermedia: UsermediaSelect<false> | UsermediaSelect<true>;
    users: UsersSelect<false> | UsersSelect<true>;
    'payload-locked-documents': PayloadLockedDocumentsSelect<false> | PayloadLockedDocumentsSelect<true>;
    'payload-preferences': PayloadPreferencesSelect<false> | PayloadPreferencesSelect<true>;
    'payload-migrations': PayloadMigrationsSelect<false> | PayloadMigrationsSelect<true>;
  };
  db: {
    defaultIDType: number;
  };
  globals: {};
  globalsSelect: {};
  locale: null;
  user: User & {
    collection: 'users';
  };
  jobs: {
    tasks: unknown;
    workflows: unknown;
  };
}
export interface UserAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "accessories".
 */
export interface Accessory {
  id: number;
  bggId?: number | null;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  images?: (number | Media)[] | null;
  'affiliate link'?: string | null;
  yearPublished?: number | null;
  publishers?: (number | Publisher)[] | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  alternateNames?:
    | {
        name?: string | null;
        id?: string | null;
      }[]
    | null;
  /**
   * Indicates whether the accessory is still being processed. Set to false when the accessory and all related content are complete.
   */
  processing?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media".
 */
export interface Media {
  id: number;
  alt: string;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: {
    thumbnail?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
    card?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "publishers".
 */
export interface Publisher {
  id: number;
  bggId?: number | null;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  images?: (number | Media)[] | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  accessories?: {
    docs?: (number | Accessory)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Indicates whether the publisher is still being processed. Set to false when the publisher and all related content are complete.
   */
  processing?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "games".
 */
export interface Game {
  id: number;
  bggId?: number | null;
  name?: string | null;
  /**
   * Original name if different from primary name
   */
  originalName?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  images?: (number | Media)[] | null;
  'affiliate link'?: string | null;
  type?: (number | Type)[] | null;
  yearPublished?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  /**
   * Average playing time in minutes
   */
  playingTime?: number | null;
  minPlaytime?: number | null;
  maxPlaytime?: number | null;
  minAge?: number | null;
  /**
   * Game weight/complexity rating (1-5)
   */
  complexity?: number | null;
  /**
   * Average user rating from BGG (1-10)
   */
  userRating?: number | null;
  /**
   * Number of users who rated the game on BGG
   */
  userRatedCount?: number | null;
  'official link'?: string | null;
  /**
   * Board Game Geek overall rank
   */
  bggRank?: number | null;
  categories?: (number | Category)[] | null;
  mechanics?: (number | Mechanic)[] | null;
  designers?: (number | Designer)[] | null;
  publishers?: (number | Publisher)[] | null;
  artists?: (number | Artist)[] | null;
  expansions?: (number | Game)[] | null;
  /**
   * Base game if this is an expansion
   */
  baseGame?: (number | null) | Game;
  implementations?: (number | Game)[] | null;
  accessories?: (number | Accessory)[] | null;
  libraries?: {
    docs?: (number | Library)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Recommended player counts from BGG polls
   */
  suggestedPlayerCount?:
    | {
        playerCount?: number | null;
        /**
         * Number of 'Best' votes for this player count
         */
        bestCount?: number | null;
        /**
         * Number of 'Recommended' votes for this player count
         */
        recommendedCount?: number | null;
        /**
         * Number of 'Not Recommended' votes for this player count
         */
        notRecommendedCount?: number | null;
        id?: string | null;
      }[]
    | null;
  languageDependence?: ('0' | '1' | '2' | '3' | '4') | null;
  processed?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "types".
 */
export interface Type {
  id: number;
  name?: string | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Indicates whether the type is still being processed. Set to false when the type and all related content are complete.
   */
  processing?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "categories".
 */
export interface Category {
  id: number;
  bggId?: number | null;
  name?: string | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "mechanics".
 */
export interface Mechanic {
  id: number;
  bggId?: number | null;
  name?: string | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Indicates whether the mechanic is still being processed. Set to false when the mechanic and all related content are complete.
   */
  processing?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "designers".
 */
export interface Designer {
  id: number;
  bggId?: number | null;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Indicates whether the designer is still being processed. Set to false when the designer and all related content are complete.
   */
  processing?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "artists".
 */
export interface Artist {
  id: number;
  bggId?: number | null;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  games?: {
    docs?: (number | Game)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "libraries".
 */
export interface Library {
  id: number;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  createdBy?: (number | null) | User;
  games?: (number | Game)[] | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users".
 */
export interface User {
  id: number;
  roles?: ('admin' | 'user')[] | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: number | null;
  libraries?: (number | Library)[] | null;
  gameNights?: (number | Gamenight)[] | null;
  friends?: (number | User)[] | null;
  notes?: (number | Note)[] | null;
  avatar?: (number | null) | Usermedia;
  updatedAt: string;
  createdAt: string;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  _verified?: boolean | null;
  _verificationToken?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "gamenights".
 */
export interface Gamenight {
  id: number;
  name?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  date?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  players?: (number | User)[] | null;
  games?: (number | Game)[] | null;
  recurring?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "notes".
 */
export interface Note {
  id: number;
  name?: string | null;
  notes?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  user: number | User;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "usermedia".
 */
export interface Usermedia {
  id: number;
  alt: string;
  gameId?: string | null;
  gameName?: string | null;
  prefix?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: {
    thumbnail?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
    card?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "expansions".
 */
export interface Expansion {
  id: number;
  bggId?: number | null;
  name?: string | null;
  /**
   * Original name if different from primary name
   */
  originalName?: string | null;
  description?: {
    root: {
      type: string;
      children: {
        type: string;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;
  images?: (number | Media)[] | null;
  'affiliate link'?: string | null;
  type?: (number | Type)[] | null;
  yearPublished?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  /**
   * Average playing time in minutes
   */
  playingTime?: number | null;
  minPlaytime?: number | null;
  maxPlaytime?: number | null;
  minAge?: number | null;
  /**
   * Game weight/complexity rating (1-5)
   */
  complexity?: number | null;
  /**
   * Average user rating from BGG (1-10)
   */
  userRating?: number | null;
  /**
   * Number of users who rated the game on BGG
   */
  userRatedCount?: number | null;
  'official link'?: string | null;
  /**
   * Board Game Geek overall rank
   */
  bggRank?: number | null;
  categories?: (number | Category)[] | null;
  mechanics?: (number | Mechanic)[] | null;
  designers?: (number | Designer)[] | null;
  publishers?: (number | Publisher)[] | null;
  artists?: (number | Artist)[] | null;
  expansions?: (number | Game)[] | null;
  /**
   * Base game if this is an expansion
   */
  baseGame?: (number | null) | Game;
  implementations?: (number | Game)[] | null;
  accessories?: (number | Accessory)[] | null;
  libraries?: {
    docs?: (number | Library)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  /**
   * Recommended player counts from BGG polls
   */
  suggestedPlayerCount?:
    | {
        playerCount?: number | null;
        /**
         * Number of 'Best' votes for this player count
         */
        bestCount?: number | null;
        /**
         * Number of 'Recommended' votes for this player count
         */
        recommendedCount?: number | null;
        /**
         * Number of 'Not Recommended' votes for this player count
         */
        notRecommendedCount?: number | null;
        id?: string | null;
      }[]
    | null;
  languageDependence?: ('0' | '1' | '2' | '3' | '4') | null;
  /**
   * Indicates whether the expansion has been processed. Set to true when the expansion and all related content are complete.
   */
  processed?: boolean | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents".
 */
export interface PayloadLockedDocument {
  id: number;
  document?:
    | ({
        relationTo: 'accessories';
        value: number | Accessory;
      } | null)
    | ({
        relationTo: 'artists';
        value: number | Artist;
      } | null)
    | ({
        relationTo: 'categories';
        value: number | Category;
      } | null)
    | ({
        relationTo: 'designers';
        value: number | Designer;
      } | null)
    | ({
        relationTo: 'expansions';
        value: number | Expansion;
      } | null)
    | ({
        relationTo: 'gamenights';
        value: number | Gamenight;
      } | null)
    | ({
        relationTo: 'games';
        value: number | Game;
      } | null)
    | ({
        relationTo: 'libraries';
        value: number | Library;
      } | null)
    | ({
        relationTo: 'mechanics';
        value: number | Mechanic;
      } | null)
    | ({
        relationTo: 'media';
        value: number | Media;
      } | null)
    | ({
        relationTo: 'notes';
        value: number | Note;
      } | null)
    | ({
        relationTo: 'publishers';
        value: number | Publisher;
      } | null)
    | ({
        relationTo: 'types';
        value: number | Type;
      } | null)
    | ({
        relationTo: 'usermedia';
        value: number | Usermedia;
      } | null)
    | ({
        relationTo: 'users';
        value: number | User;
      } | null);
  globalSlug?: string | null;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences".
 */
export interface PayloadPreference {
  id: number;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  key?: string | null;
  value?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations".
 */
export interface PayloadMigration {
  id: number;
  name?: string | null;
  batch?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "accessories_select".
 */
export interface AccessoriesSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  description?: T;
  images?: T;
  'affiliate link'?: T;
  yearPublished?: T;
  publishers?: T;
  games?: T;
  alternateNames?:
    | T
    | {
        name?: T;
        id?: T;
      };
  processing?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "artists_select".
 */
export interface ArtistsSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  description?: T;
  games?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "categories_select".
 */
export interface CategoriesSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  games?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "designers_select".
 */
export interface DesignersSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  description?: T;
  games?: T;
  processing?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "expansions_select".
 */
export interface ExpansionsSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  originalName?: T;
  description?: T;
  images?: T;
  'affiliate link'?: T;
  type?: T;
  yearPublished?: T;
  minPlayers?: T;
  maxPlayers?: T;
  playingTime?: T;
  minPlaytime?: T;
  maxPlaytime?: T;
  minAge?: T;
  complexity?: T;
  userRating?: T;
  userRatedCount?: T;
  'official link'?: T;
  bggRank?: T;
  categories?: T;
  mechanics?: T;
  designers?: T;
  publishers?: T;
  artists?: T;
  expansions?: T;
  baseGame?: T;
  implementations?: T;
  accessories?: T;
  libraries?: T;
  suggestedPlayerCount?:
    | T
    | {
        playerCount?: T;
        bestCount?: T;
        recommendedCount?: T;
        notRecommendedCount?: T;
        id?: T;
      };
  languageDependence?: T;
  processed?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "gamenights_select".
 */
export interface GamenightsSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  date?: T;
  location?: T;
  latitude?: T;
  longitude?: T;
  players?: T;
  games?: T;
  recurring?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "games_select".
 */
export interface GamesSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  originalName?: T;
  description?: T;
  images?: T;
  'affiliate link'?: T;
  type?: T;
  yearPublished?: T;
  minPlayers?: T;
  maxPlayers?: T;
  playingTime?: T;
  minPlaytime?: T;
  maxPlaytime?: T;
  minAge?: T;
  complexity?: T;
  userRating?: T;
  userRatedCount?: T;
  'official link'?: T;
  bggRank?: T;
  categories?: T;
  mechanics?: T;
  designers?: T;
  publishers?: T;
  artists?: T;
  expansions?: T;
  baseGame?: T;
  implementations?: T;
  accessories?: T;
  libraries?: T;
  suggestedPlayerCount?:
    | T
    | {
        playerCount?: T;
        bestCount?: T;
        recommendedCount?: T;
        notRecommendedCount?: T;
        id?: T;
      };
  languageDependence?: T;
  processed?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "libraries_select".
 */
export interface LibrariesSelect<T extends boolean = true> {
  name?: T;
  description?: T;
  createdBy?: T;
  games?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "mechanics_select".
 */
export interface MechanicsSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  games?: T;
  processing?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "media_select".
 */
export interface MediaSelect<T extends boolean = true> {
  alt?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
  sizes?:
    | T
    | {
        thumbnail?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
        card?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
      };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "notes_select".
 */
export interface NotesSelect<T extends boolean = true> {
  name?: T;
  notes?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "publishers_select".
 */
export interface PublishersSelect<T extends boolean = true> {
  bggId?: T;
  name?: T;
  description?: T;
  images?: T;
  games?: T;
  accessories?: T;
  processing?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "types_select".
 */
export interface TypesSelect<T extends boolean = true> {
  name?: T;
  games?: T;
  processing?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "usermedia_select".
 */
export interface UsermediaSelect<T extends boolean = true> {
  alt?: T;
  gameId?: T;
  gameName?: T;
  prefix?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
  sizes?:
    | T
    | {
        thumbnail?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
        card?:
          | T
          | {
              url?: T;
              width?: T;
              height?: T;
              mimeType?: T;
              filesize?: T;
              filename?: T;
            };
      };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users_select".
 */
export interface UsersSelect<T extends boolean = true> {
  roles?: T;
  username?: T;
  firstName?: T;
  lastName?: T;
  phone?: T;
  libraries?: T;
  gameNights?: T;
  friends?: T;
  notes?: T;
  avatar?: T;
  updatedAt?: T;
  createdAt?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  _verified?: T;
  _verificationToken?: T;
  loginAttempts?: T;
  lockUntil?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents_select".
 */
export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
  document?: T;
  globalSlug?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences_select".
 */
export interface PayloadPreferencesSelect<T extends boolean = true> {
  user?: T;
  key?: T;
  value?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations_select".
 */
export interface PayloadMigrationsSelect<T extends boolean = true> {
  name?: T;
  batch?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "auth".
 */
export interface Auth {
  [k: string]: unknown;
}


declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}