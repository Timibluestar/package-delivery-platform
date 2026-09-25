"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicShell from "@/components/PublicShell";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      const result = contentType.includes("application/json")
        ? await response.json()
        : {
            message: await response.text(),
          };

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to sign in.",
        );
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-card">
          <span className="eyebrow dark-eyebrow">Customer account</span>

          <h1>Welcome back.</h1>

          <p>
            Sign in to manage and track your shipments.
          </p>

          <p className="auth-forgot">
            <Link href={`/forgot-password?redirect=${encodeURIComponent(redirectTo)}`}>
              Forgot your password?
            </Link>
          </p>

          <form className="auth-form" onSubmit={submit}>
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
              Password
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button
              className="button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>

            {message && (
              <div className="auth-message" role="alert">
                {message}
              </div>
            )}
          </form>

          <p className="auth-switch">
            New to ParcelFlow?{" "}
            <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`}>
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}


export default function Login() {
  return (
    <Suspense
      fallback={
        <PublicShell>
          <section className="auth-page">
            <div className="auth-card">
              <span className="eyebrow dark-eyebrow">
                Customer account
              </span>
              <h1>Welcome back.</h1>
              <p>Loading sign in...</p>
            </div>
          </section>
        </PublicShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
