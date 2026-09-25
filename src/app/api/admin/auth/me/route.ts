import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    return NextResponse.json({
      success: true,
      authenticated: Boolean(admin),
      admin,
    });
  } catch (error) {
    console.error("Admin session check error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        admin: null,
      },
      { status: 500 },
    );
  }
}
