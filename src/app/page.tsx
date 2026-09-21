import Link from "next/link";
import PublicShell from "@/components/PublicShell";

const services = [
  {
    number: "01",
    title: "Express delivery",
    text: "Time-sensitive shipments with priority handling and clear delivery milestones.",
    href: "/services/express",
  },
  {
    number: "02",
    title: "Standard shipping",
    text: "Practical domestic and international shipping for everyday packages.",
    href: "/services",
  },
  {
    number: "03",
    title: "Business logistics",
    text: "Scalable shipping workflows designed around growing businesses and teams.",
    href: "/services/business",
  },
];

const steps = [
  ["01", "Create your shipment", "Enter your pickup, destination and package details."],
  ["02", "We move it", "Your shipment enters the appropriate delivery workflow."],
  ["03", "Track every step", "Follow shipment milestones from dispatch to delivery."],
];

export default function Home() {
  return (
    <PublicShell>
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />

        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" />
              Global package delivery
            </div>

            <h1>
              Deliver what
              <span> matters.</span>
            </h1>

            <p className="hero-text">
              A modern delivery platform for sending packages across cities,
              countries and borders—with visibility at every step.
            </p>

            <div className="hero-actions">
              <Link href="/shipping" className="button">
                Send a package <span>→</span>
              </Link>
              <Link href="/tracking" className="button button-ghost">
                Track a package
              </Link>
            </div>

            <div className="hero-trust">
              <div className="trust-avatars">
                <span>✓</span>
                <span>✓</span>
                <span>✓</span>
              </div>
              <div>
                <strong>Built for global shipping</strong>
                <small>Clear workflows. Transparent tracking.</small>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <div className="image-overlay" />
              <div className="route-line route-line-one" />
              <div className="route-line route-line-two" />

              <div className="floating-card tracking-card">
                <div className="mini-label">SHIPMENT STATUS</div>
                <strong>In transit</strong>
                <span className="status-line">
                  <i /> Moving toward destination
                </span>
              </div>

              <div className="floating-card route-card">
                <div className="route-code">PF</div>
                <div>
                  <div className="mini-label">TRACKING</div>
                  <strong>PF-4829-7316</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-track">
        <div className="container quick-track-inner">
          <div>
            <span className="eyebrow dark-eyebrow">Track a shipment</span>
            <h2>Know where it is.</h2>
          </div>
          <form action="/tracking" className="tracking-form">
            <input
              name="tracking"
              placeholder="Enter tracking number"
              aria-label="Tracking number"
            />
            <button type="submit" className="button">
              Track package →
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">What we do</span>
              <h2>Delivery without the guesswork.</h2>
            </div>
            <Link href="/services" className="text-link">
              View all services →
            </Link>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <Link href={service.href} className="service-card" key={service.number}>
                <span className="card-number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <span className="card-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading centered-heading">
            <span className="eyebrow">Simple by design</span>
            <h2>From your door to theirs.</h2>
            <p>One clear workflow from shipment creation to delivery.</p>
          </div>

          <div className="process-grid">
            {steps.map(([number, title, text]) => (
              <div className="process-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark-section">
        <div className="container global-panel">
          <div>
            <span className="eyebrow">One platform</span>
            <h2>Local deliveries. Global reach.</h2>
            <p>
              Whether you are sending across town or across borders, ParcelFlow
              gives you one place to create and monitor your shipments.
            </p>
            <Link href="/coverage" className="button light-button">
              Explore coverage →
            </Link>
          </div>

          <div className="world-visual" aria-hidden="true">
            <div className="world-grid" />
            <div className="world-dot dot-a" />
            <div className="world-dot dot-b" />
            <div className="world-dot dot-c" />
            <div className="world-dot dot-d" />
            <div className="world-arc arc-a" />
            <div className="world-arc arc-b" />
          </div>
        </div>
      </section>

      <section className="section final-cta">
        <div className="container cta-box">
          <span className="eyebrow">Ready when you are</span>
          <h2>Send something that matters.</h2>
          <p>Create your first shipment and experience a simpler delivery workflow.</p>
          <div className="hero-actions">
            <Link href="/shipping" className="button">
              Start shipping →
            </Link>
            <Link href="/contact" className="button button-ghost">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
