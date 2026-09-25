import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    const updated = await sql`
      UPDATE notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = ${id}
        AND admin_id = ${admin.id}
      RETURNING
        id,
        read_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found.",
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
