import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = "parcelflow_session";
const SESSION_DAYS = 7;

const PASSWORD_RESET_MINUTES = 30;

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return secret;
}

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(`${getAuthSecret()}:${token}`)
    .digest("hex");
}

export async function hashPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
) {
  const [algorithm, salt, hash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(hash, "hex");

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}

export async function createSession(customerId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  await sql`
    INSERT INTO sessions (
      customer_id,
      token_hash,
      expires_at
    )
    VALUES (
      ${customerId},
      ${tokenHash},
      ${expiresAt.toISOString()}
    )
  `;

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const rows = await sql`
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.email,
      c.phone
    FROM sessions s
    INNER JOIN customers c
      ON c.id = s.customer_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  return (rows[0] as Customer | undefined) ?? null;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  return customer;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await sql`
      DELETE FROM sessions
      WHERE token_hash = ${tokenHash}
    `;
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function createPasswordResetToken(customerId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256")
    .update(`${getAuthSecret()}:password-reset:${token}`)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000,
  );

  await sql`
    DELETE FROM password_reset_tokens
    WHERE customer_id = ${customerId}
      AND (used_at IS NOT NULL OR expires_at <= NOW())
  `;

  await sql`
    INSERT INTO password_reset_tokens (
      customer_id,
      token_hash,
      expires_at
    )
    VALUES (
      ${customerId},
      ${tokenHash},
      ${expiresAt.toISOString()}
    )
  `;

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getPasswordResetCustomer(token: string) {
  if (!token) {
    return null;
  }

  const tokenHash = createHash("sha256")
    .update(`${getAuthSecret()}:password-reset:${token}`)
    .digest("hex");

  const rows = await sql`
    SELECT
      prt.id AS reset_id,
      c.id,
      c.first_name,
      c.last_name,
      c.email
    FROM password_reset_tokens prt
    INNER JOIN customers c
      ON c.id = prt.customer_id
    WHERE prt.token_hash = ${tokenHash}
      AND prt.used_at IS NULL
      AND prt.expires_at > NOW()
    LIMIT 1
  `;

  return (rows[0] as
    | {
        reset_id: string;
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      }
    | undefined) ?? null;
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
) {
  const customer = await getPasswordResetCustomer(token);

  if (!customer) {
    throw new Error("INVALID_OR_EXPIRED_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(password);

  await sql`
    UPDATE customers
    SET
      password_hash = ${passwordHash},
      updated_at = NOW()
    WHERE id = ${customer.id}
  `;

  await sql`
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE id = ${customer.reset_id}
  `;

  await sql`
    DELETE FROM sessions
    WHERE customer_id = ${customer.id}
  `;

  return customer;
}
