import Link from "next/link";
import PublicShell from "@/components/PublicShell";

export default function Login() {
  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-card">
          <span className="eyebrow dark-eyebrow">Customer account</span>
          <h1>Welcome back.</h1>
          <p>Sign in to manage and track your shipments.</p>
          <form className="auth-form">
            <label>Email address<input type="email" placeholder="you@example.com" /></label>
            <label>Password<input type="password" placeholder="Your password" /></label>
            <button className="button" type="submit">Sign in →</button>
          </form>
          <p className="auth-switch">New to ParcelFlow? <Link href="/register">Create an account</Link></p>
        </div>
      </section>
    </PublicShell>
  );
}
