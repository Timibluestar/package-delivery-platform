import Link from "next/link";

const features = [
  "Priority handling for time-sensitive shipments",
  "Clear shipment milestones from pickup to delivery",
  "Tracking visibility throughout the journey",
  "A streamlined workflow for urgent deliveries",
];

export default function Express() {
  return (
    <main className="inner-page services-detail-page express-service-page">
      <div className="inner-page-container">
        <section className="service-detail-hero">
          <div>
            <p className="eyebrow">Express delivery</p>
            <h1>When time matters.</h1>
            <p>
              A priority shipping workflow designed for shipments that need
              focused handling, clear progress and dependable visibility.
            </p>

            <div className="service-detail-actions">
              <Link href="/shipping" className="button">
                Send an express package
              </Link>
              <Link href="/tracking" className="text-link">
                Track a package →
              </Link>
            </div>
          </div>

          <div className="service-detail-stat">
            <span>01</span>
            <strong>Priority</strong>
            <small>Focused shipment handling</small>
          </div>
        </section>

        <section className="service-detail-content">
          <div>
            <p className="eyebrow">Built for urgency</p>
            <h2>Move important packages through a focused delivery workflow.</h2>
          </div>

          <div className="service-feature-list">
            {features.map((feature, index) => (
              <div className="service-feature-row" key={feature}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="service-detail-cta">
          <div>
            <p className="eyebrow">Express starts here</p>
            <h2>Ready to move your shipment?</h2>
          </div>
          <Link href="/shipping" className="button">
            Create shipment
          </Link>
        </section>
      </div>
    </main>
  );
}
