/**
 * Formats a plain text string into the Lexical rich text editor format
 * Used for all description fields across collections
 * @param text The plain text to format
 * @returns Lexical rich text format object or undefined if text is empty
 */
export function formatRichText(text: string) {
  if (!text) return undefined;

  // Decode HTML entities and ASCII codes to proper characters
  const decodeText = (str: string) => {
    return (
      str
        // Handle common HTML entities
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        // Handle numeric HTML entities (like &#nnnn;)
        .replace(/&#(\d+);/g, (match, dec) =>
          String.fromCharCode(parseInt(dec, 10))
        )
        // Handle hex HTML entities (like &#xhhhh;)
        .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
    );
  };

  // Clean up the text by converting ASCII codes and HTML entities
  const cleanedText = decodeText(text);

  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: cleanedText,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}
