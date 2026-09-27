import { NextResponse } from "next/server";
import { createAdminPasswordResetToken } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter your administrator email address.",
        },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT
        id,
        email,
        first_name,
        last_name
      FROM admins
      WHERE LOWER(email) = ${email}
        AND status = 'active'
      LIMIT 1
    `;

    const admin = rows[0] as
      | {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
        }
      | undefined;

    /*
     * Keep the public response generic so the endpoint does not
     * disclose whether an administrator account exists.
     */
    if (!admin) {
      return NextResponse.json({
        success: true,
        message:
          "If an active administrator account exists for that email, reset instructions are available.",
      });
    }

    const reset = await createAdminPasswordResetToken(admin.id);

    const baseUrl = (
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin
    ).replace(/\/$/, "");

    const resetUrl =
      `${baseUrl}/admin/reset-password?token=` +
      encodeURIComponent(reset.token);

    const recipientName =
      `${admin.first_name} ${admin.last_name}`.trim();

    const safeName = escapeHtml(recipientName || "Administrator");
    const safeResetUrl = escapeHtml(resetUrl);

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#10231f;max-width:620px;margin:0 auto;padding:32px 20px;">
        <div style="margin-bottom:24px;">
          <div style="font-size:24px;font-weight:700;">ParcelFlow</div>
          <div style="font-size:13px;color:#64746f;">Global Logistics · Administration</div>
        </div>

        <h1 style="font-size:28px;margin:0 0 16px;">Reset your administrator password</h1>

        <p>Hello ${safeName},</p>

        <p>
          A password reset was requested for your ParcelFlow administrator account.
          If you made this request, use the button below to create a new password.
        </p>

        <p style="margin:28px 0;">
          <a
            href="${safeResetUrl}"
            style="display:inline-block;background:#0d5c4a;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;"
          >
            Reset administrator password
          </a>
        </p>

        <p>
          This reset link expires in 30 minutes and can only be used once.
        </p>

        <p style="font-size:13px;color:#64746f;">
          If you did not request this reset, you can safely ignore this email.
        </p>

        <p style="font-size:12px;color:#8a9793;margin-top:32px;">
          ParcelFlow · Global Logistics
        </p>
      </div>
    `;

    const resetRecipientEmail =
      process.env.ADMIN_RESET_TEST_RECIPIENT?.trim() || admin.email;

    await sql`
      INSERT INTO notification_email_outbox (
        recipient_email,
        recipient_name,
        subject,
        html_body,
        status,
        attempts,
        next_attempt_at
      )
      VALUES (
        ${resetRecipientEmail},
        ${recipientName || null},
        'ParcelFlow administrator password reset',
        ${html},
        'pending',
        0,
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message:
        "If an active administrator account exists for that email, reset instructions are available.",
    });
  } catch (error) {
    console.error("Admin forgot-password error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to process the administrator password reset request.",
      },
      { status: 500 },
    );
  }
}
