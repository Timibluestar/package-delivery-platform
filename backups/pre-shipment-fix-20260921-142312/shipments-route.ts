import { NextRequest, NextResponse } from "next/server";
import { createShipment } from "@/lib/shipment-store";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function GET() {
  const { getShipments } = await import("@/lib/shipment-store");

  const shipments = await getShipments();

  return NextResponse.json({
    success: true,
    shipments,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const sender = body.sender ?? {};
    const recipient = body.recipient ?? {};
    const packageDetails = body.package ?? {};

    const service = text(body.service) || "standard";
    const shipmentType = text(body.shipmentType) || "international";

    if (!["standard", "express", "business"].includes(service)) {
      return NextResponse.json(
        { success: false, message: "Invalid shipping service." },
        { status: 400 },
      );
    }

    if (!["domestic", "international"].includes(shipmentType)) {
      return NextResponse.json(
        { success: false, message: "Invalid shipment type." },
        { status: 400 },
      );
    }

    const requiredSender = [
      sender.name,
      sender.email,
      sender.phone,
      sender.address,
      sender.city,
      sender.country,
    ];

    const requiredRecipient = [
      recipient.name,
      recipient.email,
      recipient.phone,
      recipient.address,
      recipient.city,
      recipient.country,
    ];

    if (
      requiredSender.some((value) => !text(value)) ||
      requiredRecipient.some((value) => !text(value))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all sender and recipient fields.",
        },
        { status: 400 },
      );
    }

    const weightKg = positiveNumber(packageDetails.weightKg);

    if (!weightKg) {
      return NextResponse.json(
        {
          success: false,
          message: "Package weight must be greater than zero.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const estimatedDelivery = new Date(now);

    estimatedDelivery.setDate(
      estimatedDelivery.getDate() +
        (service === "express" ? 3 : service === "business" ? 5 : 7),
    );

    const shipment = await createShipment({
      service,
      shipmentType,

      status: "pending",

      sender: {
        name: text(sender.name),
        email: text(sender.email),
        phone: text(sender.phone),
        address: text(sender.address),
        city: text(sender.city),
        country: text(sender.country),
      },

      recipient: {
        name: text(recipient.name),
        email: text(recipient.email),
        phone: text(recipient.phone),
        address: text(recipient.address),
        city: text(recipient.city),
        country: text(recipient.country),
      },

      package: {
        description: text(packageDetails.description) || "General package",
        weightKg,
        lengthCm: positiveNumber(packageDetails.lengthCm) ?? undefined,
        widthCm: positiveNumber(packageDetails.widthCm) ?? undefined,
        heightCm: positiveNumber(packageDetails.heightCm) ?? undefined,
      },

      estimatedDelivery: estimatedDelivery.toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully.",
        shipment,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to create shipment.",
      },
      { status: 500 },
    );
  }
}
