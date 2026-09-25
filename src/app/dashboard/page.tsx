"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import NotificationCenter from "@/components/NotificationCenter";

type ShipmentEvent = {
  id: string;
  status: string;
  title: string;
  description?: string | null;
  location?: string | null;
  timestamp?: string;
  createdAt?: string;
};

type ShipmentMessage = {
  id: string;
  shipmentId: string;
  senderRole: "customer" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
};

type Shipment = {
  id: string;
  trackingNumber: string;
  service: string;
  shipmentType: string;
  status: string;
  shippingPrice?: number | null;
  shippingCurrency?: string;
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

type Customer = {
  first_name: string;
  last_name: string;
  email: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

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

function normalizeStatus(status: string) {
  return status.replace(/_/g, " ");
}

function statusClass(status: string) {
  switch (status) {
    case "delivered":
      return "dashboard-status dashboard-status-delivered";
    case "in_transit":
    case "out_for_delivery":
      return "dashboard-status dashboard-status-progress";
    case "confirmed":
      return "dashboard-status dashboard-status-confirmed";
    case "cancelled":
      return "dashboard-status dashboard-status-cancelled";
    default:
      return "dashboard-status dashboard-status-pending";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ShipmentMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [customerResponse, shipmentsResponse] =
          await Promise.all([
            fetch("/api/auth/me", {
              cache: "no-store",
            }),
            fetch("/api/shipments", {
              cache: "no-store",
            }),
          ]);

        const customerContentType =
          customerResponse.headers.get("content-type") || "";

        const customerResult =
          customerContentType.includes("application/json")
            ? await customerResponse.json()
            : {};

        if (!customerResponse.ok || !customerResult.success) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        const shipmentsContentType =
          shipmentsResponse.headers.get("content-type") || "";

        const shipmentsResult =
          shipmentsContentType.includes("application/json")
            ? await shipmentsResponse.json()
            : {
                message: await shipmentsResponse.text(),
              };

        if (!shipmentsResponse.ok) {
          throw new Error(
            shipmentsResult.message ||
              "Unable to load your shipments.",
          );
        }

        const shipmentRows = Array.isArray(
          shipmentsResult.shipments,
        )
          ? shipmentsResult.shipments
          : [];

        if (!active) return;

        setCustomer(customerResult.customer);
        setShipments(shipmentRows);
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your dashboard.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function loadMessages(shipmentId: string) {
    try {
      setMessagesLoading(true);
      setMessageError("");

      const response = await fetch(
        `/api/shipments/${encodeURIComponent(shipmentId)}/messages`,
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
  }

  async function toggleConversation(shipmentId: string) {
    setMessageError("");

    if (selectedShipmentId === shipmentId) {
      setSelectedShipmentId(null);
      setMessages([]);
      setMessageDraft("");
      return;
    }

    setSelectedShipmentId(shipmentId);
    setMessages([]);
    setMessageDraft("");
    await loadMessages(shipmentId);
  }

  async function handleSendMessage(shipmentId: string) {
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
      setMessageSending(true);
      setMessageError("");

      const response = await fetch(
        `/api/shipments/${encodeURIComponent(shipmentId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        },
      );

      const contentType =
        response.headers.get("content-type") || "";

      const result = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to send your message.",
        );
      }

      setMessageDraft("");
      await loadMessages(shipmentId);
    } catch (sendError) {
      setMessageError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send your message.",
      );
    } finally {
      setMessageSending(false);
    }
  }

  useEffect(() => {
    if (!selectedShipmentId) {
      return;
    }

    const shipmentId = selectedShipmentId;

    const refreshConversation = () => {
      void loadMessages(shipmentId);
    };

    const interval = window.setInterval(refreshConversation, 10000);

    return () => {
      window.clearInterval(interval);
    };
    // loadMessages is intentionally kept outside the dependency list
    // because it is recreated with the dashboard component.
    // The selected shipment controls the polling lifecycle.
  }, [selectedShipmentId]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error("Unable to sign out.");
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const stats = useMemo(() => {
    return {
      total: shipments.length,
      pending: shipments.filter(
        (shipment) => shipment.status === "pending",
      ).length,
      active: shipments.filter((shipment) =>
        ["confirmed", "in_transit", "out_for_delivery"].includes(
          shipment.status,
        ),
      ).length,
      delivered: shipments.filter(
        (shipment) => shipment.status === "delivered",
      ).length,
    };
  }, [shipments]);

  const recentShipments = shipments.slice(0, 5);

  const reports = useMemo(() => {
    return shipments
      .flatMap((shipment) =>
        (shipment.events || []).map((event) => ({
          ...event,
          trackingNumber: shipment.trackingNumber,
          shipmentId: shipment.id,
        })),
      )
      .sort((a, b) => {
        const aDate = new Date(
          a.timestamp || a.createdAt || 0,
        ).getTime();

        const bDate = new Date(
          b.timestamp || b.createdAt || 0,
        ).getTime();

        return bDate - aDate;
      })
      .slice(0, 6);
  }, [shipments]);

  const firstName =
    customer?.first_name ||
    "Customer";

  return (
    <PublicShell>
      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow dark-eyebrow">
              Customer dashboard
            </span>

            <h1>
              Welcome back, {firstName}.
            </h1>

            <p>
              Manage your shipments, monitor delivery progress,
              and review your latest logistics activity.
            </p>
          </div>

          <nav
            className="dashboard-user-nav"
            aria-label="Customer dashboard navigation"
          >
            <div className="dashboard-user-nav-links">
              <Link
                className="dashboard-user-nav-link dashboard-user-nav-link-primary"
                href="/shipping"
              >
                <span>Ship a package</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                className="dashboard-user-nav-link"
                href="/tracking"
              >
                Track a shipment
              </Link>
            </div>

            <div className="dashboard-user-nav-tools">
              <div className="dashboard-user-notification-slot">
                <NotificationCenter
                  onOpenShipment={(shipmentId) =>
                    router.push(
                      `/dashboard/shipments/${encodeURIComponent(
                        shipmentId,
                      )}`,
                    )
                  }
                />
              </div>

              <button
                type="button"
                className="dashboard-user-nav-link dashboard-user-signout"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </nav>
        </section>

        {error && (
          <section className="dashboard-alert" role="alert">
            <strong>Dashboard unavailable</strong>
            <span>{error}</span>
          </section>
        )}

        <section className="dashboard-stats" aria-label="Shipment summary">
          <article className="dashboard-stat-card">
            <span>Total shipments</span>
            <strong>
              {loading ? "—" : stats.total}
            </strong>
            <small>All shipments on your account</small>
          </article>

          <article className="dashboard-stat-card">
            <span>Pending</span>
            <strong>
              {loading ? "—" : stats.pending}
            </strong>
            <small>Awaiting processing</small>
          </article>

          <article className="dashboard-stat-card">
            <span>In progress</span>
            <strong>
              {loading ? "—" : stats.active}
            </strong>
            <small>Confirmed or moving</small>
          </article>

          <article className="dashboard-stat-card">
            <span>Delivered</span>
            <strong>
              {loading ? "—" : stats.delivered}
            </strong>
            <small>Completed deliveries</small>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-panel dashboard-shipments-panel">
            <div className="dashboard-panel-heading">
              <div>
                <span className="eyebrow">
                  Shipment management
                </span>
                <h2>Recent shipments</h2>
              </div>

              <Link href="/tracking">
                View tracking
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-empty">
                <strong>Loading shipments…</strong>
                <span>
                  Retrieving your latest shipment activity.
                </span>
              </div>
            ) : recentShipments.length === 0 ? (
              <div className="dashboard-empty">
                <strong>No shipments yet</strong>
                <span>
                  Your shipment reports and delivery activity
                  will appear here after your first shipment.
                </span>

                <Link
                  className="button button-primary"
                  href="/shipping"
                >
                  Create your first shipment
                </Link>
              </div>
            ) : (
              <div className="dashboard-shipment-list">
                {recentShipments.map((shipment) => (
                  <article
                    className="dashboard-shipment-card"
                    key={shipment.id}
                  >
                    <div className="dashboard-shipment-top">
                      <div>
                        <span className="dashboard-tracking-label">
                          Tracking number
                        </span>

                        <strong className="dashboard-tracking-number">
                          {shipment.trackingNumber}
                        </strong>
                      </div>

                      <span
                        className={statusClass(
                          shipment.status,
                        )}
                      >
                        {normalizeStatus(shipment.status)}
                      </span>
                    </div>

                    <div className="dashboard-route">
                      <div>
                        <span>From</span>
                        <strong>
                          {shipment.sender?.city || "—"},{" "}
                          {shipment.sender?.country || "—"}
                        </strong>
                      </div>

                      <span className="dashboard-route-arrow">
                        →
                      </span>

                      <div>
                        <span>To</span>
                        <strong>
                          {shipment.recipient?.city || "—"},{" "}
                          {shipment.recipient?.country || "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="dashboard-shipment-meta">
                      <span className="dashboard-price-block">
                        <small>Shipping price</small>
                        <strong>
                          {shipment.priceDisclosedAt &&
                          shipment.shippingPrice !== null &&
                          shipment.shippingPrice !== undefined
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency:
                                  shipment.shippingCurrency || "USD",
                              }).format(shipment.shippingPrice)
                            : "Price pending"}
                        </strong>
                      </span>

                      <span>
                        {shipment.service
                          ? `${shipment.service} service`
                          : "Standard service"}
                      </span>

                      <span>
                        {shipment.package?.weightKg
                          ? `${shipment.package.weightKg} kg`
                          : "Weight pending"}
                      </span>

                      <span>
                        ETA{" "}
                        {formatDate(
                          shipment.estimatedDelivery,
                        )}
                      </span>
                    </div>

                    <div className="dashboard-conversation-toggle-row">
                      <button
                        type="button"
                        className="dashboard-conversation-toggle"
                        onClick={() =>
                          toggleConversation(shipment.id)
                        }
                        aria-expanded={
                          selectedShipmentId === shipment.id
                        }
                      >
                        {selectedShipmentId === shipment.id
                          ? "Close conversation"
                          : "Message ParcelFlow"}
                        <span>
                          {selectedShipmentId === shipment.id
                            ? "−"
                            : "→"}
                        </span>
                      </button>
                    </div>

                    {selectedShipmentId === shipment.id && (
                      <div className="dashboard-conversation">
                        <div className="dashboard-conversation-heading">
                          <div>
                            <span className="eyebrow">
                              Shipment conversation
                            </span>
                            <h3>Talk to ParcelFlow</h3>
                          </div>

                          <span>
                            {shipment.trackingNumber}
                          </span>
                        </div>

                        {messageError && (
                          <div
                            className="dashboard-message-alert"
                            role="alert"
                          >
                            {messageError}
                          </div>
                        )}

                        {messagesLoading ? (
                          <div className="dashboard-message-empty">
                            Loading conversation…
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="dashboard-message-empty">
                            <strong>No messages yet</strong>
                            <span>
                              Send a message about this shipment
                              and the ParcelFlow team will receive
                              it.
                            </span>
                          </div>
                        ) : (
                          <div className="dashboard-message-list">
                            {messages.map((message) => (
                              <article
                                key={message.id}
                                className={`dashboard-message ${
                                  message.senderRole === "customer"
                                    ? "dashboard-message-customer"
                                    : "dashboard-message-admin"
                                }`}
                              >
                                <div className="dashboard-message-meta">
                                  <strong>
                                    {message.senderRole ===
                                    "customer"
                                      ? "You"
                                      : message.senderName ||
                                        "ParcelFlow"}
                                  </strong>

                                  <time>
                                    {formatDateTime(
                                      message.createdAt,
                                    )}
                                  </time>
                                </div>

                                <p>{message.message}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        <form
                          className="dashboard-message-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void handleSendMessage(shipment.id);
                          }}
                        >
                          <label htmlFor={`message-${shipment.id}`}>
                            Message
                          </label>

                          <textarea
                            id={`message-${shipment.id}`}
                            value={messageDraft}
                            onChange={(event) =>
                              setMessageDraft(event.target.value)
                            }
                            maxLength={5000}
                            rows={4}
                            placeholder="Ask about this shipment..."
                            disabled={messageSending}
                          />

                          <div className="dashboard-message-form-footer">
                            <span>
                              {messageDraft.length}/5000
                            </span>

                            <button
                              type="submit"
                              className="button button-primary"
                              disabled={
                                messageSending ||
                                !messageDraft.trim()
                              }
                            >
                              {messageSending
                                ? "Sending…"
                                : "Send message"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="dashboard-shipment-footer">
                      <span>
                        Created{" "}
                        {formatDate(shipment.createdAt)}
                      </span>

                      <Link
                        href={`/tracking?tracking=${encodeURIComponent(
                          shipment.trackingNumber,
                        )}`}
                      >
                        View shipment →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-panel dashboard-reports-panel">
            <div className="dashboard-panel-heading">
              <div>
                <span className="eyebrow">
                  Live report
                </span>
                <h2>Recent activity</h2>
              </div>
            </div>

            {loading ? (
              <div className="dashboard-empty dashboard-empty-compact">
                <span>Loading activity…</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="dashboard-empty dashboard-empty-compact">
                <strong>No activity yet</strong>
                <span>
                  Shipment updates will appear here.
                </span>
              </div>
            ) : (
              <div className="dashboard-report-list">
                {reports.map((report) => (
                  <article
                    className="dashboard-report-item"
                    key={`${report.shipmentId}-${report.id}`}
                  >
                    <span className="dashboard-report-dot" />

                    <div>
                      <strong>{report.title}</strong>

                      <span>
                        {report.trackingNumber}
                      </span>

                      {report.description && (
                        <p>{report.description}</p>
                      )}

                      <small>
                        {formatDateTime(
                          report.timestamp ||
                            report.createdAt,
                        )}
                        {report.location
                          ? ` · ${report.location}`
                          : ""}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </section>

        <section className="dashboard-actions">
          <div>
            <span className="eyebrow">
              ParcelFlow tools
            </span>

            <h2>What would you like to do?</h2>

            <p>
              Start a new shipment or locate an existing
              package using its tracking number.
            </p>
          </div>

          <div className="dashboard-action-grid">
            <Link
              className="dashboard-action-card"
              href="/shipping"
            >
              <span>01</span>
              <strong>Ship a package</strong>
              <small>
                Create a new domestic or international
                shipment.
              </small>
            </Link>

            <Link
              className="dashboard-action-card"
              href="/tracking"
            >
              <span>02</span>
              <strong>Track a shipment</strong>
              <small>
                Follow package movement and delivery
                events.
              </small>
            </Link>

            <Link
              className="dashboard-action-card"
              href="/services"
            >
              <span>03</span>
              <strong>Explore services</strong>
              <small>
                Review ParcelFlow delivery solutions.
              </small>
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
