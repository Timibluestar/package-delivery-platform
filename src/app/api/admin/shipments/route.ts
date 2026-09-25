import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

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
        s.admin_processed_at,
        s.created_at,
        s.updated_at,

        c.id AS customer_id,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        c.phone AS customer_phone,

        sa.city AS sender_city,
        sa.country AS sender_country,

        ra.city AS recipient_city,
        ra.country AS recipient_country

      FROM shipments s

      INNER JOIN customers c
        ON c.id = s.customer_id

      LEFT JOIN addresses sa
        ON sa.id = s.sender_address_id

      LEFT JOIN addresses ra
        ON ra.id = s.recipient_address_id

      ORDER BY
        CASE
          WHEN s.status = 'pending' THEN 0
          WHEN s.status = 'confirmed' THEN 1
          WHEN s.status = 'in_transit' THEN 2
          WHEN s.status = 'out_for_delivery' THEN 3
          WHEN s.status = 'delivered' THEN 4
          ELSE 5
        END,
        s.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      shipments: rows,
      count: rows.length,
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

    console.error("Admin shipment list error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load shipments.",
      },
      { status: 500 },
    );
  }
}
