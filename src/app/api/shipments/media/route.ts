import { NextRequest, NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/auth";
import {
  saveShipmentMedia,
  type ShipmentMediaType,
} from "@/lib/shipment-media";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_TYPES = new Set<ShipmentMediaType>([
  "package_item",
  "package_photo",
  "receiver_photo",
]);

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const shipmentId = String(
      formData.get("shipmentId") ?? "",
    ).trim();

    const mediaTypeValue = String(
      formData.get("mediaType") ?? "package_item",
    ).trim();

    const file = formData.get("file");

    if (!shipmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment ID is required.",
        },
        { status: 400 },
      );
    }

    if (!MEDIA_TYPES.has(mediaTypeValue as ShipmentMediaType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shipment media type.",
        },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a file to upload.",
        },
        { status: 400 },
      );
    }

    const shipmentRows = await sql`
      SELECT id, status
      FROM shipments
      WHERE id = ${shipmentId}
        AND customer_id = ${customer.id}
      LIMIT 1
    `;

    if (shipmentRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment not found.",
        },
        { status: 404 },
      );
    }

    const shipment = shipmentRows[0] as {
      id: string;
      status: string;
    };

    if (
      mediaTypeValue === "receiver_photo" &&
      shipment.status !== "delivered"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A receiver photo can only be added after the shipment is marked delivered.",
        },
        { status: 409 },
      );
    }

    const media = await saveShipmentMedia({
      shipmentId,
      mediaType: mediaTypeValue as ShipmentMediaType,
      file,
    });

    return NextResponse.json({
      success: true,
      message: "Shipment media uploaded successfully.",
      media,
    });
  } catch (error) {
    console.error("Shipment media upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to upload shipment media.",
      },
      { status: 500 },
    );
  }
}
