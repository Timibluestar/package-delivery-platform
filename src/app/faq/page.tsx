import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const faqs = [
  {
    question: "How do I send a package?",
    answer:
      "Open the Send a package page, enter the sender and recipient information, provide the package details, and select your preferred delivery service.",
  },
  {
    question: "How do I track my shipment?",
    answer:
      "Use the Tracking page and enter the tracking reference associated with your shipment to view its available shipment information.",
  },
  {
    question: "Which delivery services are available?",
    answer:
      "ParcelFlow currently presents Standard, Express, and Business delivery options. The appropriate option depends on your shipment requirements.",
  },
  {
    question: "Can I create an international shipment?",
    answer:
      "Yes. The shipment workflow includes international shipment details so you can provide the required origin and destination information.",
  },
  {
    question: "What information do I need to create a shipment?",
    answer:
      "You will need sender and recipient details, shipment addresses, package information, and your preferred service.",
  },
  {
    question: "Where can I get help with a shipment?",
    answer:
      "Use the Contact page to reach the ParcelFlow support channel with your question or shipment details.",
  },
];

export default function FAQPage() {
  return (
    <main className="faq-page">
      <SiteHeader />

      <section className="faq-hero">
        <div>
          <span className="faq-eyebrow">HELP CENTER</span>
          <h1>
            Questions,
            <span>answered.</span>
          </h1>
          <p>
            Find quick answers about shipping, tracking, services, and the
            ParcelFlow delivery experience.
          </p>
        </div>

        <div className="faq-hero-card">
          <span>PARCELFLOW SUPPORT</span>
          <strong>Need more help?</strong>
          <p>Our contact channel is available for shipment questions.</p>
          <Link href="/contact">Contact support →</Link>
        </div>
      </section>

      <section className="faq-content">
        <div className="faq-content-heading">
          <span className="faq-eyebrow">FREQUENTLY ASKED</span>
          <h2>Everything you need to get moving.</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details className="faq-item" key={faq.question}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{faq.question}</strong>
                <i>+</i>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="faq-cta">
        <div>
          <span className="faq-eyebrow">STILL HAVE A QUESTION?</span>
          <h2>Let&apos;s get the right information to you.</h2>
        </div>
        <Link href="/contact" className="faq-primary-button">
          Contact us
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
