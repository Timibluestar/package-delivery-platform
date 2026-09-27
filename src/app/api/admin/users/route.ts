import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const [summary, customers] = await Promise.all([
      sql`
        SELECT
          COUNT(DISTINCT c.id)::int AS total_users,
          COUNT(DISTINCT c.id) FILTER (
            WHERE COALESCE(c.status, 'active') = 'active'
          )::int AS active_users,
          COUNT(DISTINCT c.id) FILTER (
            WHERE c.created_at >= date_trunc('month', NOW())
          )::int AS new_this_month,
          COUNT(DISTINCT s.customer_id)::int AS users_with_shipments
        FROM customers c
        LEFT JOIN shipments s
          ON s.customer_id = c.id
      `,
      sql`
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.status,
          c.created_at,
          COUNT(s.id)::int AS shipment_count,
          COUNT(s.id) FILTER (
            WHERE s.status IN ('pending', 'confirmed')
          )::int AS pending_shipments,
          COUNT(s.id) FILTER (
            WHERE s.status IN ('in_transit', 'out_for_delivery')
          )::int AS active_shipments,
          COUNT(s.id) FILTER (
            WHERE s.status = 'delivered'
          )::int AS delivered_shipments,
          COUNT(s.id) FILTER (
            WHERE s.status = 'cancelled'
          )::int AS cancelled_shipments
        FROM customers c
        LEFT JOIN shipments s
          ON s.customer_id = c.id
        GROUP BY
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.status,
          c.created_at
        ORDER BY c.created_at DESC
        LIMIT 100
      `,
    ]);

    return NextResponse.json({
      success: true,
      summary: summary[0],
      customers,
    });
  } catch (error) {
    console.error("Admin users query error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load users.",
      },
      { status: 500 },
    );
  }
}
