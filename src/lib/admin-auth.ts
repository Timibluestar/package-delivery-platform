import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "@/lib/db";

const scrypt = promisify(nodeScrypt);

const ADMIN_SESSION_COOKIE = "parcelflow_admin_session";
const ADMIN_SESSION_DAYS = 7;
const ADMIN_PASSWORD_RESET_MINUTES = 30;

export type Admin = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  status: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }

  return secret;
}

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(`${getAuthSecret()}:admin-session:${token}`)
    .digest("hex");
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
) {
  const parts = storedHash.split(":");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, storedKey] = parts;

  try {
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return derivedKey.toString("hex") === storedKey;
  } catch {
    return false;
  }
}

function getAdminName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export async function authenticateAdmin(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const rows = await sql`
    SELECT
      id,
      email,
      first_name,
      last_name,
      status,
      password_hash
    FROM admins
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `;

  const admin = rows[0] as
    | {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        status: string;
        password_hash: string;
      }
    | undefined;

  if (!admin || admin.status !== "active") {
    return null;
  }

  const validPassword = await verifyAdminPassword(
    password,
    admin.password_hash,
  );

  if (!validPassword) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    first_name: admin.first_name,
    last_name: admin.last_name,
    name: getAdminName(admin.first_name, admin.last_name),
    status: admin.status,
  } satisfies Admin;
}

export async function createAdminPasswordResetToken(
  adminId: string,
) {
  const token = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256")
    .update(`${getAuthSecret()}:admin-password-reset:${token}`)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() +
      ADMIN_PASSWORD_RESET_MINUTES * 60 * 1000,
  );

  await sql`
    DELETE FROM admin_password_reset_tokens
    WHERE admin_id = ${adminId}
       OR expires_at <= NOW()
       OR used_at IS NOT NULL
  `;

  await sql`
    INSERT INTO admin_password_reset_tokens (
      admin_id,
      token_hash,
      expires_at
    )
    VALUES (
      ${adminId},
      ${tokenHash},
      ${expiresAt.toISOString()}
    )
  `;

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

async function getAdminPasswordResetToken(token: string) {
  const tokenHash = createHash("sha256")
    .update(`${getAuthSecret()}:admin-password-reset:${token}`)
    .digest("hex");

  const rows = await sql`
    SELECT
      t.id AS reset_id,
      t.admin_id,
      a.email,
      a.status
    FROM admin_password_reset_tokens t
    INNER JOIN admins a
      ON a.id = t.admin_id
    WHERE t.token_hash = ${tokenHash}
      AND t.expires_at > NOW()
      AND t.used_at IS NULL
      AND a.status = 'active'
    LIMIT 1
  `;

  return rows[0] as
    | {
        reset_id: string;
        admin_id: string;
        email: string;
        status: string;
      }
    | undefined;
}

export async function resetAdminPasswordWithToken(
  token: string,
  password: string,
) {
  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters.",
    );
  }

  const reset = await getAdminPasswordResetToken(token);

  if (!reset) {
    throw new Error("INVALID_OR_EXPIRED_ADMIN_RESET_TOKEN");
  }

  const passwordHash = await hashAdminPassword(password);

  await sql`
    UPDATE admins
    SET
      password_hash = ${passwordHash},
      updated_at = NOW()
    WHERE id = ${reset.admin_id}
      AND status = 'active'
  `;

  await sql`
    UPDATE admin_password_reset_tokens
    SET used_at = NOW()
    WHERE id = ${reset.reset_id}
  `;

  await sql`
    DELETE FROM admin_sessions
    WHERE admin_id = ${reset.admin_id}
  `;
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  await sql`
    DELETE FROM admin_sessions
    WHERE admin_id = ${adminId}
      AND expires_at <= NOW()
  `;

  await sql`
    INSERT INTO admin_sessions (
      admin_id,
      token_hash,
      expires_at
    )
    VALUES (
      ${adminId},
      ${tokenHash},
      ${expiresAt.toISOString()}
    )
  `;

  const cookieStore = await cookies();

  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const rows = await sql`
    SELECT
      a.id,
      a.email,
      a.first_name,
      a.last_name,
      a.status
    FROM admin_sessions s
    INNER JOIN admins a
      ON a.id = s.admin_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
      AND a.status = 'active'
    LIMIT 1
  `;

  const admin = rows[0] as
    | {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        status: string;
      }
    | undefined;

  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    first_name: admin.first_name,
    last_name: admin.last_name,
    name: getAdminName(admin.first_name, admin.last_name),
    status: admin.status,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("ADMIN_AUTHENTICATION_REQUIRED");
  }

  return admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    ADMIN_SESSION_COOKIE,
  )?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await sql`
      DELETE FROM admin_sessions
      WHERE token_hash = ${tokenHash}
    `;
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
