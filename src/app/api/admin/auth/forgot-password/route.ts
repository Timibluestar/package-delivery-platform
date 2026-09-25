import { NextResponse } from "next/server";
import { createAdminPasswordResetToken } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

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
      SELECT id
      FROM admins
      WHERE LOWER(email) = ${email}
        AND status = 'active'
      LIMIT 1
    `;

    const admin = rows[0] as
      | { id: string }
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

    const reset = await createAdminPasswordResetToken(
      admin.id,
    );

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;

    const resetUrl =
      `${baseUrl}/admin/reset-password?token=` +
      encodeURIComponent(reset.token);

    const response: {
      success: boolean;
      message: string;
      resetUrl?: string;
      expiresAt?: string;
    } = {
      success: true,
      message:
        "Password reset instructions have been generated.",
    };

    /*
     * Until an email provider is connected, expose the reset URL
     * only outside production. In production the reset URL must be
     * delivered through a configured email provider instead.
     */
    if (process.env.NODE_ENV !== "production") {
      response.resetUrl = resetUrl;
      response.expiresAt = reset.expiresAt;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Admin forgot-password error:",
      error,
    );

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
