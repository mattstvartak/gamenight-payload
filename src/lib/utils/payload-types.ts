export interface XMLAttributes {
  [key: string]: string | null;
}

export interface XMLNode {
  "@attributes"?: XMLAttributes;
  "#text"?: string;
  [key: string]: XMLNode | XMLNode[] | string | XMLAttributes | undefined;
}

export interface BGGItem {
  id: string;
  type: string;
  name: string | { value: string; type: string }[];
  yearpublished?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
  minplayers?: string;
  maxplayers?: string;
  playingtime?: string;
  minplaytime?: string;
  maxplaytime?: string;
  minage?: string;
  link?: { value: string; type: string }[];
  statistics?: {
    ratings: {
      usersrated: string;
      average: string;
      bayesaverage: string;
      stddev: string;
      median: string;
    };
  };
  [key: string]: unknown;
}

export interface BGGResponse {
  items: {
    item: BGGItem | BGGItem[];
  };
}
