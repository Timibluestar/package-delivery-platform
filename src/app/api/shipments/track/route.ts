import { NextRequest, NextResponse } from "next/server";
import { findShipment } from "@/lib/shipment-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const trackingNumber =
      request.nextUrl.searchParams.get("trackingNumber");

    if (!trackingNumber?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a tracking number.",
        },
        { status: 400 },
      );
    }

    const shipment = await findShipment(trackingNumber);

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          message: "No shipment was found for that tracking number.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      shipment,
    });
  } catch (error) {
    console.error("Track shipment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to track shipment.",
      },
      { status: 500 },
    );
  }
}
