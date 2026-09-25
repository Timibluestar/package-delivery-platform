import { NextResponse } from "next/server";
import {
  createSession,
  verifyPassword,
} from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        password_hash
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    const customer = rows[0] as
      | {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          password_hash: string;
        }
      | undefined;

    if (!customer || !(await verifyPassword(password, customer.password_hash))) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    await createSession(customer.id);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign in.",
      },
      { status: 500 },
    );
  }
}
