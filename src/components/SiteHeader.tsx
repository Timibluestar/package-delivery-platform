import Link from "next/link";

const links = [
  { href: "/services", label: "Services" },
  { href: "/tracking", label: "Tracking" },
  { href: "/coverage", label: "Global coverage" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
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
          <Link href="/login" className="nav-signin">
            Sign in
          </Link>
          <Link href="/shipping" className="button button-small">
            Send a package
          </Link>
        </div>
      </div>
    </header>
  );
}
