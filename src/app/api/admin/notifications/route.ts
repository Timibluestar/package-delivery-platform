import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();

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
      WHERE n.admin_id = ${admin.id}
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    const unread = rows.filter((row) => row.read_at === null).length;

    return NextResponse.json({
      success: true,
      notifications: rows,
      unread,
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

    console.error("Admin notifications error:", error);

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
    const admin = await requireAdmin();

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
        AND admin_id = ${admin.id}
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

    console.error("Admin notification update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update notification.",
      },
      { status: 500 },
    );
  }
}
