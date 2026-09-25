"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage("");
    setResetUrl("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.message ||
            "Unable to process the password reset request.",
        );
        return;
      }

      setMessage(
        result.message ||
          "Reset instructions have been generated.",
      );

      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    } catch {
      setMessage(
        "Unable to connect to the administrator reset service.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">P</span>

          <div>
            <strong>ParcelFlow</strong>
            <small>Global Logistics</small>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">ADMINISTRATION</span>

          <h1>Forgot your password?</h1>

          <p>
            Enter your administrator email and we&apos;ll
            generate a secure password reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <label>
            Administrator email
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="username"
              required
            />
          </label>

          {message ? (
            <p className="auth-success" role="status">
              {message}
            </p>
          ) : null}

          {resetUrl ? (
            <div className="auth-reset-development">
              <strong>Development reset link</strong>

              <a href={resetUrl}>{resetUrl}</a>
            </div>
          ) : null}

          <button
            type="submit"
            className="button button-primary"
            disabled={submitting}
          >
            {submitting
              ? "Generating reset link..."
              : "Generate reset link →"}
          </button>
        </form>

        <p className="auth-footer">
          <Link href="/admin/login">
            ← Back to administrator sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
