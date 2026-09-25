import Link from "next/link";

const services = [
  {
    number: "01",
    eyebrow: "Standard shipping",
    title: "Reliable delivery for everyday shipments.",
    description:
      "A dependable shipping workflow for parcels that need straightforward handling, clear tracking and reliable delivery.",
    features: [
      "End-to-end shipment tracking",
      "Clear delivery milestones",
      "Domestic and international support",
    ],
    href: "/shipping",
    action: "Send a package",
  },
  {
    number: "02",
    eyebrow: "Express delivery",
    title: "When time matters.",
    description:
      "A priority delivery experience designed for time-sensitive shipments with focused handling and visible progress.",
    features: [
      "Priority shipment handling",
      "Frequent tracking visibility",
      "Designed for urgent deliveries",
    ],
    href: "/services/express",
    action: "Explore Express",
  },
  {
    number: "03",
    eyebrow: "Business logistics",
    title: "Shipping that grows with your business.",
    description:
      "A structured logistics workflow for teams managing recurring shipments, customers and delivery activity.",
    features: [
      "Recurring shipment workflows",
      "Centralized delivery visibility",
      "Built for growing operations",
    ],
    href: "/services/business",
    action: "Explore Business",
  },
];

export default function Services() {
  return (
    <main className="inner-page services-page">
      <div className="inner-page-container">
        <section className="services-hero">
          <div className="services-hero-copy">
            <p className="eyebrow">ParcelFlow services</p>
            <h1>Delivery options built around the shipment.</h1>
            <p className="services-hero-description">
              From everyday parcels to time-sensitive deliveries and growing
              business operations, choose the workflow that fits the journey.
            </p>

            <div className="services-hero-actions">
              <Link href="/shipping" className="button">
                Send a package
              </Link>
              <Link href="/tracking" className="text-link">
                Track a package →
              </Link>
            </div>
          </div>

          <div className="services-hero-panel">
            <div className="services-panel-top">
              <span>PARCELFLOW</span>
              <span>GLOBAL LOGISTICS</span>
            </div>

            <div className="services-route">
              <div className="services-route-point">
                <span className="services-route-dot" />
                <div>
                  <small>ORIGIN</small>
                  <strong>Pickup</strong>
                </div>
              </div>

              <div className="services-route-line">
                <span />
                <span />
                <span />
              </div>

              <div className="services-route-point">
                <span className="services-route-dot" />
                <div>
                  <small>DESTINATION</small>
                  <strong>Delivered</strong>
                </div>
              </div>
            </div>

            <div className="services-panel-status">
              <span className="status-pulse" />
              <div>
                <small>SHIPMENT VISIBILITY</small>
                <strong>Every step, clearly tracked.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="services-intro">
          <div>
            <p className="eyebrow">Choose your workflow</p>
            <h2>One platform. Different delivery needs.</h2>
          </div>
          <p>
            ParcelFlow keeps the experience simple while giving each shipment
            the service path it needs.
          </p>
        </section>

        <section className="services-grid-premium">
          {services.map((service) => (
            <article className="service-card-premium" key={service.number}>
              <div className="service-card-number">{service.number}</div>

              <div className="service-card-content">
                <p className="eyebrow">{service.eyebrow}</p>
                <h2>{service.title}</h2>
                <p>{service.description}</p>

                <ul>
                  {service.features.map((feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href={service.href} className="service-card-link">
                  {service.action} →
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="services-bottom-cta">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Start your next delivery with ParcelFlow.</h2>
            <p>
              Create a shipment, receive your tracking number and keep every
              delivery milestone within reach.
            </p>
          </div>

          <Link href="/shipping" className="button">
            Create a shipment
          </Link>
        </section>
      </div>
    </main>
  );
}
