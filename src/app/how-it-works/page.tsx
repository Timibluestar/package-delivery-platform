import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const steps = [
  {
    number: "01",
    title: "Create your shipment",
    description:
      "Enter the sender, recipient, package, and delivery information needed to create your shipment.",
  },
  {
    number: "02",
    title: "Choose your service",
    description:
      "Select Standard, Express, or Business delivery based on the needs of your shipment.",
  },
  {
    number: "03",
    title: "Get your tracking reference",
    description:
      "Once the shipment is created, you receive a unique reference that identifies its delivery journey.",
  },
  {
    number: "04",
    title: "Follow the journey",
    description:
      "Use the tracking page to check shipment progress and stay informed as your package moves.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="workflow-page">
      <SiteHeader />

      <section className="workflow-hero">
        <div className="workflow-hero-copy">
          <span className="workflow-eyebrow">HOW IT WORKS</span>
          <h1>
            Simple shipping.
            <span>Clear delivery.</span>
          </h1>
          <p>
            From creating a shipment to following it to its destination,
            ParcelFlow keeps the delivery process organized and easy to follow.
          </p>

          <div className="workflow-actions">
            <Link href="/shipping" className="workflow-primary-button">
              Send a package
            </Link>
            <Link href="/tracking" className="workflow-secondary-button">
              Track a package
            </Link>
          </div>
        </div>

        <div className="workflow-console">
          <div className="workflow-console-header">
            <span>SHIPMENT WORKFLOW</span>
            <strong>PF / LIVE</strong>
          </div>

          <div className="workflow-progress">
            <div className="workflow-progress-line" />
            {steps.map((step, index) => (
              <div className="workflow-progress-step" key={step.number}>
                <span>{step.number}</span>
                <small>{index === 0 ? "CREATE" : index === 1 ? "SERVICE" : index === 2 ? "TRACK" : "DELIVER"}</small>
              </div>
            ))}
          </div>

          <div className="workflow-console-status">
            <i />
            <div>
              <strong>Shipment workflow ready</strong>
              <span>Every shipment starts with a clear record.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-steps-section">
        <div className="workflow-heading">
          <span className="workflow-eyebrow">THE PROCESS</span>
          <h2>Four steps from shipment to destination.</h2>
          <p>
            A straightforward workflow designed to keep the important details
            together throughout the delivery journey.
          </p>
        </div>

        <div className="workflow-step-grid">
          {steps.map((step) => (
            <article className="workflow-step-card" key={step.number}>
              <div className="workflow-step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <span className="workflow-card-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-visibility">
        <div className="workflow-visibility-card">
          <div className="workflow-visibility-top">
            <span>SHIPMENT VISIBILITY</span>
            <span>TRACKING</span>
          </div>

          <div className="workflow-visibility-route">
            <div>
              <i />
              <small>ORIGIN</small>
              <strong>Shipment created</strong>
            </div>
            <span />
            <div>
              <i />
              <small>JOURNEY</small>
              <strong>In transit</strong>
            </div>
            <span />
            <div>
              <i />
              <small>DESTINATION</small>
              <strong>Delivered</strong>
            </div>
          </div>
        </div>

        <div className="workflow-visibility-copy">
          <span className="workflow-eyebrow">STAY INFORMED</span>
          <h2>Know where your shipment stands.</h2>
          <p>
            Your tracking reference connects you to the shipment record,
            making it easier to check progress without losing the context of
            the journey.
          </p>
          <Link href="/tracking" className="workflow-text-link">
            Open tracking →
          </Link>
        </div>
      </section>

      <section className="workflow-cta">
        <div>
          <span className="workflow-eyebrow">START SHIPPING</span>
          <h2>Ready to send your next package?</h2>
          <p>Create your shipment and begin the delivery journey.</p>
        </div>
        <Link href="/shipping" className="workflow-primary-button">
          Send a package
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
