import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset token and new password are required.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 8 characters.",
        },
        { status: 400 },
      );
    }

    await resetPasswordWithToken(token, password);

    return NextResponse.json({
      success: true,
      message:
        "Your password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    const message =
      error instanceof Error &&
      error.message === "INVALID_OR_EXPIRED_RESET_TOKEN"
        ? "This password reset link is invalid or has expired."
        : process.env.NODE_ENV !== "production" &&
            error instanceof Error
          ? error.message
          : "Unable to reset your password.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
