"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PublicShell from "@/components/PublicShell";

type ShipmentEvent = {
  id: string;
  status: string;
  title: string;
  description?: string | null;
  location?: string | null;
  timestamp?: string;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  service: string;
  shipmentType: string;
  status: string;
  shippingPrice?: number | null;
  shippingCurrency?: string | null;
  priceDisclosedAt?: string | null;
  estimatedDelivery?: string | null;
  createdAt?: string;
  sender?: {
    city?: string;
    country?: string;
  } | null;
  recipient?: {
    city?: string;
    country?: string;
  } | null;
  package?: {
    description?: string;
    weightKg?: number;
  } | null;
  events?: ShipmentEvent[];
};

type ShipmentMessage = {
  id: string;
  shipmentId: string;
  senderRole: "customer" | "admin";
  senderName?: string;
  message: string;
  createdAt: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function ShipmentConversationPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [messages, setMessages] = useState<ShipmentMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      setMessageError("");

      const response = await fetch(
        `/api/shipments/${encodeURIComponent(
          shipmentId,
        )}/messages`,
        {
          cache: "no-store",
        },
      );

      const contentType =
        response.headers.get("content-type") || "";

      const result = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load shipment messages.",
        );
      }

      setMessages(
        Array.isArray(result.messages)
          ? result.messages
          : [],
      );
    } catch (loadError) {
      setMessageError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load shipment messages.",
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!shipmentId) {
      return;
    }

    let cancelled = false;

    async function loadPageData() {
      try {
        setLoading(true);
        setMessagesLoading(true);
        setError("");
        setMessageError("");

        const shipmentResponse = await fetch("/api/shipments", {
          cache: "no-store",
        });

        const shipmentContentType =
          shipmentResponse.headers.get("content-type") || "";

        const shipmentResult =
          shipmentContentType.includes("application/json")
            ? await shipmentResponse.json()
            : {};

        if (!shipmentResponse.ok || !shipmentResult.success) {
          throw new Error(
            shipmentResult.message || "Unable to load shipment.",
          );
        }

        const shipments = Array.isArray(shipmentResult.shipments)
          ? shipmentResult.shipments
          : [];

        const found = shipments.find(
          (item: Shipment) => item.id === shipmentId,
        );

        if (!found) {
          throw new Error("Shipment could not be found.");
        }

        if (!cancelled) {
          setShipment(found);
          setLoading(false);
        }

        const messagesResponse = await fetch(
          `/api/shipments/${encodeURIComponent(
            shipmentId,
          )}/messages`,
          {
            cache: "no-store",
          },
        );

        const messagesContentType =
          messagesResponse.headers.get("content-type") || "";

        const messagesResult =
          messagesContentType.includes("application/json")
            ? await messagesResponse.json()
            : {};

        if (!messagesResponse.ok || !messagesResult.success) {
          throw new Error(
            messagesResult.message ||
              "Unable to load shipment messages.",
          );
        }

        if (!cancelled) {
          setMessages(
            Array.isArray(messagesResult.messages)
              ? messagesResult.messages
              : [],
          );
          setMessagesLoading(false);
        }
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load shipment.";

        setError(message);
        setMessageError(message);
        setLoading(false);
        setMessagesLoading(false);
      }
    }

    void loadPageData();

    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const message = messageDraft.trim();

    if (!message) {
      setMessageError("Please enter a message.");
      return;
    }

    if (message.length > 5000) {
      setMessageError("Message must be 5000 characters or fewer.");
      return;
    }

    try {
      setSending(true);
      setMessageError("");

      const response = await fetch(
        `/api/shipments/${encodeURIComponent(
          shipmentId,
        )}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        },
      );

      const contentType =
        response.headers.get("content-type") || "";

      const result = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to send message.",
        );
      }

      setMessageDraft("");
      await loadMessages();
    } catch (sendError) {
      setMessageError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message.",
      );
    } finally {
      setSending(false);
    }
  }

  const routeLabel = useMemo(() => {
    if (!shipment) {
      return "Shipment";
    }

    const sender = [
      shipment.sender?.city,
      shipment.sender?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const recipient = [
      shipment.recipient?.city,
      shipment.recipient?.country,
    ]
      .filter(Boolean)
      .join(", ");

    if (sender && recipient) {
      return `${sender} → ${recipient}`;
    }

    return "Shipment details";
  }, [shipment]);

  if (loading) {
    return (
      <PublicShell>
        <main className="shipment-conversation-page">
          <div className="shipment-conversation-container">
            <p className="shipment-conversation-loading">
              Loading shipment…
            </p>
          </div>
        </main>
      </PublicShell>
    );
  }

  if (error || !shipment) {
    return (
      <PublicShell>
        <main className="shipment-conversation-page">
          <div className="shipment-conversation-container">
            <Link
              className="shipment-conversation-back"
              href="/dashboard"
            >
              ← Back to dashboard
            </Link>

            <section className="shipment-conversation-error">
              <span className="eyebrow dark-eyebrow">
                Shipment unavailable
              </span>

              <h1>We couldn&apos;t open this shipment.</h1>

              <p>
                {error || "The requested shipment could not be found."}
              </p>

              <Link
                className="button button-primary"
                href="/dashboard"
              >
                Return to dashboard
              </Link>
            </section>
          </div>
        </main>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <main className="shipment-conversation-page">
        <div className="shipment-conversation-container">
          <Link
            className="shipment-conversation-back"
            href="/dashboard"
          >
            ← Back to dashboard
          </Link>

          <header className="shipment-conversation-header">
            <div>
              <span className="eyebrow dark-eyebrow">
                Shipment conversation
              </span>

              <h1>{shipment.trackingNumber}</h1>

              <p>{routeLabel}</p>
            </div>

            <div className="shipment-conversation-status">
              <span className="shipment-conversation-status-label">
                Status
              </span>
              <strong>
                {formatStatus(shipment.status)}
              </strong>
            </div>
          </header>

          <section className="shipment-conversation-grid">
            <div className="shipment-conversation-main">
              <section className="shipment-detail-card">
                <div className="shipment-detail-card-heading">
                  <div>
                    <span className="eyebrow dark-eyebrow">
                      Shipment details
                    </span>
                    <h2>Delivery overview</h2>
                  </div>
                </div>

                <div className="shipment-detail-grid">
                  <div>
                    <span>Service</span>
                    <strong>{shipment.service}</strong>
                  </div>

                  <div>
                    <span>Shipment type</span>
                    <strong>{shipment.shipmentType}</strong>
                  </div>

                  <div>
                    <span>Package</span>
                    <strong>
                      {shipment.package?.description || "Package"}
                    </strong>
                  </div>

                  <div>
                    <span>Weight</span>
                    <strong>
                      {shipment.package?.weightKg != null
                        ? `${shipment.package.weightKg} kg`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Shipping price</span>
                    <strong>
                      {shipment.priceDisclosedAt &&
                      shipment.shippingPrice != null
                        ? `${shipment.shippingPrice} ${
                            shipment.shippingCurrency || "USD"
                          }`
                        : "Price pending"}
                    </strong>
                  </div>

                  <div>
                    <span>Estimated delivery</span>
                    <strong>
                      {formatDate(shipment.estimatedDelivery)}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="shipment-message-card">
                <div className="shipment-message-card-heading">
                  <div>
                    <span className="eyebrow dark-eyebrow">
                      Messages
                    </span>
                    <h2>Talk to ParcelFlow</h2>
                  </div>
                </div>

                <div className="shipment-message-list">
                  {messagesLoading ? (
                    <p className="shipment-message-empty">
                      Loading conversation…
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="shipment-message-empty">
                      No messages yet. Send a message below if you
                      need help with this shipment.
                    </p>
                  ) : (
                    messages.map((message) => (
                      <article
                        key={message.id}
                        className={`shipment-message ${
                          message.senderRole === "customer"
                            ? "shipment-message-customer"
                            : "shipment-message-admin"
                        }`}
                      >
                        <div className="shipment-message-meta">
                          <strong>
                            {message.senderName ||
                              (message.senderRole === "admin"
                                ? "ParcelFlow"
                                : "You")}
                          </strong>

                          <time dateTime={message.createdAt}>
                            {formatDate(message.createdAt)}
                          </time>
                        </div>

                        <p>{message.message}</p>
                      </article>
                    ))
                  )}
                </div>

                <form
                  className="shipment-message-form"
                  onSubmit={handleSendMessage}
                >
                  <label htmlFor="shipment-message">
                    Message
                  </label>

                  <textarea
                    id="shipment-message"
                    value={messageDraft}
                    onChange={(event) =>
                      setMessageDraft(event.target.value)
                    }
                    placeholder="Write a message about this shipment…"
                    maxLength={5000}
                    rows={4}
                    disabled={sending}
                  />

                  {messageError && (
                    <p className="shipment-message-error">
                      {messageError}
                    </p>
                  )}

                  <div className="shipment-message-form-footer">
                    <span>
                      {messageDraft.length}/5000
                    </span>

                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={sending}
                    >
                      {sending
                        ? "Sending…"
                        : "Send message →"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <aside className="shipment-timeline-card">
              <span className="eyebrow dark-eyebrow">
                Tracking history
              </span>

              <h2>Shipment activity</h2>

              <div className="shipment-timeline">
                {shipment.events?.length ? (
                  shipment.events.map((event) => (
                    <article
                      key={event.id}
                      className="shipment-timeline-item"
                    >
                      <span className="shipment-timeline-dot" />

                      <div>
                        <strong>{event.title}</strong>

                        <time dateTime={event.timestamp}>
                          {formatDate(event.timestamp)}
                        </time>

                        {event.description && (
                          <p>{event.description}</p>
                        )}

                        {event.location && (
                          <small>{event.location}</small>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="shipment-message-empty">
                    Shipment activity will appear here as your
                    delivery progresses.
                  </p>
                )}
              </div>
            </aside>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
