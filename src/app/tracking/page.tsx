"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";

type TrackingEvent = {
  id: string;
  status: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
};

type ShipmentMedia = {
  id: string;
  shipmentId: string;
  mediaType: "package_item" | "package_photo" | "receiver_photo";
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
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
  media: ShipmentMedia[];
};

function getInitialTrackingNumber() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("number") ?? "";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState(
    getInitialTrackingNumber,
  );
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(number: string) {
    const normalizedNumber = number.trim();

    if (!normalizedNumber) {
      setMessage("Enter a tracking number.");
      setShipment(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/shipments/track?trackingNumber=${encodeURIComponent(
          normalizedNumber,
        )}`,
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
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void track(trackingNumber);
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
                  {new Date(shipment.estimatedDelivery).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </strong>
              </div>
            </div>

            <div className="tracking-timeline">
              <div className="tracking-timeline-heading">
                <p className="eyebrow">Shipment history</p>
                <h2>Tracking events</h2>
              </div>

              {shipment.events.map((event) => (
                <article className="tracking-event" key={event.id}>
                  <div className="tracking-event-marker" />

                  <div className="tracking-event-content">
                    <div className="tracking-event-top">
                      <strong>{event.title}</strong>
                      <time dateTime={event.timestamp}>
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>

                    <p>{event.description}</p>

                    <span>
                      {event.location} · {statusLabel(event.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {shipment.media.length > 0 && (
              <div className="tracking-media">
                <div className="tracking-timeline-heading">
                  <p className="eyebrow">Package media</p>
                  <h2>Items and delivery proof</h2>
                  <p className="tracking-media-intro">
                    Files associated with this shipment.
                  </p>
                </div>

                <div className="tracking-media-grid">
                  {shipment.media.map((media) => (
                    <article
                      className="tracking-media-card"
                      key={media.id}
                    >
                      <div className="tracking-media-preview">
                        {media.mimeType.startsWith("image/") ? (
                          <Image
                            src={media.fileUrl}
                            alt={media.originalFilename}
                              width={1200}
                              height={900}
                              unoptimized
                          />
                        ) : (
                          <div className="tracking-media-document">
                            <span>PDF</span>
                            <strong>
                              {media.originalFilename}
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className="tracking-media-details">
                        <span>
                          {media.mediaType === "receiver_photo"
                            ? "Proof of delivery"
                            : "Package item"}
                        </span>

                        <strong>{media.originalFilename}</strong>

                        <a
                          href={media.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {media.mimeType.startsWith("image/")
                            ? "View image →"
                            : "Open document →"}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
