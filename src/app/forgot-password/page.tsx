"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PublicShell from "@/components/PublicShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setResetUrl("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to process your request.",
        );
      }

      setMessage(result.message);

      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to process your request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-card">
          <span className="eyebrow dark-eyebrow">
            Account recovery
          </span>

          <h1>Forgot your password?</h1>

          <p>
            Enter the email address associated with your ParcelFlow
            account and we&apos;ll help you reset your password.
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

            <button
              className="button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Generating reset link..."
                : "Continue →"}
            </button>

            {message && (
              <div className="auth-message" role="status">
                {message}
              </div>
            )}

            {resetUrl && (
              <div className="auth-reset-development">
                <strong>Development reset link</strong>
                <a href={resetUrl}>{resetUrl}</a>
                <small>
                  This link is shown only during local development.
                  It expires after 30 minutes.
                </small>
              </div>
            )}
          </form>

          <p className="auth-switch">
            Remember your password?{" "}
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
