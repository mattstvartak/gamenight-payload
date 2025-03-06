export interface XMLAttributes {
  [key: string]: string | null;
}

export interface XMLNode {
  "@attributes"?: XMLAttributes;
  "#text"?: string;
  [key: string]: XMLValue | XMLNode[];
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
  items?: {
    item: BGGItem | BGGItem[];
  };
  item?: BGGItem;
}

export type XMLValue =
  | string
  | XMLNode
  | XMLNode[]
  | XMLAttributes
  | BGGResponse
  | undefined;

export function isXMLNode(value: XMLValue): value is XMLNode {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !("items" in value)
  );
}

export function isXMLAttributes(value: XMLValue): value is XMLAttributes {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !("@attributes" in value) &&
    !("#text" in value)
  );
}

export function isBGGResponse(value: XMLValue): value is BGGResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    (("items" in value && typeof (value as any).items === "object") ||
      ("item" in value && typeof (value as any).item === "object"))
  );
}

export function isXMLNodeArray(value: XMLValue): value is XMLNode[] {
  return Array.isArray(value) && value.every((item) => isXMLNode(item));
}
