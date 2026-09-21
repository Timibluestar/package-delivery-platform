import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand footer-brand">
            <span className="brand-mark">P</span>
            <span>
              <strong>ParcelFlow</strong>
              <small>Global Logistics</small>
            </span>
          </Link>
          <p className="footer-copy">
            Reliable package delivery and shipment visibility built for a
            connected world.
          </p>
        </div>

        <div>
          <h3>Explore</h3>
          <Link href="/about">About us</Link>
          <Link href="/services">Services</Link>
          <Link href="/coverage">Global coverage</Link>
          <Link href="/how-it-works">How it works</Link>
        </div>

        <div>
          <h3>Ship</h3>
          <Link href="/shipping">Send a package</Link>
          <Link href="/tracking">Track a package</Link>
          <Link href="/services/express">Express delivery</Link>
          <Link href="/services/business">Business logistics</Link>
        </div>

        <div>
          <h3>Support</h3>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Customer login</Link>
          <Link href="/register">Create account</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 ParcelFlow. All rights reserved.</span>
        <span>Global delivery platform</span>
      </div>
    </footer>
  );
}
