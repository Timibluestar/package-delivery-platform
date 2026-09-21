import Link from "next/link";
import PublicShell from "./PublicShell";

export default function InnerPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <PublicShell>
      <section className="inner-hero">
        <div className="container">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="section inner-content">
        <div className="container">
          {children ?? (
            <div className="placeholder-grid">
              <div>
                <span className="eyebrow dark-eyebrow">Coming together</span>
                <h2>A clear foundation for global delivery.</h2>
                <p>
                  This section is ready for the full workflow, content and
                  backend functionality as the platform develops.
                </p>
                <Link href="/contact" className="button">
                  Contact our team →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
