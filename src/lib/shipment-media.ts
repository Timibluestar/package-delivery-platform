import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db";

export type ShipmentMediaType =
  | "package_item"
  | "package_photo"
  | "receiver_photo";

export type ShipmentMedia = {
  id: string;
  shipmentId: string;
  mediaType: ShipmentMediaType;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_PACKAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_RECEIVER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);
}

function toMedia(row: {
  id: string;
  shipment_id: string;
  media_type: string;
  file_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  created_at: string | Date;
}): ShipmentMedia {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    mediaType: row.media_type as ShipmentMediaType,
    fileUrl: row.file_url,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export function validateShipmentMedia(
  file: File,
  mediaType: ShipmentMediaType,
) {
  if (!file || file.size <= 0) {
    return "The uploaded file is empty.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Each uploaded file must be 10 MB or smaller.";
  }

  const allowed =
    mediaType === "receiver_photo"
      ? ALLOWED_RECEIVER_TYPES
      : ALLOWED_PACKAGE_TYPES;

  if (!allowed.has(file.type)) {
    return mediaType === "receiver_photo"
      ? "Receiver photos must be JPG, PNG, or WebP images."
      : "Package files must be JPG, PNG, WebP images, or PDF documents.";
  }

  return null;
}

export async function saveShipmentMedia(input: {
  shipmentId: string;
  mediaType: ShipmentMediaType;
  file: File;
}) {
  const validationError = validateShipmentMedia(
    input.file,
    input.mediaType,
  );

  if (validationError) {
    throw new Error(validationError);
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());

  const shipmentDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "shipments",
    input.shipmentId,
  );

  await mkdir(shipmentDirectory, {
    recursive: true,
  });

  const extension =
    extensionForMimeType(input.file.type) ||
    path.extname(input.file.name) ||
    "";

  const storedName = `${randomUUID()}${extension}`;
  const diskPath = path.join(shipmentDirectory, storedName);

  await writeFile(diskPath, buffer);

  const safeOriginalName =
    sanitizeFilename(input.file.name) || storedName;

  const fileUrl =
    `/uploads/shipments/${input.shipmentId}/${storedName}`;

  try {
    const rows = await sql`
      INSERT INTO shipment_media (
        shipment_id,
        media_type,
        file_url,
        original_filename,
        mime_type,
        file_size
      )
      VALUES (
        ${input.shipmentId},
        ${input.mediaType},
        ${fileUrl},
        ${safeOriginalName},
        ${input.file.type},
        ${input.file.size}
      )
      RETURNING
        id,
        shipment_id,
        media_type,
        file_url,
        original_filename,
        mime_type,
        file_size,
        created_at
    `;

    return toMedia(rows[0] as Parameters<typeof toMedia>[0]);
  } catch (error) {
    await unlink(diskPath).catch(() => undefined);
    throw error;
  }
}

export async function getShipmentMedia(shipmentId: string) {
  const rows = await sql`
    SELECT
      id,
      shipment_id,
      media_type,
      file_url,
      original_filename,
      mime_type,
      file_size,
      created_at
    FROM shipment_media
    WHERE shipment_id = ${shipmentId}
    ORDER BY created_at ASC
  `;

  return rows.map((row) =>
    toMedia(row as Parameters<typeof toMedia>[0]),
  );
}
