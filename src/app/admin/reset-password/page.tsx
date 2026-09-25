"use client";

import {
  FormEvent,
  Suspense,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AdminResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token") || "",
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "This administrator password reset link is missing its token.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to reset the administrator password.",
        );
        return;
      }

      setSuccess(true);
      setMessage(
        result.message ||
          "Administrator password reset successfully.",
      );
    } catch {
      setError(
        "Unable to connect to the administrator reset service.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
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

            <h1>Password updated</h1>

            <p>{message}</p>
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={() => router.push("/admin/login")}
          >
            Return to admin sign in →
          </button>
        </div>
      </main>
    );
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

          <h1>Create a new password</h1>

          <p>
            Choose a new password for your administrator
            account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
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

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="button button-primary"
            disabled={submitting}
          >
            {submitting
              ? "Updating password..."
              : "Set new password →"}
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

export default function AdminResetPasswordPage() {
  return (
    <Suspense
      fallback={
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
              <h1>Loading password reset</h1>
              <p>Please wait while your secure reset link is loaded.</p>
            </div>
          </div>
        </main>
      }
    >
      <AdminResetPasswordContent />
    </Suspense>
  );
}
