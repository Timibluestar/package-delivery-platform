import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { readFile } from "node:fs/promises";
import path from "node:path";

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
        file_url,
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

    const relativePath = String(proof.file_url)
      .replace(/^\/+/, "")
      .replace(/\.\./g, "");

    const filePath = path.join(process.cwd(), "public", relativePath);

    const publicRoot = path.resolve(process.cwd(), "public");
    const resolvedFilePath = path.resolve(filePath);

    if (
      resolvedFilePath !== publicRoot &&
      !resolvedFilePath.startsWith(`${publicRoot}${path.sep}`)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid file path." },
        { status: 400 },
      );
    }

    const fileBuffer = await readFile(resolvedFilePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": proof.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${String(
          proof.original_filename,
        ).replace(/["\\\r\n]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Payment proof file access error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to access payment proof." },
      { status: 404 },
    );
  }
}
