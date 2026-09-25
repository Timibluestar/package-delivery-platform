import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

import { sendNotificationEmail, getShipmentUrl } from "@/lib/email-service";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type ShipmentStatus = (typeof VALID_STATUSES)[number];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isShipmentStatus(value: unknown): value is ShipmentStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(value as ShipmentStatus)
  );
}

async function getShipment(id: string) {
  const rows = await sql`
    SELECT
      s.id,
      s.tracking_number,
      s.shipment_type,
      s.service,
      s.status,
      s.package_description,
      s.package_weight,
      s.estimated_delivery,
      s.shipping_price,
      s.shipping_currency,
      s.price_disclosed_at,
      s.price_disclosed_by,
      s.admin_processed_at,
      s.admin_processed_by,
      s.created_at,
      s.updated_at,

      c.id AS customer_id,
      c.first_name AS customer_first_name,
      c.last_name AS customer_last_name,
      c.email AS customer_email,
      c.phone AS customer_phone,

      sa.id AS sender_address_id,
      sa.first_name AS sender_first_name,
      sa.last_name AS sender_last_name,
      sa.address_line1 AS sender_address_line1,
      sa.city AS sender_city,
      sa.state AS sender_state,
      sa.country AS sender_country,
      sa.phone AS sender_phone,

      ra.id AS recipient_address_id,
      ra.first_name AS recipient_first_name,
      ra.last_name AS recipient_last_name,
      ra.address_line1 AS recipient_address_line1,
      ra.city AS recipient_city,
      ra.state AS recipient_state,
      ra.country AS recipient_country,
      ra.phone AS recipient_phone

    FROM shipments s

    INNER JOIN customers c
      ON c.id = s.customer_id

    LEFT JOIN addresses sa
      ON sa.id = s.sender_address_id

    LEFT JOIN addresses ra
      ON ra.id = s.recipient_address_id

    WHERE s.id = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function getShipmentExtras(id: string) {
  const [events, media, messages] = await Promise.all([
    sql`
      SELECT
        id,
        status,
        title,
        description,
        location,
        created_at
      FROM shipment_events
      WHERE shipment_id = ${id}
      ORDER BY created_at ASC
    `,

    sql`
      SELECT
        id,
        media_type,
        file_url,
        original_filename,
        mime_type,
        file_size,
        created_at
      FROM shipment_media
      WHERE shipment_id = ${id}
      ORDER BY created_at ASC
    `,

    sql`
      SELECT
        m.id,
        m.sender_role,
        m.body,
        m.created_at,
        m.customer_id,
        m.admin_id,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        CONCAT(a.first_name, ' ', a.last_name) AS admin_name
      FROM shipment_messages m
      LEFT JOIN customers c
        ON c.id = m.customer_id
      LEFT JOIN admins a
        ON a.id = m.admin_id
      WHERE m.shipment_id = ${id}
      ORDER BY m.created_at ASC
    `,
  ]);

  return {
    events,
    media,
    messages,
  };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const shipmentId = text(id);

    if (!shipmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment ID is required.",
        },
        { status: 400 },
      );
    }

    const shipment = await getShipment(shipmentId);

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment not found.",
        },
        { status: 404 },
      );
    }

    const extras = await getShipmentExtras(shipmentId);

    return NextResponse.json({
      success: true,
      shipment: {
        ...shipment,
        events: extras.events,
        media: extras.media,
        messages: extras.messages,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_AUTHENTICATION_REQUIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 },
      );
    }

    console.error("Admin shipment detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load shipment.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await requireAdmin();

    const { id } = await context.params;
    const shipmentId = text(id);

    if (!shipmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment ID is required.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const requestedStatus =
      body.status === undefined ? undefined : body.status;

    const hasPrice =
      body.shippingPrice !== undefined &&
      body.shippingPrice !== null &&
      body.shippingPrice !== "";

    const disclosePrice =
      body.disclosePrice === true;

    const processShipment =
      body.processShipment === true;

    if (
      requestedStatus !== undefined &&
      !isShipmentStatus(requestedStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid shipment status.",
        },
        { status: 400 },
      );
    }

    let shippingPrice: number | null = null;

    if (hasPrice) {
      const parsedPrice = Number(body.shippingPrice);

      if (
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0 ||
        parsedPrice > 9999999999
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Enter a valid shipping price.",
          },
          { status: 400 },
        );
      }

      shippingPrice = Math.round(parsedPrice * 100) / 100;
    }

    if (disclosePrice && shippingPrice === null) {
      const existingPrice = await sql`
        SELECT shipping_price
        FROM shipments
        WHERE id = ${shipmentId}
        LIMIT 1
      `;

      if (
        existingPrice.length === 0 ||
        existingPrice[0].shipping_price === null
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A shipping price must be set before it can be disclosed.",
          },
          { status: 400 },
        );
      }
    }

    const existingRows = await sql`
      SELECT
        id,
        customer_id,
        status,
        shipping_price,
        shipping_currency,
        price_disclosed_at,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email
      FROM shipments s
      INNER JOIN customers c
        ON c.id = s.customer_id
      WHERE s.id = ${shipmentId}
      LIMIT 1
    `;

    const existing = existingRows[0];

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Shipment not found.",
        },
        { status: 404 },
      );
    }

    const nextStatus =
      requestedStatus ?? existing.status;

    const shouldDisclose =
      disclosePrice && !existing.price_disclosed_at;

    const nextPrice =
      shippingPrice !== null
        ? shippingPrice
        : existing.shipping_price;

    const shouldProcess =
      processShipment ||
      (existing.status === "pending" &&
        (shippingPrice !== null || requestedStatus === "confirmed"));

    const processedAt =
      shouldProcess && !existing.admin_processed_at
        ? new Date().toISOString()
        : undefined;

    await sql`
      UPDATE shipments
      SET
        status = ${nextStatus},
        shipping_price = ${nextPrice},
        price_disclosed_at =
          CASE
            WHEN ${shouldDisclose}
              THEN NOW()
            ELSE price_disclosed_at
          END,
        price_disclosed_by =
          CASE
            WHEN ${shouldDisclose}
              THEN ${admin.id}
            ELSE price_disclosed_by
          END,
        admin_processed_at =
          CASE
            WHEN ${processedAt !== undefined}
              THEN ${processedAt}
            ELSE admin_processed_at
          END,
        admin_processed_by =
          CASE
            WHEN ${processedAt !== undefined}
              THEN ${admin.id}
            ELSE admin_processed_by
          END,
        updated_at = NOW()
      WHERE id = ${shipmentId}
    `;

    if (
      requestedStatus !== undefined &&
      requestedStatus !== existing.status
    ) {
      await sql`
        INSERT INTO shipment_events (
          shipment_id,
          status,
          title,
          description
        )
        VALUES (
          ${shipmentId},
          ${nextStatus},
          ${`Shipment status updated to ${nextStatus.replaceAll("_", " ")}`},
          ${`Status updated by ${admin.name}.`}
        )
      `;

      const statusTitle = "Shipment status updated";
      const statusMessage =
        `Your shipment status is now ${nextStatus.replaceAll("_", " ")}.`;

      await sql`
        INSERT INTO notifications (
          customer_id,
          shipment_id,
          type,
          title,
          message
        )
        VALUES (
          ${existing.customer_id},
          ${shipmentId},
          'shipment_status_updated',
          ${statusTitle},
          ${statusMessage}
        )
      `;

      await sendNotificationEmail({
        recipient: {
          email: existing.customer_email,
          name: `${existing.customer_first_name} ${existing.customer_last_name}`,
        },
        subject: `${statusTitle} · ${existing.tracking_number}`,
        title: statusTitle,
        message: statusMessage,
        trackingNumber: existing.tracking_number,
        actionUrl: getShipmentUrl(shipmentId),
      });
    }

    if (shouldDisclose) {
      await sql`
        INSERT INTO shipment_events (
          shipment_id,
          status,
          title,
          description
        )
        VALUES (
          ${shipmentId},
          ${nextStatus},
          'Shipping price disclosed',
          ${`Shipping price disclosed by ${admin.name}.`}
        )
      `;

      const priceTitle = "Shipping price disclosed";
      const priceMessage =
        `Your shipping price is ${nextPrice} ${existing.shipping_currency}.`;

      await sql`
        INSERT INTO notifications (
          customer_id,
          shipment_id,
          type,
          title,
          message
        )
        VALUES (
          ${existing.customer_id},
          ${shipmentId},
          'shipment_price_disclosed',
          ${priceTitle},
          ${priceMessage}
        )
      `;

      await sendNotificationEmail({
        recipient: {
          email: existing.customer_email,
          name: `${existing.customer_first_name} ${existing.customer_last_name}`,
        },
        subject: `${priceTitle} · ${existing.tracking_number}`,
        title: priceTitle,
        message: priceMessage,
        trackingNumber: existing.tracking_number,
        actionUrl: getShipmentUrl(shipmentId),
      });
    }

    if (processedAt !== undefined) {
      await sql`
        INSERT INTO notifications (
          admin_id,
          shipment_id,
          type,
          title,
          message
        )
        SELECT
          ${admin.id},
          ${shipmentId},
          'shipment_processed',
          'Shipment processed',
          ${`Shipment ${existing.tracking_number} has been processed by ${admin.name}.`}
        WHERE NOT EXISTS (
          SELECT 1
          FROM notifications
          WHERE admin_id = ${admin.id}
            AND shipment_id = ${shipmentId}
            AND type = 'shipment_processed'
        )
      `;

      const processedTitle = "Shipment processed";
      const processedMessage =
        `Your shipment ${existing.tracking_number} has been processed and is now being handled by ParcelFlow.`;

      await sql`
        INSERT INTO notifications (
          customer_id,
          shipment_id,
          type,
          title,
          message
        )
        VALUES (
          ${existing.customer_id},
          ${shipmentId},
          'shipment_processed',
          ${processedTitle},
          ${processedMessage}
        )
      `;

      await sendNotificationEmail({
        recipient: {
          email: existing.customer_email,
          name: `${existing.customer_first_name} ${existing.customer_last_name}`,
        },
        subject: `${processedTitle} · ${existing.tracking_number}`,
        title: processedTitle,
        message: processedMessage,
        trackingNumber: existing.tracking_number,
        actionUrl: getShipmentUrl(shipmentId),
      });
    }

    const updated = await getShipment(shipmentId);

    if (!updated) {
      throw new Error("Updated shipment could not be loaded.");
    }

    const extras = await getShipmentExtras(shipmentId);

    return NextResponse.json({
      success: true,
      message: shouldDisclose
        ? "Shipment updated and price disclosed to the customer."
        : "Shipment updated successfully.",
      shipment: {
        ...updated,
        events: extras.events,
        media: extras.media,
        messages: extras.messages,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADMIN_AUTHENTICATION_REQUIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator authentication required.",
        },
        { status: 401 },
      );
    }

    console.error("Admin shipment update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update shipment.",
      },
      { status: 500 },
    );
  }
}
