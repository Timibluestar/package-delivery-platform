import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroyAdminSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign out.",
      },
      { status: 500 },
    );
  }
}
