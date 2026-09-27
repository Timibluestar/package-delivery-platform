import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await request.json();

    const status = String(body?.status ?? "").trim();
    const rejectionReason = String(body?.rejectionReason ?? "").trim();

    if (status !== "confirmed" && status !== "rejected") {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be confirmed or rejected.",
        },
        { status: 400 },
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          message: "A rejection reason is required.",
        },
        { status: 400 },
      );
    }

    const existingRows = await sql`
      SELECT
        p.id,
        p.shipment_id,
        p.customer_id,
        p.status,
        s.tracking_number
      FROM payment_submissions p
      INNER JOIN shipments s ON s.id = p.shipment_id
      WHERE p.id = ${id}
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment proof not found.",
        },
        { status: 404 },
      );
    }

    const existing = existingRows[0];

    if (existing.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: `Payment proof has already been ${existing.status}.`,
        },
        { status: 409 },
      );
    }

    const updatedRows = await sql`
      UPDATE payment_submissions
      SET
        status = ${status},
        reviewed_by_admin_id = ${admin.id},
        reviewed_at = NOW(),
        rejection_reason = ${
          status === "rejected" ? rejectionReason : null
        },
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id,
        shipment_id,
        customer_id,
        status,
        reviewed_by_admin_id,
        reviewed_at,
        rejection_reason,
        updated_at
    `;

    const updated = updatedRows[0];

    const notificationType =
      status === "confirmed"
        ? "payment_confirmed"
        : "payment_proof_rejected";

    const title =
      status === "confirmed"
        ? "Payment confirmed"
        : "Payment proof rejected";

    const message =
      status === "confirmed"
        ? `Your payment proof for shipment ${existing.tracking_number} has been confirmed.`
        : `Your payment proof for shipment ${existing.tracking_number} was rejected. Reason: ${rejectionReason}`;

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
        ${existing.shipment_id},
        ${notificationType},
        ${title},
        ${message}
      )
    `;

    return NextResponse.json({
      success: true,
      message: title,
      paymentSubmission: updated,
    });
  } catch (error) {
    console.error("Admin payment proof review error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to review payment proof.",
      },
      { status: 500 },
    );
  }
}
