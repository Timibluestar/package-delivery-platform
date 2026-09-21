import Link from "next/link";
import InnerPage from "@/components/InnerPage";

export default function Tracking() {
  return (
    <InnerPage
      eyebrow="Shipment tracking"
      title="Your package. One clear view."
      description="Enter a tracking number to view shipment progress and delivery milestones."
    >
      <div className="placeholder-grid">
        <div>
          <span className="eyebrow dark-eyebrow">Track shipment</span>
          <h2>Where is your package?</h2>
          <form action="/tracking" className="tracking-form">
            <input
              name="tracking"
              placeholder="Example: PF-4829-7316"
              aria-label="Tracking number"
            />
            <button className="button" type="submit">
              Track →
            </button>
          </form>
          <p>
            Tracking results will connect to the live shipment system once
            carrier and operational integrations are enabled.
          </p>
          <Link href="/contact" className="text-link">
            Need help with a shipment? →
          </Link>
        </div>
      </div>
    </InnerPage>
  );
}
