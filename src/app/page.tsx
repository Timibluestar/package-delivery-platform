import Image from "next/image";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";

const services = [
  {
    number: "01",
    title: "Express delivery",
    text: "Time-sensitive shipments with priority handling and clear delivery milestones.",
    href: "/services/express",
    icon: "⚡",
  },
  {
    number: "02",
    title: "Standard shipping",
    text: "Practical domestic and international shipping for everyday packages.",
    href: "/services",
    icon: "▣",
  },
  {
    number: "03",
    title: "Business logistics",
    text: "Scalable shipping workflows designed around growing businesses and teams.",
    href: "/services/business",
    icon: "▦",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your shipment",
    text: "Enter your pickup, destination and package details.",
  },
  {
    number: "02",
    title: "We move it",
    text: "Your shipment enters the appropriate delivery workflow.",
  },
  {
    number: "03",
    title: "Track every step",
    text: "Follow shipment milestones from dispatch to delivery.",
  },
];

const whatsappUrl =
  "https://wa.me/16192415211?text=Hi%20ParcelFlow%20Support%2C%20I%20need%20help%20with%20my%20shipment.";

export default function Home() {
  return (
    <PublicShell>
      <main>
        {/* HERO */}
        <section className="hero homepage-hero">
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
                countries and borders — with visibility at every step.
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
                <Image
                  src="/images/delivery/hero-courier-customer-v2.png"
                  alt="ParcelFlow courier handing a package to a customer"
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="hero-delivery-image"
                />

                <div className="image-overlay" />

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

        {/* TRACKING */}
        <section className="quick-track homepage-track">
          <div className="container quick-track-inner">
            <div>
              <span className="eyebrow dark-eyebrow">Track a shipment</span>
              <h2>Know where it is.</h2>
              <p>Enter your tracking number for the latest shipment status.</p>
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

        {/* SERVICES */}
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

            <div className="service-grid upgraded-service-grid">
              {services.map((service) => (
                <Link
                  href={service.href}
                  className="service-card"
                  key={service.number}
                >
                  <div className="service-icon">{service.icon}</div>
                  <span className="card-number">{service.number}</span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <span className="card-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* DELIVERY EXPERIENCE */}
        <section className="section delivery-experience-section">
          <div className="container">
            <div className="section-heading delivery-experience-heading">
              <div>
                <span className="eyebrow">The ParcelFlow experience</span>
                <h2>Every delivery has a story.</h2>
              </div>

              <p>
                From careful handling to the final handoff, your package moves
                through a clear, connected delivery experience.
              </p>
            </div>

            <div className="delivery-experience-grid">
              <article className="delivery-image-card delivery-image-card-large">
                <div className="delivery-image-wrap">
                  <Image
                    src="/images/delivery/courier-loading.jpg"
                    alt="Courier completing a package handoff"
                    fill
                    sizes="(max-width: 900px) 100vw, 58vw"
                    className="delivery-image"
                  />

                  <div className="delivery-image-overlay" />

                  <div className="delivery-image-content">
                    <span className="delivery-image-number">01</span>
                    <div>
                      <span className="delivery-image-label">Final mile</span>
                      <h3>Delivered with care.</h3>
                    </div>
                  </div>
                </div>
              </article>

              <div className="delivery-image-stack">
                <article className="delivery-image-card">
                  <div className="delivery-image-wrap">
                    <Image
                      src="/images/delivery/courier-loading-v2.jpg"
                      alt="Courier preparing parcels for delivery"
                      fill
                      sizes="(max-width: 900px) 100vw, 42vw"
                      className="delivery-image"
                    />

                    <div className="delivery-image-overlay" />

                    <div className="delivery-image-content">
                      <span className="delivery-image-number">02</span>
                      <div>
                        <span className="delivery-image-label">In motion</span>
                        <h3>Handled at every stage.</h3>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="delivery-image-card">
                  <div className="delivery-image-wrap">
                    <Image
                      src="/images/delivery/international-2.webp"
                      alt="Package prepared for international shipment"
                      fill
                      sizes="(max-width: 900px) 100vw, 42vw"
                      className="delivery-image"
                    />

                    <div className="delivery-image-overlay" />

                    <div className="delivery-image-content">
                      <span className="delivery-image-number">03</span>
                      <div>
                        <span className="delivery-image-label">Global reach</span>
                        <h3>Ready for the journey.</h3>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section process-section">
          <div className="container">
            <div className="section-heading centered-heading">
              <span className="eyebrow">Simple by design</span>
              <h2>From your door to theirs.</h2>
              <p>One clear workflow from shipment creation to delivery.</p>
            </div>

            <div className="process-grid">
              {steps.map((step) => (
                <div className="process-card enhanced-process-card" key={step.number}>
                  <span>{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRACKING FEATURE */}
        <section className="section tracking-feature-section">
          <div className="container tracking-feature-grid">
            <div>
              <span className="eyebrow">Always in the loop</span>
              <h2>Tracking that keeps you moving.</h2>
              <p>
                Stay informed from pickup through delivery with clear shipment
                milestones and a simple tracking experience.
              </p>

              <div className="feature-list">
                <div>
                  <span>01</span>
                  <strong>Shipment milestones</strong>
                </div>
                <div>
                  <span>02</span>
                  <strong>Delivery visibility</strong>
                </div>
                <div>
                  <span>03</span>
                  <strong>Clear status updates</strong>
                </div>
              </div>

              <Link href="/tracking" className="button">
                Track your shipment →
              </Link>
            </div>

            <div className="tracking-visual-card">
              <Image
                src="/images/homepage/tracking-visual.svg"
                alt="ParcelFlow shipment tracking visualization"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>

        {/* GLOBAL */}
        <section className="section dark-section">
          <div className="container global-panel">
            <div>
              <span className="eyebrow">One platform</span>
              <h2>
                Local deliveries.
                <br />
                <span>Global reach.</span>
              </h2>

              <p>
                Whether you are sending across town or across borders,
                ParcelFlow gives you one place to create and monitor your
                shipments.
              </p>

              <Link href="/coverage" className="button light-button">
                Explore coverage →
              </Link>
            </div>

            <div className="world-visual homepage-world-visual">
              <Image
                src="/images/homepage/global-network.svg"
                alt="ParcelFlow global delivery network"
                fill
                sizes="(max-width: 900px) 100vw, 55vw"
              />
            </div>
          </div>
        </section>

        {/* WHATSAPP SUPPORT */}
        <section className="section whatsapp-section">
          <div className="container whatsapp-panel">
            <div className="whatsapp-icon" aria-hidden="true">
              W
            </div>

            <div className="whatsapp-copy">
              <span className="eyebrow">Customer support</span>
              <h2>Need help with a shipment?</h2>
              <p>
                Chat with ParcelFlow support on WhatsApp for shipment
                questions, tracking help and delivery assistance.
              </p>
            </div>

            <div className="whatsapp-action">
              <strong>24/7 WhatsApp Support</strong>
              <span>+1 (619) 241-5211</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
              >
                Chat on WhatsApp →
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}

        <section className="section homepage-media-services" id="delivery-capabilities">
          <div className="container">
            <div className="section-heading homepage-media-heading">
              <span className="eyebrow">Built around every shipment</span>
              <h2>From warehouse to doorstep, ParcelFlow keeps delivery moving.</h2>
              <p>
                A connected delivery experience covering fulfillment, road transport,
                international freight, tracking and customer support.
              </p>
            </div>

            <div className="homepage-media-grid">
              <article className="homepage-media-card homepage-media-card-large">
                <div className="homepage-media-image">
                  <Image
                    src="/images/delivery/courier-loading-v2.jpg"
                    alt="ParcelFlow shipment preparation and loading"
                    width={832}
                    height={448}
                    sizes="(max-width: 900px) 100vw, 58vw"
                  />
                </div>
                <div className="homepage-media-copy">
                  <span>01 · Fulfillment</span>
                  <h3>Prepared with care.</h3>
                  <p>
                    Organized shipment handling helps every package move into
                    the delivery network with confidence.
                  </p>
                </div>
              </article>

              <article className="homepage-media-card">
                <div className="homepage-media-image">
                  <Image
                    src="/images/delivery/global-shipping.jpg"
                    alt="ParcelFlow delivery network"
                    width={832}
                    height={448}
                    sizes="(max-width: 900px) 100vw, 42vw"
                  />
                </div>
                <div className="homepage-media-copy">
                  <span>02 · Road delivery</span>
                  <h3>Moving across cities.</h3>
                  <p>
                    Keep shipments moving through a connected logistics network.
                  </p>
                </div>
              </article>

              <article className="homepage-media-card">
                <div className="homepage-media-image">
                  <Image
                    src="/images/delivery/international-shipping.jpg"
                    alt="ParcelFlow international shipping"
                    width={1312}
                    height={736}
                    sizes="(max-width: 900px) 100vw, 42vw"
                  />
                </div>
                <div className="homepage-media-copy">
                  <span>03 · International</span>
                  <h3>Further, across borders.</h3>
                  <p>
                    International shipping designed for businesses and customers
                    sending packages farther.
                  </p>
                </div>
              </article>

              <article className="homepage-media-card homepage-media-card-feature">
                <div className="homepage-media-image">
                  <Image
                    src="/images/homepage/tracking-visual.svg"
                    alt="ParcelFlow shipment tracking"
                    width={832}
                    height={448}
                    sizes="(max-width: 900px) 100vw, 50vw"
                  />
                </div>
                <div className="homepage-media-copy">
                  <span>04 · Tracking</span>
                  <h3>Know where it is.</h3>
                  <p>
                    Clear shipment updates help customers stay informed from
                    dispatch through delivery.
                  </p>
                  <a className="text-link" href="/tracking">
                    Track a shipment →
                  </a>
                </div>
              </article>

              <article className="homepage-media-card homepage-media-support">
                <div className="homepage-media-image">
                  <Image
                    src="/images/homepage/customer-support.svg"
                    alt="ParcelFlow customer support"
                    width={832}
                    height={448}
                    sizes="(max-width: 900px) 100vw, 50vw"
                  />
                </div>
                <div className="homepage-media-copy">
                  <span>05 · Support</span>
                  <h3>Real people when you need them.</h3>
                  <p>
                    Get help with shipment questions through ParcelFlow support
                    and WhatsApp.
                  </p>
                  <a className="text-link" href={whatsappUrl}>
                    Chat with support →
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section homepage-testimonials-section" id="testimonials">
          <div className="container">
            <div className="section-heading testimonials-heading">
              <span className="section-eyebrow">Customer stories</span>
              <h2>Trusted by customers around the world</h2>
              <p>
                From local deliveries to international shipments, ParcelFlow
                helps customers stay informed from pickup to delivery.
              </p>
            </div>

            <div className="testimonials-grid">
              <article className="testimonial-card">
                <div className="testimonial-portrait-wrap">
                  <Image
                    src="/images/testimonials/testimonial-1.png"
                    alt="Emmanuel Okafor, online business owner and ParcelFlow customer"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 520px) 76px, 120px"
                  />
                </div>
                <div className="testimonial-content">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>
                    “ParcelFlow makes it easy to manage my customer deliveries and keep every shipment moving.”</blockquote>
                  <div className="testimonial-customer">
                    <strong>Emmanuel Okafor</strong>
                    <span>Online Business Owner</span>
                  </div>
                </div>
              </article>

              <article className="testimonial-card">
                <div className="testimonial-portrait-wrap">
                  <Image
                    src="/images/testimonials/testimonial-2.png"
                    alt="James Wilson, small business owner and ParcelFlow customer"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 520px) 76px, 120px"
                  />
                </div>
                <div className="testimonial-content">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>
                    “The shipment updates give me confidence that every package is being handled and delivered properly.”</blockquote>
                  <div className="testimonial-customer">
                    <strong>James Wilson</strong>
                    <span>Small Business Owner</span>
                  </div>
                </div>
              </article>

              <article className="testimonial-card">
                <div className="testimonial-portrait-wrap">
                  <Image
                    src="/images/testimonials/testimonial-3.png"
                    alt="Arjun Mehta, ParcelFlow customer in London"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 520px) 76px, 120px"
                  />
                </div>
                <div className="testimonial-content">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>
                    “The process is simple, professional, and easy to follow from collection through delivery.”</blockquote>
                  <div className="testimonial-customer">
                    <strong>Arjun Mehta</strong>
                    <span>London, UK</span>
                  </div>
                </div>
              </article>

              <article className="testimonial-card">
                <div className="testimonial-portrait-wrap">
                  <Image
                    src="/images/testimonials/testimonial-4.png"
                    alt="ParcelFlow warehouse team member preparing a package"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 520px) 76px, 120px"
                  />
                </div>
                <div className="testimonial-content">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>
                    “Careful package handling helps keep every shipment organized from the warehouse to the customer.”</blockquote>
                  <div className="testimonial-customer">
                    <strong>ParcelFlow Warehouse Team</strong>
                    <span>ParcelFlow Logistics</span>
                  </div>
                </div>
              </article>

              <article className="testimonial-card">
                <div className="testimonial-portrait-wrap">
                  <Image
                    src="/images/testimonials/testimonial-5.png"
                    alt="Sophie Miller, ParcelFlow customer in Berlin"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 520px) 76px, 120px"
                  />
                </div>
                <div className="testimonial-content">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    ★★★★★
                  </div>
                  <blockquote>
                    “Fast support and clear shipment information made the whole experience feel effortless.”</blockquote>
                  <div className="testimonial-customer">
                    <strong>Sophie Miller</strong>
                    <span>Berlin, Germany</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq-preview-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Need to know</span>
                <h2>Questions before you ship?</h2>
              </div>

              <Link href="/faq" className="text-link">
                View all FAQs →
              </Link>
            </div>

            <div className="faq-preview-grid">
              <Link href="/faq" className="faq-preview-card">
                <span>01</span>
                <div>
                  <h3>How does tracking work?</h3>
                  <p>Learn how to follow your shipment from dispatch to delivery.</p>
                </div>
                <b>→</b>
              </Link>

              <Link href="/faq" className="faq-preview-card">
                <span>02</span>
                <div>
                  <h3>Where do you deliver?</h3>
                  <p>Explore available shipping coverage and destinations.</p>
                </div>
                <b>→</b>
              </Link>

              <Link href="/faq" className="faq-preview-card">
                <span>03</span>
                <div>
                  <h3>How can I get support?</h3>
                  <p>Contact ParcelFlow through our support channels.</p>
                </div>
                <b>→</b>
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section final-cta">
          <div className="container cta-box">
            <span className="eyebrow">Ready when you are</span>
            <h2>Send something that matters.</h2>
            <p>
              Create your first shipment and experience a simpler delivery
              workflow.
            </p>

            <div className="hero-actions">
              <Link href="/shipping" className="button">
                Start shipping →
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-ghost"
              >
                WhatsApp support
              </a>
            </div>
          </div>
        </section>

        {/* FLOATING WHATSAPP */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-floating"
          aria-label="Chat with ParcelFlow support on WhatsApp"
        >
          <span>W</span>
          <strong>WhatsApp</strong>
        </a>
      </main>
    </PublicShell>
  );
}
