import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

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

    const rows = await sql`
      SELECT
        n.id,
        n.shipment_id,
        n.type,
        n.title,
        n.message,
        n.read_at,
        n.created_at,
        s.tracking_number
      FROM notifications n
      LEFT JOIN shipments s
        ON s.id = n.shipment_id
      WHERE n.customer_id = ${customer.id}
      ORDER BY n.created_at DESC
      LIMIT 100
    `;

    const unread = rows.filter((row) => row.read_at === null).length;

    return NextResponse.json({
      success: true,
      notifications: rows,
      unread,
    });
  } catch (error) {
    console.error("Customer notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load notifications.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const notificationId =
      typeof body.notificationId === "string"
        ? body.notificationId.trim()
        : "";

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required.",
        },
        { status: 400 },
      );
    }

    const updated = await sql`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${notificationId}
        AND customer_id = ${customer.id}
        AND read_at IS NULL
      RETURNING id, read_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found or already read.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      notification: updated[0],
    });
  } catch (error) {
    console.error("Customer notification update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update notification.",
      },
      { status: 500 },
    );
  }
}
