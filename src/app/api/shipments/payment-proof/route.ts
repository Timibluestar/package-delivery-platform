import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { sql } from "@/lib/db";
import { validateShipmentMedia } from "@/lib/shipment-media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const customer = await getCurrentCustomer();

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const shipmentId = String(formData.get("shipmentId") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const file = formData.get("file");

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, message: "Shipment ID is required." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select a payment proof file." },
        { status: 400 },
      );
    }

    const validationError = validateShipmentMedia(file, "package_item");

    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 },
      );
    }

    const shipmentRows = await sql`
      SELECT
        id,
        tracking_number,
        customer_id
      FROM shipments
      WHERE id = ${shipmentId}
        AND customer_id = ${customer.id}
      LIMIT 1
    `;

    if (shipmentRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Shipment not found." },
        { status: 404 },
      );
    }

    const shipment = shipmentRows[0];

    const pendingRows = await sql`
      SELECT id
      FROM payment_submissions
      WHERE shipment_id = ${shipment.id}
        AND customer_id = ${customer.id}
        AND status = 'pending'
      LIMIT 1
    `;

    if (pendingRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "A payment proof is already awaiting admin review.",
        },
        { status: 409 },
      );
    }

    const previousRejectedRows = await sql`
      SELECT id
      FROM payment_submissions
      WHERE shipment_id = ${shipment.id}
        AND customer_id = ${customer.id}
        AND status = 'rejected'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const isResubmission = previousRejectedRows.length > 0;

    const fileData = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const paymentRows = await sql`
      INSERT INTO payment_submissions (
        shipment_id,
        customer_id,
        file_url,
        original_filename,
        mime_type,
        file_size,
        file_data,
        storage_type,
        note,
        status
      )
      VALUES (
        ${shipment.id},
        ${customer.id},
        '',
        ${file.name},
        ${mimeType},
        ${file.size},
        ${fileData},
        'database',
        ${note || null},
        'pending'
      )
      RETURNING
        id,
        shipment_id,
        customer_id,
        file_url,
        original_filename,
        mime_type,
        file_size,
        note,
        status,
        created_at
    `;

    const paymentSubmission = paymentRows[0];

    const privateFileUrl = `/api/payment-proofs/${paymentSubmission.id}/file`;

    await sql`
      UPDATE payment_submissions
      SET
        file_url = ${privateFileUrl},
        updated_at = NOW()
      WHERE id = ${paymentSubmission.id}
    `;

    paymentSubmission.file_url = privateFileUrl;

    try {
      const activeAdmins = await sql`
        SELECT id
        FROM admins
        WHERE status = 'active'
      `;

      const notificationTitle = isResubmission
        ? "Payment proof resubmitted"
        : "Payment proof submitted";

      const notificationMessage = isResubmission
        ? `Customer ${customer.email} resubmitted payment proof for shipment ${shipment.tracking_number}.`
        : `Customer ${customer.email} submitted payment proof for shipment ${shipment.tracking_number}.`;

      const notificationType = isResubmission
        ? "payment_proof_resubmitted"
        : "payment_proof_submitted";

      for (const admin of activeAdmins) {
        await sql`
          INSERT INTO notifications (
            admin_id,
            shipment_id,
            type,
            title,
            message
          )
          VALUES (
            ${admin.id},
            ${shipment.id},
            ${notificationType},
            ${notificationTitle},
            ${notificationMessage}
          )
        `;
      }
    } catch (notificationError) {
      console.error(
        "Payment proof admin notification error:",
        notificationError,
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment proof submitted successfully.",
        paymentSubmission,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Payment proof upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit payment proof.",
      },
      { status: 500 },
    );
  }
}
