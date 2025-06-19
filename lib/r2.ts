// lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto", // Cloudflare R2 uses "auto" as region
  endpoint: process.env.R2_ENDPOINT_DEFAULT_URL, // Your Cloudflare R2 endpoint
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Important: Force path-style URLs for R2
  forcePathStyle: true,
});

import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = [".webp", ".jpeg", ".jpg"];
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

export async function uploadImageToR2(
  localPath: string,
  r2Key: string
): Promise<string | null> {
  try {
    const fileBuffer = await fs.readFile(localPath);
    const contentType =
      {
        ".webp": "image/webp",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
      }[path.extname(localPath)] || "application/octet-stream";

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    return r2Key; // Return the object key instead of a public URL
  } catch (error) {
    console.warn(`Failed to upload ${localPath}:`, error);
    return null;
  }
}

export async function findImagePath(
  folderPath: string,
  imageNumber: string
): Promise<string | null> {
  try {
    // Added check to verify directory exists
    const dirExists = await fs
      .access(folderPath)
      .then(() => true)
      .catch(() => false);

    if (!dirExists) {
      console.warn(`Directory does not exist: ${folderPath}`);
      return null;
    }

    const files = await fs.readdir(folderPath);
    console.log(`Folder: ${folderPath}, Files:`, files); // Debug log
    const match = files.find(
      (file) =>
        path.parse(file).name === imageNumber &&
        ALLOWED_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );
    console.log(`Match for ${imageNumber}:`, match); // Debug log
    return match ? path.join(folderPath, match) : null;
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error);
    return null;
  }
}
