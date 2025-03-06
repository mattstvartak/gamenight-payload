import { JSDOM } from "jsdom";
import { bggRateLimiter } from "./asyncUtils";
import {
  XMLNode,
  BGGResponse,
  XMLValue,
  isXMLNode,
  isBGGResponse,
  isXMLNodeArray,
} from "./xml-types";

/**
 * Fetches XML from a URL and converts it to a clean JavaScript object
 * - Moves XML attributes to regular object properties
 * - Extracts text content directly
 * - Flattens the structure where appropriate
 */
export const fetchXMLAndConvertToObject = async (
  url: string
): Promise<BGGResponse> => {
  try {
    // Use the rate limiter's withRetry method to handle rate limiting
    const fetchWithRetry = async (fetchUrl: string): Promise<string> => {
      const response = await fetch(fetchUrl);

      // Handle 429 Too Many Requests explicitly
      if (response.status === 429) {
        // Extract retry-after header if available
        const retryAfter = response.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;

        console.warn(
          `Rate limited by BGG API, retry-after: ${retryAfter || "not specified"}, waiting ${waitTime}ms`
        );

        // Throw an error with status code so the retry logic can handle it
        const error = new Error(`Too Many Requests: BGG API rate limited`);
        (error as Error & { status?: number }).status = 429;
        throw error;
      }

      if (!response.ok) {
        const error = new Error(`HTTP error! Status: ${response.status}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      return await response.text();
    };

    // Use the rate limiter's retry mechanism
    const xmlText = await bggRateLimiter.withRetry(fetchWithRetry, url);

    const dom = new JSDOM();
    const parser = new dom.window.DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    function xmlToObject(xml: Node): XMLValue {
      if (xml.nodeType === 3) {
        // Text node
        return xml.nodeValue?.trim() || "";
      }

      if (xml.nodeType !== 1) {
        return undefined;
      }

      const obj: XMLNode = {};

      // Element node
      if ((xml as Element).attributes?.length > 0) {
        obj["@attributes"] = {};
        for (let j = 0; j < (xml as Element).attributes.length; j++) {
          const attribute = (xml as Element).attributes.item(j);
          if (attribute) {
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
          }
        }
      }

      if (xml.hasChildNodes()) {
        for (let i = 0; i < xml.childNodes.length; i++) {
          const item = xml.childNodes[i];
          const nodeName = item.nodeName;
          const jsonValue = xmlToObject(item);

          if (jsonValue) {
            if (typeof obj[nodeName] === "undefined") {
              obj[nodeName] = jsonValue;
            } else {
              if (!isXMLNodeArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName] as XMLNode];
              }
              if (isXMLNode(jsonValue)) {
                (obj[nodeName] as XMLNode[]).push(jsonValue);
              }
            }
          }
        }
      }

      return obj;
    }

    function cleanXmlObject(obj: XMLValue): XMLValue {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      // If it's an array, clean each item
      if (Array.isArray(obj)) {
        return obj.map((item) => cleanXmlObject(item)) as XMLNode[];
      }

      const result: XMLNode = {};

      // Process @attributes
      if (isXMLNode(obj) && obj["@attributes"]) {
        for (const [key, value] of Object.entries(obj["@attributes"])) {
          if (value !== null) {
            result[key] = value;
          }
        }
      }

      // Handle #text content directly
      if (isXMLNode(obj) && obj["#text"]) {
        if (Object.keys(obj).length === 1) {
          return obj["#text"]; // If the object only has #text, return the text directly
        } else {
          result.text = obj["#text"];
        }
      }

      // Process all other properties
      if (isXMLNode(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          if (key !== "@attributes" && key !== "#text") {
            result[key] = cleanXmlObject(value);
          }
        }
      }

      return result;
    }

    const intermediateObj = xmlToObject(xmlDoc);
    const cleanedObj = cleanXmlObject(intermediateObj);

    // Ensure the response matches the BGGResponse type
    if (!isBGGResponse(cleanedObj)) {
      throw new Error("Invalid XML structure: missing items");
    }

    return cleanedObj;
  } catch (error) {
    console.error("Error fetching or converting XML:", error);
    throw error;
  }
};
