import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const contactCards = [
  {
    label: "SHIPMENT SUPPORT",
    title: "Questions about a package?",
    description:
      "Have your tracking reference ready when contacting the support team about an existing shipment.",
    action: "Track a shipment",
    href: "/tracking",
  },
  {
    label: "GENERAL QUESTIONS",
    title: "Need information?",
    description:
      "For questions about ParcelFlow, delivery services, or the shipping workflow, start with our FAQ.",
    action: "Visit the FAQ",
    href: "/faq",
  },
  {
    label: "START SHIPPING",
    title: "Ready to send?",
    description:
      "Create your shipment directly and provide the information needed to begin the delivery workflow.",
    action: "Send a package",
    href: "/shipping",
  },
];

export default function ContactPage() {
  return (
    <main className="contact-page">
      <SiteHeader />

      <section className="contact-hero">
        <div className="contact-hero-copy">
          <span className="contact-eyebrow">CONTACT PARCELFLOW</span>
          <h1>
            Let&apos;s keep your
            <span>delivery moving.</span>
          </h1>
          <p>
            Whether you are checking a shipment, exploring our services, or
            getting ready to send a package, start with the right ParcelFlow
            channel below.
          </p>
        </div>

        <div className="contact-hero-card">
          <div className="contact-card-header">
            <span>SUPPORT DESK</span>
            <strong>AVAILABLE</strong>
          </div>
          <div className="contact-card-main">
            <i />
            <div>
              <strong>ParcelFlow Support</strong>
              <span>Shipment and platform assistance</span>
            </div>
          </div>
          <div className="contact-card-footer">
            <span>REFERENCE</span>
            <strong>PF / SUPPORT</strong>
          </div>
        </div>
      </section>

      <section className="contact-options">
        <div className="contact-section-heading">
          <span className="contact-eyebrow">HOW CAN WE HELP?</span>
          <h2>Choose the path that matches your question.</h2>
        </div>

        <div className="contact-card-grid">
          {contactCards.map((card, index) => (
            <article className="contact-option-card" key={card.label}>
              <div className="contact-option-top">
                <span>0{index + 1}</span>
                <span>{card.label}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <Link href={card.href}>{card.action} →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-route">
        <div className="contact-route-visual">
          <span>ORIGIN</span>
          <div className="contact-route-line">
            <i />
            <i />
            <i />
          </div>
          <strong>PARCELFLOW</strong>
          <div className="contact-route-line">
            <i />
            <i />
            <i />
          </div>
          <span>DESTINATION</span>
        </div>

        <div className="contact-route-copy">
          <span className="contact-eyebrow">CONNECTED SUPPORT</span>
          <h2>Good logistics starts with clear communication.</h2>
          <p>
            Keep your shipment reference and relevant delivery details close by
            when asking for assistance. It helps keep the conversation focused
            on the shipment journey.
          </p>
        </div>
      </section>

      <section className="contact-cta">
        <div>
          <span className="contact-eyebrow">READY WHEN YOU ARE</span>
          <h2>Start your next shipment.</h2>
        </div>
        <Link href="/shipping" className="contact-primary-button">
          Send a package
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
