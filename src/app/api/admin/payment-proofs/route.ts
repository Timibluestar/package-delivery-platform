import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const rows = await sql`
      SELECT
        p.id,
        p.shipment_id,
        p.customer_id,
        p.file_url,
        p.original_filename,
        p.mime_type,
        p.file_size,
        p.note,
        p.status,
        p.reviewed_by_admin_id,
        p.reviewed_at,
        p.rejection_reason,
        p.created_at,
        p.updated_at,
        s.tracking_number,
        c.first_name,
        c.last_name,
        c.email
      FROM payment_submissions p
      INNER JOIN shipments s ON s.id = p.shipment_id
      INNER JOIN customers c ON c.id = p.customer_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      success: true,
      paymentSubmissions: rows,
    });
  } catch (error) {
    console.error("Admin payment proof list error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load payment proofs.",
      },
      { status: 500 },
    );
  }
}
