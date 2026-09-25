import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const regions = [
  {
    number: "01",
    name: "North America",
    description:
      "Structured shipment workflows for deliveries moving across major North American corridors.",
    tags: ["USA", "Canada", "Cross-border"],
  },
  {
    number: "02",
    name: "Europe",
    description:
      "Designed for international movements requiring clear handoffs, destination details, and shipment visibility.",
    tags: ["EU routes", "UK", "International"],
  },
  {
    number: "03",
    name: "Africa",
    description:
      "Delivery workflows built around local destinations, regional movement, and international connections.",
    tags: ["Regional", "Cross-border", "International"],
  },
  {
    number: "04",
    name: "Middle East",
    description:
      "Flexible shipment planning for packages moving between regional and international destinations.",
    tags: ["Regional", "International", "Priority"],
  },
  {
    number: "05",
    name: "Asia-Pacific",
    description:
      "Connected logistics workflows for long-distance shipments and international destination planning.",
    tags: ["Asia", "Pacific", "Long-distance"],
  },
  {
    number: "06",
    name: "Global Routes",
    description:
      "A unified experience for planning, tracking, and managing shipments across connected delivery networks.",
    tags: ["Worldwide", "Visibility", "Tracking"],
  },
];

const journey = [
  {
    step: "01",
    title: "Choose your route",
    description:
      "Enter the sender and recipient locations and select the delivery service that fits the shipment.",
  },
  {
    step: "02",
    title: "Prepare the shipment",
    description:
      "Provide the package details needed to create a clear shipment record and tracking journey.",
  },
  {
    step: "03",
    title: "Follow the journey",
    description:
      "Use your tracking reference to follow shipment progress as the package moves through its journey.",
  },
];

export default function CoveragePage() {
  return (
    <main className="coverage-page">
      <SiteHeader />

      <section className="coverage-hero">
        <div className="coverage-hero-grid">
          <div className="coverage-hero-copy">
            <span className="coverage-eyebrow">GLOBAL COVERAGE</span>

            <h1>
              Move packages
              <span> beyond borders.</span>
            </h1>

            <p>
              Plan international deliveries with a connected shipment
              experience built around clear routing, visibility, and reliable
              logistics workflows.
            </p>

            <div className="coverage-hero-actions">
              <Link href="/shipping" className="coverage-primary-button">
                Send a package
              </Link>

              <Link href="/tracking" className="coverage-secondary-button">
                Track a shipment
              </Link>
            </div>

            <div className="coverage-hero-meta">
              <div>
                <strong>01</strong>
                <span>Global routing</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Shipment visibility</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Connected workflow</span>
              </div>
            </div>
          </div>

          <div className="coverage-world-panel">
            <div className="coverage-panel-header">
              <span>PARCELFLOW NETWORK</span>
              <span className="coverage-live-indicator">
                <i />
                CONNECTED
              </span>
            </div>

            <div className="coverage-map">
              <div className="coverage-map-grid" />

              <div className="coverage-route coverage-route-one">
                <span className="coverage-route-line" />
                <b className="coverage-node node-a" />
                <b className="coverage-node node-b" />
              </div>

              <div className="coverage-route coverage-route-two">
                <span className="coverage-route-line" />
                <b className="coverage-node node-c" />
                <b className="coverage-node node-d" />
              </div>

              <div className="coverage-route coverage-route-three">
                <span className="coverage-route-line" />
                <b className="coverage-node node-e" />
                <b className="coverage-node node-f" />
              </div>

              <div className="coverage-map-label label-na">
                <span>NORTH AMERICA</span>
                <strong>CONNECTED</strong>
              </div>

              <div className="coverage-map-label label-eu">
                <span>EUROPE</span>
                <strong>CONNECTED</strong>
              </div>

              <div className="coverage-map-label label-af">
                <span>AFRICA</span>
                <strong>CONNECTED</strong>
              </div>

              <div className="coverage-map-label label-ap">
                <span>ASIA-PACIFIC</span>
                <strong>CONNECTED</strong>
              </div>

              <div className="coverage-center-card">
                <span>ACTIVE ROUTE</span>
                <strong>GLOBAL</strong>
                <small>Shipment visibility enabled</small>
              </div>
            </div>

            <div className="coverage-panel-footer">
              <span>ROUTING STATUS</span>
              <strong>READY FOR SHIPMENT</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="coverage-intro">
        <div className="coverage-section-heading">
          <span className="coverage-eyebrow">CONNECTED DESTINATIONS</span>
          <h2>One delivery experience across multiple regions.</h2>
          <p>
            ParcelFlow brings the essential shipment steps into one consistent
            workflow, helping you move from origin to destination with greater
            clarity.
          </p>
        </div>

        <div className="coverage-region-grid">
          {regions.map((region) => (
            <article className="coverage-region-card" key={region.number}>
              <div className="coverage-region-top">
                <span>{region.number}</span>
                <span className="coverage-region-status">ROUTE</span>
              </div>

              <h3>{region.name}</h3>

              <p>{region.description}</p>

              <div className="coverage-region-tags">
                {region.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="coverage-journey">
        <div className="coverage-journey-visual">
          <div className="coverage-journey-card">
            <div className="coverage-journey-card-top">
              <span>SHIPMENT JOURNEY</span>
              <span>PF-2026</span>
            </div>

            <div className="coverage-journey-route">
              <div className="coverage-location">
                <i />
                <div>
                  <small>ORIGIN</small>
                  <strong>Sender location</strong>
                </div>
              </div>

              <div className="coverage-journey-line">
                <span />
                <span />
                <span />
              </div>

              <div className="coverage-location">
                <i />
                <div>
                  <small>DESTINATION</small>
                  <strong>Recipient location</strong>
                </div>
              </div>
            </div>

            <div className="coverage-journey-status">
              <span className="coverage-status-dot" />
              <div>
                <strong>Journey ready</strong>
                <small>Tracking becomes available after shipment creation.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="coverage-journey-copy">
          <span className="coverage-eyebrow">FROM ORIGIN TO DESTINATION</span>

          <h2>International shipping without the clutter.</h2>

          <p>
            Every shipment starts with a clear origin and destination. From
            there, ParcelFlow keeps the important information together so you
            can create, identify, and follow the shipment through its journey.
          </p>

          <div className="coverage-journey-list">
            {journey.map((item) => (
              <div className="coverage-journey-item" key={item.step}>
                <span>{item.step}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="coverage-cta">
        <div>
          <span className="coverage-eyebrow">READY TO MOVE</span>
          <h2>Start your next delivery journey.</h2>
          <p>
            Create a shipment, choose your service, and keep the journey
            connected from the first step.
          </p>
        </div>

        <div className="coverage-cta-actions">
          <Link href="/shipping" className="coverage-primary-button">
            Send a package
          </Link>
          <Link href="/services" className="coverage-text-link">
            Explore services →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
