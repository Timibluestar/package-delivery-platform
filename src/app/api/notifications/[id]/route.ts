import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    const updated = await sql`
      UPDATE notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = ${id}
        AND customer_id = ${customer.id}
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
