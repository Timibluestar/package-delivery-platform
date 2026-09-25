import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAdmin,
  createAdminSession,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = text(body.email);
    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter your email and password.",
        },
        { status: 400 },
      );
    }

    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid administrator credentials.",
        },
        { status: 401 },
      );
    }

    await createAdminSession(admin.id);

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign in.",
      },
      { status: 500 },
    );
  }
}
