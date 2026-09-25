"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage(
          result.message ||
            "Unable to sign in as administrator.",
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the admin service.");
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

          <h1>Administrator sign in</h1>

          <p>
            Access shipment operations, customer communication,
            pricing, and notifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
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

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />
          </label>

          {message ? (
            <p className="auth-error" role="alert">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="button button-primary"
            disabled={submitting}
          >
            {submitting
              ? "Signing in..."
              : "Sign in to admin"}
          </button>
        </form>

        <p className="auth-footer">
          <a href="/admin/forgot-password">
            Forgot your password?
          </a>
        </p>
      </div>
    </main>
  );
}
