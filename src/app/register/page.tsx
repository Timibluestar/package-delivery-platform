"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicShell from "@/components/PublicShell";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const nameParts = fullName.trim().split(/\s+/);

    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || firstName;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to create the account.",
        );
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginResult.message ||
            "Account created, but automatic sign-in failed.",
        );
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-card">
          <span className="eyebrow dark-eyebrow">Create account</span>

          <h1>Start shipping.</h1>

          <p>
            Create a customer account to manage your shipments in one place.
          </p>

          <form className="auth-form" onSubmit={submit}>
            <label>
              Full name
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                placeholder="+234 801 234 5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button
              className="button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>

            {message && (
              <div className="auth-message" role="alert">
                {message}
              </div>
            )}
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}


export default function Register() {
  return (
    <Suspense
      fallback={
        <PublicShell>
          <section className="auth-page">
            <div className="auth-card">
              <span className="eyebrow dark-eyebrow">
                Customer account
              </span>
              <h1>Create your account.</h1>
              <p>Loading registration...</p>
            </div>
          </section>
        </PublicShell>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
