import { sql } from "@/lib/db";

type EmailRecipient = {
  email: string;
  name?: string | null;
};

type NotificationEmail = {
  recipient: EmailRecipient;
  subject: string;
  title: string;
  message: string;
  trackingNumber?: string | null;
  actionUrl?: string | null;
};

function getAppUrl() {
  return (
    process.env.PARCELFLOW_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getShipmentUrl(shipmentId: string) {
  return `${getAppUrl()}/dashboard/shipments/${encodeURIComponent(shipmentId)}`;
}

export async function sendNotificationEmail(
  input: NotificationEmail,
): Promise<void> {
  const trackingSection = input.trackingNumber
    ? `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="margin:24px 0;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;"
      >
        <tr>
          <td style="padding:18px 20px;">
            <div style="font-size:12px;color:#667085;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
              Tracking number
            </div>
            <div style="margin-top:6px;font-size:18px;color:#172033;font-weight:700;letter-spacing:.03em;">
              ${escapeHtml(input.trackingNumber)}
            </div>
          </td>
        </tr>
      </table>
    `
    : "";

  const actionButton = input.actionUrl
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
        <tr>
          <td style="border-radius:10px;background:#111827;">
            <a
              href="${escapeHtml(input.actionUrl)}"
              style="display:inline-block;padding:14px 22px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;"
            >
              View shipment
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const recipientName = input.recipient.name
    ? ` ${input.recipient.name}`
    : "";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${escapeHtml(input.subject)}</title>
      </head>

      <body style="margin:0;padding:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#172033;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f2f4f7;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="max-width:620px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;"
              >
                <tr>
                  <td style="padding:26px 28px;background:#111827;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td
                          width="48"
                          height="48"
                          align="center"
                          valign="middle"
                          style="width:48px;height:48px;background:#ffffff;border-radius:12px;color:#111827;font-size:17px;font-weight:800;letter-spacing:-.05em;"
                        >
                          PF
                        </td>
                        <td style="padding-left:14px;">
                          <div style="font-size:18px;line-height:1.2;color:#ffffff;font-weight:800;">
                            ParcelFlow
                          </div>
                          <div style="margin-top:4px;font-size:12px;line-height:1.2;color:#cbd5e1;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">
                            Global Logistics
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 28px 30px;">
                    <div style="font-size:12px;color:#667085;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">
                      ParcelFlow notification
                    </div>

                    <h1 style="margin:12px 0 16px;font-size:28px;line-height:1.2;color:#111827;font-weight:800;">
                      ${escapeHtml(input.title)}
                    </h1>

                    <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#344054;">
                      Hello${escapeHtml(recipientName)},
                    </p>

                    <p style="margin:0;font-size:16px;line-height:1.7;color:#344054;">
                      ${escapeHtml(input.message)}
                    </p>

                    ${trackingSection}
                    ${actionButton}
                  </td>
                </tr>

                <tr>
                  <td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#667085;">
                      This is an automated notification from ParcelFlow · Global Logistics.
                      Sign in to your ParcelFlow account to view your shipment and continue
                      the conversation.
                    </p>

                    <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:#98a2b3;">
                      Please do not reply directly to this automated email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    await sql`
      INSERT INTO notification_email_outbox (
        recipient_email,
        recipient_name,
        subject,
        html_body,
        status,
        attempts
      )
      VALUES (
        ${input.recipient.email},
        ${input.recipient.name ?? null},
        ${input.subject},
        ${html},
        'pending',
        0
      )
    `;
  } catch (error) {
    console.error(
      "[ParcelFlow email] Failed to queue email notification.",
      error,
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
