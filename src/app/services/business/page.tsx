import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Recurring shipments",
    description:
      "Create a repeatable workflow for teams handling shipments regularly.",
  },
  {
    number: "02",
    title: "Delivery visibility",
    description:
      "Keep shipment activity easier to follow with clear tracking milestones.",
  },
  {
    number: "03",
    title: "Operational clarity",
    description:
      "Build a more organized logistics process around the deliveries your business manages.",
  },
];

export default function Business() {
  return (
    <main className="inner-page services-detail-page business-service-page">
      <div className="inner-page-container">
        <section className="service-detail-hero">
          <div>
            <p className="eyebrow">Business logistics</p>
            <h1>Shipping that grows with your business.</h1>
            <p>
              Organize recurring shipments, monitor delivery activity and build
              a clearer logistics workflow for your team.
            </p>

            <div className="service-detail-actions">
              <Link href="/shipping" className="button">
                Start a business shipment
              </Link>
              <Link href="/contact" className="text-link">
                Talk to ParcelFlow →
              </Link>
            </div>
          </div>

          <div className="business-dashboard-card">
            <div className="business-dashboard-header">
              <span>OPERATIONS</span>
              <span>LIVE</span>
            </div>

            <div className="business-metric">
              <small>SHIPMENT ACTIVITY</small>
              <strong>Visible from one workflow.</strong>
            </div>

            <div className="business-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <section className="business-capabilities">
          <div className="service-detail-content-heading">
            <p className="eyebrow">For growing teams</p>
            <h2>A clearer way to manage delivery activity.</h2>
          </div>

          <div className="business-capability-grid">
            {capabilities.map((capability) => (
              <article key={capability.number}>
                <span>{capability.number}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-detail-cta">
          <div>
            <p className="eyebrow">Build your workflow</p>
            <h2>Make every shipment easier to follow.</h2>
          </div>
          <Link href="/contact" className="button">
            Contact ParcelFlow
          </Link>
        </section>
      </div>
    </main>
  );
}
