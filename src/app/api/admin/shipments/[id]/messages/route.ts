import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

import { sendNotificationEmail, getShipmentUrl } from "@/lib/email-service";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const shipment = await sql`
    SELECT id
    FROM shipments
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!shipment.length) {
    return NextResponse.json(
      { error: "Shipment not found." },
      { status: 404 },
    );
  }

  const messages = await sql`
    SELECT
      m.id,
      m.shipment_id AS "shipmentId",
      m.sender_role AS "senderRole",
      m.body AS message,
      m.created_at AS "createdAt",
      CASE
        WHEN m.sender_role = 'admin'
          THEN CONCAT(a.first_name, ' ', a.last_name)
        ELSE CONCAT(c.first_name, ' ', c.last_name)
      END AS "senderName"
    FROM shipment_messages m
    LEFT JOIN admins a
      ON a.id = m.admin_id
    LEFT JOIN customers c
      ON c.id = m.customer_id
    WHERE m.shipment_id = ${id}
    ORDER BY m.created_at ASC
  `;

  return NextResponse.json({
    success: true,
    messages,
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const message =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Message must not exceed 5000 characters." },
      { status: 400 },
    );
  }

  const shipment = await sql`
    SELECT
      id,
      customer_id,
      tracking_number
    FROM shipments
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!shipment.length) {
    return NextResponse.json(
      { error: "Shipment not found." },
      { status: 404 },
    );
  }

  const shipmentRow = shipment[0];

  const inserted = await sql`
    INSERT INTO shipment_messages (
      shipment_id,
      admin_id,
      sender_role,
      body
    )
    VALUES (
      ${id},
      ${admin.id},
      'admin',
      ${message}
    )
    RETURNING
      id,
      shipment_id,
      sender_role,
      body,
      created_at
  `;

  const notificationTitle = "New message about your shipment";

  const customerRows = await sql`
    SELECT first_name, last_name, email
    FROM customers
    WHERE id = ${shipmentRow.customer_id}
    LIMIT 1
  `;

  await sql`
    INSERT INTO notifications (
      customer_id,
      shipment_id,
      type,
      title,
      message
    )
    VALUES (
      ${shipmentRow.customer_id},
      ${id},
      'admin_message',
      ${notificationTitle},
      ${message}
    )
  `;

  if (customerRows.length) {
    const customer = customerRows[0];

    await sendNotificationEmail({
      recipient: {
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
      },
      subject: `${notificationTitle} · ${shipmentRow.tracking_number}`,
      title: notificationTitle,
      message,
      trackingNumber: shipmentRow.tracking_number,
      actionUrl: getShipmentUrl(id),
    });
  }

  return NextResponse.json(
    {
      success: true,
      message: inserted[0],
      notificationCreated: true,
      trackingNumber: shipmentRow.tracking_number,
    },
    { status: 201 },
  );
}
