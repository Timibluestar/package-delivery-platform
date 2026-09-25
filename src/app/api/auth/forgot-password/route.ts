import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          message: "Enter your email address.",
        },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT id, email
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    /*
     * Do not reveal whether an email exists in production.
     */
    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists for that email, password reset instructions are available.",
      });
    }

    const customer = rows[0] as {
      id: string;
      email: string;
    };

    const reset = await createPasswordResetToken(customer.id);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reset-password?token=${encodeURIComponent(reset.token)}`;

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
     * Until an email provider is connected, expose the reset
     * link only during local/development operation.
     */
    if (process.env.NODE_ENV !== "production") {
      response.resetUrl = resetUrl;
      response.expiresAt = reset.expiresAt;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          process.env.NODE_ENV !== "production" &&
          error instanceof Error
            ? error.message
            : "Unable to process the password reset request.",
      },
      { status: 500 },
    );
  }
}
