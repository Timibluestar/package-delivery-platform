import { NextResponse } from "next/server";
import {
  resetAdminPasswordWithToken,
} from "@/lib/admin-auth";

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
          message:
            "Reset token and new password are required.",
        },
        { status: 400 },
      );
    }

    await resetAdminPasswordWithToken(token, password);

    return NextResponse.json({
      success: true,
      message:
        "Administrator password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Admin reset-password error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    return NextResponse.json(
      {
        success: false,
        message:
          message === "INVALID_OR_EXPIRED_ADMIN_RESET_TOKEN"
            ? "This administrator password reset link is invalid or has expired."
            : message ===
                "Password must contain at least 8 characters."
              ? message
              : "Unable to reset the administrator password.",
      },
      { status: 400 },
    );
  }
}
