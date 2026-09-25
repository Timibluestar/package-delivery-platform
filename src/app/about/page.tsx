import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const principles = [
  {
    number: "01",
    title: "Clarity",
    description:
      "Shipment information should be easy to understand from the first booking step through tracking.",
  },
  {
    number: "02",
    title: "Connection",
    description:
      "A delivery experience works better when shipment creation, routing, and visibility work together.",
  },
  {
    number: "03",
    title: "Consistency",
    description:
      "Every shipment should follow a familiar workflow regardless of the selected delivery service.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <SiteHeader />

      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="about-eyebrow">ABOUT PARCELFLOW</span>
          <h1>
            Logistics built around
            <span>the journey.</span>
          </h1>
          <p>
            ParcelFlow is a delivery platform focused on making package
            shipping easier to create, understand, and track.
          </p>
        </div>

        <div className="about-hero-panel">
          <span>PARCELFLOW / GLOBAL LOGISTICS</span>
          <strong>MOVE WHAT MATTERS.</strong>
          <div className="about-panel-route">
            <i />
            <span />
            <i />
            <span />
            <i />
          </div>
          <small>Origin → Journey → Destination</small>
        </div>
      </section>

      <section className="about-story">
        <div className="about-section-heading">
          <span className="about-eyebrow">OUR APPROACH</span>
          <h2>Delivery should feel connected, not complicated.</h2>
        </div>

        <div className="about-story-copy">
          <p>
            Modern shipping involves more than moving a package from one
            location to another. It also means keeping sender information,
            recipient details, service selection, and shipment visibility
            organized.
          </p>
          <p>
            ParcelFlow brings those pieces into a single customer experience,
            giving individuals and businesses a practical way to create and
            follow their shipments.
          </p>
        </div>
      </section>

      <section className="about-principles">
        <div className="about-principle-grid">
          {principles.map((principle) => (
            <article className="about-principle-card" key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-services">
        <div>
          <span className="about-eyebrow">ONE PLATFORM</span>
          <h2>From first shipment details to final delivery.</h2>
          <p>
            Explore the delivery services and tools available through
            ParcelFlow.
          </p>
        </div>

        <Link href="/services" className="about-primary-button">
          Explore services →
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
