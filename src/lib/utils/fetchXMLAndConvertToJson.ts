import { JSDOM } from "jsdom";

/**
 * Fetches XML from a URL and converts it to a clean JavaScript object
 * - Moves XML attributes to regular object properties
 * - Extracts text content directly
 * - Flattens the structure where appropriate
 */
export const fetchXMLAndConvertToObject = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const xmlText = await response.text();
    const dom = new JSDOM();
    const parser = new dom.window.DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    function xmlToObject(xml: Node): any {
      const obj: Record<string, any> = {};
      if (xml.nodeType === 1) {
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
      } else if (xml.nodeType === 3) {
        // Text node
        return xml.nodeValue?.trim();
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
              if (!Array.isArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName]];
              }
              obj[nodeName].push(jsonValue);
            }
          }
        }
      }

      return obj;
    }

    function cleanXmlObject(obj: any): any {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      // If it's an array, clean each item
      if (Array.isArray(obj)) {
        return obj.map((item) => cleanXmlObject(item));
      }

      const result: Record<string, any> = {};

      // Process @attributes
      if (obj["@attributes"]) {
        for (const [key, value] of Object.entries(obj["@attributes"])) {
          result[key] = value;
        }
      }

      // Handle #text content directly
      if (obj["#text"]) {
        if (Object.keys(obj).length === 1) {
          return obj["#text"]; // If the object only has #text, return the text directly
        } else {
          result.text = obj["#text"];
        }
      }

      // Process all other properties
      for (const [key, value] of Object.entries(obj)) {
        if (key !== "@attributes" && key !== "#text") {
          result[key] = cleanXmlObject(value);
        }
      }

      return result;
    }

    const intermediateObj = xmlToObject(xmlDoc);
    return cleanXmlObject(intermediateObj).items.item;
  } catch (error) {
    console.error("Error fetching or converting XML:", error);
    throw error;
  }
};
