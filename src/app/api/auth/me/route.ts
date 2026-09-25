import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const customer = await getCurrentCustomer();

    return NextResponse.json({
      success: true,
      authenticated: Boolean(customer),
      customer,
    });
  } catch (error) {
    console.error("Auth check error:", error);

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        customer: null,
      },
      { status: 500 },
    );
  }
}
