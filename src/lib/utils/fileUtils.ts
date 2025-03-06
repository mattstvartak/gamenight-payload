import fs from "fs";
import { unlink, readFile, stat } from "fs/promises";
import path from "path";
import os from "os";
import https from "https";

/**
 * Creates a Payload file object from a file path with folder organization
 * @param filePath Path to the file on disk
 * @param entityName Name to use for folder creation
 * @returns Payload compatible file object
 */
export async function createPayloadFile(filePath: string, entityName: string) {
  const fileBuffer = await readFile(filePath);
  const fileStats = await stat(filePath);
  const fileExtension = path.extname(filePath).slice(1);

  // Create sanitized name for folder
  const sanitizedName = entityName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  // Create new filename with folder path but generic image name
  const fileName = `${sanitizedName}/cover.${fileExtension}`;

  return {
    data: fileBuffer,
    size: fileStats.size,
    name: fileName,
    mimetype: `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`,
  };
}

/**
 * Downloads an image from a URL to a temporary file
 * @param url URL of the image to download
 * @returns Path to the temporary file or null if download failed
 */
export async function downloadImageToTemp(url: string): Promise<string | null> {
  try {
    // Create a temp file path
    const tempDir = os.tmpdir();
    const fileExtension = url.split(".").pop()?.split("?")[0] || "jpg";
    const tempFilePath = path.join(
      tempDir,
      `temp_${Date.now()}.${fileExtension}`
    );

    // Create write stream
    const fileStream = fs.createWriteStream(tempFilePath);

    // Download the file
    await new Promise<void>((resolve, reject) => {
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(`Failed to download image: ${response.statusCode}`)
            );
            return;
          }

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });

          fileStream.on("error", (err: Error) => {
            unlink(tempFilePath).catch(console.error);
            reject(err);
          });
        })
        .on("error", (err: Error) => {
          unlink(tempFilePath).catch(console.error);
          reject(err);
        });
    });

    return tempFilePath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}
