import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone) || null;
    const password = typeof body.password === "string" ? body.password : "";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "First name, last name, email, and password are required.",
        },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address.",
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

    const existing = await sql`
      SELECT id
      FROM customers
      WHERE email = ${email}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const rows = await sql`
      INSERT INTO customers (
        first_name,
        last_name,
        email,
        password_hash,
        phone
      )
      VALUES (
        ${firstName},
        ${lastName},
        ${email},
        ${passwordHash},
        ${phone}
      )
      RETURNING
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at
    `;

    return NextResponse.json(
      {
        success: true,
        customer: rows[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create the account.",
      },
      { status: 500 },
    );
  }
}
