import { NextRequest, NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/auth";
import { sql } from "@/lib/db";
import { saveShipmentMedia } from "@/lib/shipment-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const receiverPhoto = formData.get("receiverPhoto");

    if (!shipmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment ID is required.",
        },
        { status: 400 },
      );
    }

    if (!(receiverPhoto instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Receiver photo is required.",
        },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT id, status
      FROM shipments
      WHERE id = ${shipmentId}
        AND customer_id = ${customer.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment not found.",
        },
        { status: 404 },
      );
    }

    const shipment = rows[0] as {
      id: string;
      status: string;
    };

    if (shipment.status !== "delivered") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Delivery proof can only be uploaded for a delivered shipment.",
        },
        { status: 409 },
      );
    }

    const media = await saveShipmentMedia({
      shipmentId,
      mediaType: "receiver_photo",
      file: receiverPhoto,
    });

    return NextResponse.json({
      success: true,
      message: "Receiver photo added successfully.",
      media,
    });
  } catch (error) {
    console.error("Delivery media error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to save delivery proof.",
      },
      { status: 500 },
    );
  }
}
