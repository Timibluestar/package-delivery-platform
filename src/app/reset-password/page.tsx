"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicShell from "@/components/PublicShell";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage(
        "This password reset link is missing its reset token.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to reset your password.",
        );
      }

      setSuccess(true);
      setMessage(result.message);

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset your password.",
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

          <h1>Create a new password.</h1>

          <p>
            Choose a new password with at least 8 characters.
          </p>

          <form className="auth-form" onSubmit={submit}>
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button
              className="button"
              type="submit"
              disabled={loading || success}
            >
              {loading ? "Updating password..." : "Reset password →"}
            </button>

            {message && (
              <div
                className="auth-message"
                role={success ? "status" : "alert"}
              >
                {message}
              </div>
            )}
          </form>

          <p className="auth-switch">
            <Link href="/login">Return to sign in</Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}


export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <PublicShell>
          <section className="auth-page">
            <div className="auth-card">
              <span className="eyebrow dark-eyebrow">
                Customer account
              </span>
              <h1>Reset your password.</h1>
              <p>Loading password reset...</p>
            </div>
          </section>
        </PublicShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
