"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const links = [
  { href: "/services", label: "Services" },
  { href: "/tracking", label: "Tracking" },
  { href: "/coverage", label: "Global coverage" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await response.json();

        if (active) {
          setAuthenticated(Boolean(result.authenticated));
        }
      } catch {
        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setAuthChecking(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error("Unable to sign out.");
      }

      setAuthenticated(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Header logout error:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="ParcelFlow home">
          <span className="brand-mark">P</span>
          <span>
            <strong>ParcelFlow</strong>
            <small>Global Logistics</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          {!authChecking && authenticated ? (
            <>
              <Link href="/dashboard" className="nav-dashboard">
                Dashboard
              </Link>

              <button
                type="button"
                className="nav-signout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>

              <Link href="/shipping" className="button button-small">
                Send a package
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-signin">
                Sign in
              </Link>

              <Link href="/shipping" className="button button-small">
                Send a package
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
