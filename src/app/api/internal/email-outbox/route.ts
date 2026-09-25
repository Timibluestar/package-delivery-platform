import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

function getFromAddress() {
  return (
    process.env.PARCELFLOW_EMAIL_FROM ??
    "ParcelFlow <notifications@parcelflow.com>"
  );
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");
    return NextResponse.json(
      { success: false, message: "Email worker is not configured." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const databaseUrl = process.env.DATABASE_URL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!databaseUrl || !apiKey) {
    console.error("Email worker environment is incomplete.");
    return NextResponse.json(
      { success: false, message: "Email worker is not configured." },
      { status: 500 },
    );
  }

  const sql = neon(databaseUrl);
  const resend = new Resend(apiKey);

  const rows = await sql`
    SELECT
      id,
      recipient_email,
      recipient_name,
      subject,
      html_body,
      attempts
    FROM notification_email_outbox
    WHERE status IN ('pending', 'failed')
      AND attempts < 5
    ORDER BY created_at ASC
    LIMIT 25
  `;

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await resend.emails.send({
        from: getFromAddress(),
        to: row.recipient_email,
        subject: row.subject,
        html:
          row.html_body ??
          `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:32px;color:#172033;">
              <div style="padding:24px;background:#111827;border-radius:14px;color:#ffffff;">
                <div style="font-size:20px;font-weight:800;">ParcelFlow</div>
                <div style="margin-top:5px;font-size:12px;color:#cbd5e1;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                  Global Logistics
                </div>
              </div>

              <div style="padding:28px 4px;">
                <h1 style="font-size:24px;color:#111827;">${escapeHtml(row.subject)}</h1>
                <p style="font-size:15px;line-height:1.7;color:#344054;">
                  Hello${row.recipient_name ? ` ${escapeHtml(row.recipient_name)}` : ""},
                </p>
                <p style="font-size:14px;line-height:1.7;color:#667085;">
                  You have a new ParcelFlow notification. Sign in to your ParcelFlow account
                  to view the latest shipment information.
                </p>
              </div>
            </div>
          `,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await sql`
        UPDATE notification_email_outbox
        SET
          status = 'sent',
          provider_message_id = ${result.data?.id ?? null},
          attempts = attempts + 1,
          sent_at = NOW(),
          last_error = NULL
        WHERE id = ${row.id}
      `;

      sent += 1;
      console.log(`SENT: ${row.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown email delivery error.";

      await sql`
        UPDATE notification_email_outbox
        SET
          status = 'failed',
          attempts = attempts + 1,
          last_error = ${message}
        WHERE id = ${row.id}
      `;

      failed += 1;
      console.error(`FAILED: ${row.id}: ${message}`);
    }
  }

  return NextResponse.json({
    success: true,
    processed: rows.length,
    sent,
    failed,
  });
}
