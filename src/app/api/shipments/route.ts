import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { createShipment, getShipments } from "@/lib/shipment-store";
import { sql } from "@/lib/db";

import { sendNotificationEmail, getShipmentUrl } from "@/lib/email-service";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function GET() {
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

    const shipments = await getShipments(customer.id);

    return NextResponse.json({
      success: true,
      shipments,
    });
  } catch (error) {
    console.error("Get shipments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load shipments.",
      },
      { status: 500 },
    );
  }
}

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

    const body = await request.json();
    const sender = body.sender ?? {};
    const recipient = body.recipient ?? {};
    const packageDetails = body.package ?? {};

    const service: "standard" | "express" | "business" =
      text(body.service) === "express"
        ? "express"
        : text(body.service) === "business"
          ? "business"
          : "standard";

    const shipmentType: "domestic" | "international" =
      text(body.shipmentType) === "domestic"
        ? "domestic"
        : "international";

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
      customerId: customer.id,
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
        description:
          text(packageDetails.description) || "General package",
        weightKg,
      },

      estimatedDelivery: estimatedDelivery.toISOString(),
    });

    const activeAdmins = await sql`
      SELECT
        id,
        email,
        first_name,
        last_name
      FROM admins
      WHERE status = 'active'
    `;

    const notificationTitle = "New shipment received";
    const notificationMessage =
      `Shipment ${shipment.trackingNumber} has been submitted and is awaiting review.`;

    for (const admin of activeAdmins) {
      await sql`
        INSERT INTO notifications (
          admin_id,
          shipment_id,
          type,
          title,
          message
        )
        VALUES (
          ${admin.id},
          ${shipment.id},
          'new_shipment',
          ${notificationTitle},
          ${notificationMessage}
        )
      `;

      await sendNotificationEmail({
        recipient: {
          email: admin.email,
          name:
            `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() ||
            undefined,
        },
        subject: `${notificationTitle} · ${shipment.trackingNumber}`,
        title: notificationTitle,
        message: notificationMessage,
        trackingNumber: shipment.trackingNumber,
        actionUrl: getShipmentUrl(shipment.id),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully.",
        shipment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create shipment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create shipment.",
      },
      { status: 500 },
    );
  }
}
