"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type TrackingEvent = {
  id: string;
  status: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
};

type Shipment = {
  trackingNumber: string;
  service: string;
  shipmentType: string;
  status: string;
  estimatedDelivery: string;
  sender: {
    city: string;
    country: string;
  };
  recipient: {
    city: string;
    country: string;
  };
  package: {
    description: string;
    weightKg: number;
  };
  events: TrackingEvent[];
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("number") ?? "";
  });
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const track = useCallback(
    async (number = trackingNumber) => {
    if (!number.trim()) {
      setMessage("Enter a tracking number.");
      setShipment(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/shipments/track?trackingNumber=${encodeURIComponent(number)}`,
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Shipment not found.");
      }

      setShipment(result.shipment);
    } catch (error) {
      setShipment(null);
      setMessage(
        error instanceof Error ? error.message : "Shipment not found.",
      );
    } finally {
      setLoading(false);
    }
    },
    [trackingNumber],
  );

  useEffect(() => {
    if (trackingNumber) {
      void track(trackingNumber);
    }
  }, [trackingNumber, track]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void track();
  }

  return (
    <main className="inner-page tracking-page">
      <div className="inner-page-container">
        <section className="inner-page-intro">
          <p className="eyebrow">Shipment tracking</p>
          <h1>Know where it is.</h1>
          <p>
            Enter your ParcelFlow tracking number to see the latest shipment
            status and tracking events.
          </p>
        </section>

        <form className="tracking-search" onSubmit={submit}>
          <input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="PF-4829-7316"
            aria-label="Tracking number"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Track shipment →"}
          </button>
        </form>

        {message && <div className="tracking-error">{message}</div>}

        {shipment && (
          <section className="tracking-result">
            <div className="tracking-result-top">
              <div>
                <p className="eyebrow">Tracking number</p>
                <h2>{shipment.trackingNumber}</h2>
              </div>

              <span className="tracking-status">
                {statusLabel(shipment.status)}
              </span>
            </div>

            <div className="tracking-route">
              <div>
                <span>From</span>
                <strong>
                  {shipment.sender.city}, {shipment.sender.country}
                </strong>
              </div>

              <div className="tracking-route-line" />

              <div>
                <span>To</span>
                <strong>
                  {shipment.recipient.city}, {shipment.recipient.country}
                </strong>
              </div>
            </div>

            <div className="tracking-summary">
              <div>
                <span>Service</span>
                <strong>{statusLabel(shipment.service)}</strong>
              </div>

              <div>
                <span>Package</span>
                <strong>{shipment.package.description}</strong>
              </div>

              <div>
                <span>Weight</span>
                <strong>{shipment.package.weightKg} kg</strong>
              </div>

              <div>
                <span>Estimated delivery</span>
                <strong>
                  {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                </strong>
              </div>
            </div>

            <div className="tracking-timeline">
              <div className="tracking-timeline-heading">
                <p className="eyebrow">Tracking history</p>
                <h2>Shipment milestones</h2>
              </div>

              {shipment.events.map((event) => (
                <article className="tracking-event" key={event.id}>
                  <div className="tracking-event-marker" />
                  <div>
                    <div className="tracking-event-meta">
                      <strong>{event.title}</strong>
                      <time>
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>
                    <p>{event.description}</p>
                    <span>{event.location}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
