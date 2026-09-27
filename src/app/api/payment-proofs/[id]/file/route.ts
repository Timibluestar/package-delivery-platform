import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const rows = await sql`
      SELECT
        id,
        customer_id,
        file_data,
        original_filename,
        mime_type
      FROM payment_submissions
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Payment proof not found." },
        { status: 404 },
      );
    }

    const proof = rows[0];

    let authorized = false;

    const customer = await getCurrentCustomer();

    if (customer && customer.id === proof.customer_id) {
      authorized = true;
    }

    if (!authorized) {
      try {
        await requireAdmin();
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: "Forbidden." },
        { status: 403 },
      );
    }

    if (!proof.file_data) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment proof file is not available.",
        },
        { status: 404 },
      );
    }

    const fileBuffer = Buffer.from(proof.file_data);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          proof.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${String(
          proof.original_filename,
        ).replace(/["\\\r\n]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("Payment proof file access error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to access payment proof.",
      },
      { status: 404 },
    );
  }
}
