import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;
const LOCK_TIMEOUT_MINUTES = 30;

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

function retryDelayMinutes(attempt: number) {
  return Math.min(60, 2 ** Math.max(0, attempt - 1));
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, message: "Email worker is not configured." },
        { status: 500 },
      );
    }

    const authorizationHeader = request.headers.get("authorization");
    const bearerSecret = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice(7).trim()
      : "";

    const querySecret =
      new URL(request.url).searchParams.get("secret")?.trim() || "";

    if (bearerSecret !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!databaseUrl || !apiKey) {
      return NextResponse.json(
        { success: false, message: "Email worker is not configured." },
        { status: 500 },
      );
    }

    const sql = neon(databaseUrl);
    const resend = new Resend(apiKey);

    // Release locks older than the configured lock timeout.
    await sql.query(
      `UPDATE notification_email_outbox
       SET locked_at = NULL
       WHERE locked_at IS NOT NULL
         AND locked_at < NOW() - INTERVAL '${LOCK_TIMEOUT_MINUTES} minutes'`,
    );

    // Claim a batch of available messages.
    const rows = await sql.query(
      `WITH candidates AS (
         SELECT id
         FROM notification_email_outbox
         WHERE status IN ('pending', 'failed')
           AND attempts < ${MAX_ATTEMPTS}
           AND next_attempt_at <= NOW()
           AND locked_at IS NULL
         ORDER BY created_at ASC
         LIMIT ${BATCH_SIZE}
         FOR UPDATE SKIP LOCKED
       )
       UPDATE notification_email_outbox AS o
       SET locked_at = NOW()
       FROM candidates
       WHERE o.id = candidates.id
       RETURNING
         o.id,
         o.recipient_email,
         o.recipient_name,
         o.subject,
         o.html_body,
         o.attempts`,
    );

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      const attemptNumber = Number(row.attempts) + 1;

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
            last_error = NULL,
            next_attempt_at = NOW(),
            locked_at = NULL
          WHERE id = ${row.id}
        `;

        sent += 1;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown email delivery error.";

        const permanentlyFailed = attemptNumber >= MAX_ATTEMPTS;
        const delayMinutes = retryDelayMinutes(attemptNumber);

        if (permanentlyFailed) {
          await sql`
            UPDATE notification_email_outbox
            SET
              status = 'failed',
              attempts = attempts + 1,
              last_error = ${message},
              next_attempt_at = NOW(),
              locked_at = NULL
            WHERE id = ${row.id}
          `;
        } else {
          const nextAttemptAt = new Date(
            Date.now() + delayMinutes * 60 * 1000,
          );

          await sql`
            UPDATE notification_email_outbox
            SET
              status = 'pending',
              attempts = attempts + 1,
              last_error = ${message},
              next_attempt_at = ${nextAttemptAt},
              locked_at = NULL
            WHERE id = ${row.id}
          `;
        }

        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      processed: rows.length,
      sent,
      failed,
      maxAttempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error("Email worker error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Email worker failed.",
      },
      { status: 500 },
    );
  }
}
