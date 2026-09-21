import Link from "next/link";
import PublicShell from "@/components/PublicShell";

export default function Register() {
  return (
    <PublicShell>
      <section className="auth-page">
        <div className="auth-card">
          <span className="eyebrow dark-eyebrow">Create account</span>
          <h1>Start shipping.</h1>
          <p>Create a customer account to manage your shipments in one place.</p>
          <form className="auth-form">
            <label>Full name<input type="text" placeholder="Your full name" /></label>
            <label>Email address<input type="email" placeholder="you@example.com" /></label>
            <label>Password<input type="password" placeholder="Create a password" /></label>
            <button className="button" type="submit">Create account →</button>
          </form>
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
    </PublicShell>
  );
}
