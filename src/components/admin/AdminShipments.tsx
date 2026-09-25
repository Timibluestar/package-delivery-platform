"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Shipment = {
  id: string;
  tracking_number: string;
  shipment_type: string;
  service: string;
  status: string;
  package_description: string;
  package_weight: string | number;
  estimated_delivery: string | null;
  shipping_price: string | number | null;
  shipping_currency: string;
  price_disclosed_at: string | null;
  admin_processed_at: string | null;
  created_at: string;
  updated_at: string;

  customer_id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;

  sender_city: string | null;
  sender_country: string | null;
  recipient_city: string | null;
  recipient_country: string | null;
};

type ShipmentDetail = Shipment & {
  price_disclosed_by: string | null;
  admin_processed_by: string | null;
  sender_address_id: string | null;
  sender_first_name: string | null;
  sender_last_name: string | null;
  sender_address_line1: string | null;
  sender_city: string | null;
  sender_state: string | null;
  sender_country: string | null;
  sender_phone: string | null;
  recipient_address_id: string | null;
  recipient_first_name: string | null;
  recipient_last_name: string | null;
  recipient_address_line1: string | null;
  recipient_city: string | null;
  recipient_state: string | null;
  recipient_country: string | null;
  recipient_phone: string | null;
  events: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    location: string | null;
    created_at: string;
  }>;
  media: Array<{
    id: string;
    media_type: string;
    file_url: string;
    original_filename: string;
    mime_type: string;
    file_size: number;
    created_at: string;
  }>;
  messages: Array<{
    id: string;
    sender_role: string;
    body: string;
    created_at: string;
    customer_first_name: string | null;
    customer_last_name: string | null;
    admin_name: string | null;
  }>;
};

const statuses = [
  "pending",
  "confirmed",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatMoney(
  value: string | number | null,
  currency = "USD",
) {
  if (value === null || value === undefined || value === "") {
    return "Not disclosed";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not disclosed";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function getStatusClass(status: string) {
  return `admin-status admin-status-${status.replaceAll("_", "-")}`;
}

export default function AdminShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selected, setSelected] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("pending");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  async function loadShipments() {
    setError("");

    try {
      const response = await fetch("/api/admin/shipments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load shipments.",
        );
      }

      setShipments(data.shipments ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load shipments.",
      );
    } finally {
      setLoading(false);
    }
  }

  const openShipment = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${id}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load shipment.",
        );
      }

      const shipment = data.shipment as ShipmentDetail;

      setSelected(shipment);
      setMessageDraft("");
      setPrice(
        shipment.shipping_price === null
          ? ""
          : String(shipment.shipping_price),
      );
      setStatus(shipment.status);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load shipment.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);
  async function sendMessage() {
    if (!selected || messageSending) return;

    const message = messageDraft.trim();

    if (!message) {
      setError("Enter a message before sending.");
      return;
    }

    if (message.length > 5000) {
      setError("Message must not exceed 5000 characters.");
      return;
    }

    setMessageSending(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${selected.id}/messages`,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to send message.",
        );
      }

      setMessageDraft("");
      setActionMessage("Message sent to the customer.");

      await openShipment(selected.id);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message.",
      );
    } finally {
      setMessageSending(false);
    }
  }

  async function updateShipment(payload: Record<string, unknown>) {
    if (!selected) return;

    setSaving(true);
    setError("");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${selected.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update shipment.",
        );
      }

      setSelected(data.shipment as ShipmentDetail);
      setStatus(data.shipment.status);

      setPrice(
        data.shipment.shipping_price === null
          ? ""
          : String(data.shipment.shipping_price),
      );

      setActionMessage(
        data.message || "Shipment updated successfully.",
      );

      await loadShipments();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update shipment.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function handleOpenShipment(event: Event) {
      const customEvent = event as CustomEvent<{
        shipmentId?: string;
      }>;

      const shipmentId = customEvent.detail?.shipmentId;

      if (!shipmentId) {
        return;
      }

      void openShipment(shipmentId);
    }

    window.addEventListener(
      "parcelflow-admin-open-shipment",
      handleOpenShipment,
    );

    return () => {
      window.removeEventListener(
        "parcelflow-admin-open-shipment",
        handleOpenShipment,
      );
    };
  }, [openShipment]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialShipments() {
      try {
        const response = await fetch("/api/admin/shipments", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Unable to load shipments.");
        }

        if (!controller.signal.aborted) {
          setShipments(data.shipments ?? []);
          setError("");
        }
      } catch (loadError) {
        if (
          loadError instanceof Error &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load shipments.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInitialShipments();

    return () => {
      controller.abort();
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: shipments.length,
      pending: shipments.filter(
        (item) => item.status === "pending",
      ).length,
      active: shipments.filter((item) =>
        ["confirmed", "in_transit", "out_for_delivery"].includes(
          item.status,
        ),
      ).length,
      delivered: shipments.filter(
        (item) => item.status === "delivered",
      ).length,
    }),
    [shipments],
  );

  return (
    <div className="admin-operations">
      <div className="dashboard-grid admin-stat-grid">
        <article className="dashboard-card">
          <span className="eyebrow">TOTAL</span>
          <strong className="admin-stat-value">
            {stats.total}
          </strong>
          <p>All shipments</p>
        </article>

        <article className="dashboard-card">
          <span className="eyebrow">PENDING</span>
          <strong className="admin-stat-value">
            {stats.pending}
          </strong>
          <p>Awaiting review</p>
        </article>

        <article className="dashboard-card">
          <span className="eyebrow">ACTIVE</span>
          <strong className="admin-stat-value">
            {stats.active}
          </strong>
          <p>Currently moving</p>
        </article>

        <article className="dashboard-card">
          <span className="eyebrow">DELIVERED</span>
          <strong className="admin-stat-value">
            {stats.delivered}
          </strong>
          <p>Completed shipments</p>
        </article>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="admin-alert admin-alert-success">
          {actionMessage}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">SHIPMENT QUEUE</span>
            <h2>Shipment operations</h2>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setLoading(true);
              void loadShipments();
            }}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="admin-empty-state">
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="admin-empty-state">
            No shipments have been created yet.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <strong>{shipment.tracking_number}</strong>
                    </td>

                    <td>
                      <div>
                        {shipment.customer_first_name}{" "}
                        {shipment.customer_last_name}
                      </div>
                      <small>{shipment.customer_email}</small>
                    </td>

                    <td>
                      {shipment.sender_city || "—"} →{" "}
                      {shipment.recipient_city || "—"}
                    </td>

                    <td>
                      <span className="admin-service">
                        {shipment.service}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          shipment.status,
                        )}
                      >
                        {formatStatus(shipment.status)}
                      </span>
                    </td>

                    <td>
                      {formatMoney(
                        shipment.shipping_price,
                        shipment.shipping_currency,
                      )}
                    </td>

                    <td>{formatDate(shipment.created_at)}</td>

                    <td>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() =>
                          void openShipment(shipment.id)
                        }
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailLoading && (
        <div className="admin-alert">
          Loading shipment details...
        </div>
      )}

      {selected && !detailLoading && (
        <section className="admin-detail">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">
                SHIPMENT DETAIL
              </span>
              <h2>{selected.tracking_number}</h2>
              <p>
                Submitted {formatDate(selected.created_at)}
              </p>
            </div>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="admin-detail-grid">
            <article className="dashboard-card">
              <span className="eyebrow">CUSTOMER</span>
              <h3>
                {selected.customer_first_name}{" "}
                {selected.customer_last_name}
              </h3>
              <p>{selected.customer_email}</p>
              <p>{selected.customer_phone || "No phone provided"}</p>
            </article>

            <article className="dashboard-card">
              <span className="eyebrow">PACKAGE</span>
              <h3>{selected.package_description}</h3>
              <p>
                Weight: {selected.package_weight} kg
              </p>
              <p>
                Service: {selected.service}
              </p>
              <p>
                Type: {selected.shipment_type}
              </p>
            </article>

            <article className="dashboard-card">
              <span className="eyebrow">ROUTE</span>
              <h3>
                {selected.sender_city || "—"} →{" "}
                {selected.recipient_city || "—"}
              </h3>
              <p>
                {selected.sender_country || "—"} →{" "}
                {selected.recipient_country || "—"}
              </p>
            </article>
          </div>

          <div className="admin-detail-grid">
            <article className="dashboard-card">
              <span className="eyebrow">SHIPPING PRICE</span>

              <div className="admin-price-control">
                <label htmlFor="admin-shipping-price">
                  Price
                </label>

                <input
                  id="admin-shipping-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  placeholder="Enter price"
                />
              </div>

              <p>
                Current:{" "}
                {formatMoney(
                  selected.shipping_price,
                  selected.shipping_currency,
                )}
              </p>

              {selected.price_disclosed_at ? (
                <p>
                  Disclosed:{" "}
                  {formatDate(selected.price_disclosed_at)}
                </p>
              ) : (
                <p>Price has not been disclosed.</p>
              )}

              <div className="admin-action-row">
                <button
                  type="button"
                  className="button button-primary"
                  disabled={
                    saving ||
                    !price ||
                    Boolean(selected.price_disclosed_at)
                  }
                  onClick={() =>
                    void updateShipment({
                      shippingPrice: price,
                      processShipment: true,
                    })
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Price"}
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  disabled={
                    saving ||
                    !price ||
                    Boolean(selected.price_disclosed_at)
                  }
                  onClick={() =>
                    void updateShipment({
                      shippingPrice: price,
                      processShipment: true,
                      disclosePrice: true,
                    })
                  }
                >
                  {saving
                    ? "Processing..."
                    : "Disclose Price"}
                </button>
              </div>
            </article>

            <article className="dashboard-card">
              <span className="eyebrow">STATUS</span>

              <label htmlFor="admin-shipment-status">
                Shipment status
              </label>

              <select
                id="admin-shipment-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>

              <div className="admin-action-row">
                <button
                  type="button"
                  className="button button-primary"
                  disabled={
                    saving || status === selected.status
                  }
                  onClick={() =>
                    void updateShipment({
                      status,
                    })
                  }
                >
                  {saving
                    ? "Updating..."
                    : "Update Status"}
                </button>

                {selected.status === "pending" && (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={saving}
                    onClick={() =>
                      void updateShipment({
                        status: "confirmed",
                        processShipment: true,
                      })
                    }
                  >
                    {saving
                      ? "Processing..."
                      : "Process Shipment"}
                  </button>
                )}
              </div>
            </article>
          </div>

          <div className="admin-detail-grid">
            <article className="dashboard-card">
              <span className="eyebrow">SENDER</span>
              <h3>
                {selected.sender_first_name || "—"}{" "}
                {selected.sender_last_name || ""}
              </h3>
              <p>
                {selected.sender_address_line1 || "—"}
              </p>
              <p>
                {selected.sender_city || "—"},{" "}
                {selected.sender_state || ""}
              </p>
              <p>{selected.sender_country || "—"}</p>
              <p>{selected.sender_phone || "—"}</p>
            </article>

            <article className="dashboard-card">
              <span className="eyebrow">RECIPIENT</span>
              <h3>
                {selected.recipient_first_name || "—"}{" "}
                {selected.recipient_last_name || ""}
              </h3>
              <p>
                {selected.recipient_address_line1 || "—"}
              </p>
              <p>
                {selected.recipient_city || "—"},{" "}
                {selected.recipient_state || ""}
              </p>
              <p>{selected.recipient_country || "—"}</p>
              <p>{selected.recipient_phone || "—"}</p>
            </article>
          </div>

          <article className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">TRACKING</span>
                <h3>Shipment timeline</h3>
              </div>
            </div>

            {selected.events.length === 0 ? (
              <div className="admin-empty-state">
                No tracking events yet.
              </div>
            ) : (
              <div className="admin-timeline">
                {selected.events.map((event) => (
                  <div
                    className="admin-timeline-item"
                    key={event.id}
                  >
                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {event.description || "—"}
                      </p>
                      <small>
                        {event.location || "No location"} ·{" "}
                        {formatDate(event.created_at)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">MEDIA</span>
                <h3>Shipment media</h3>
              </div>
            </div>

            {selected.media.length === 0 ? (
              <div className="admin-empty-state">
                No shipment media uploaded.
              </div>
            ) : (
              <div className="admin-media-grid">
                {selected.media.map((media) => (
                  <a
                    href={media.file_url}
                    target="_blank"
                    rel="noreferrer"
                    key={media.id}
                    className="admin-media-card"
                  >
                    <strong>{media.media_type}</strong>
                    <span>
                      {media.original_filename}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </article>

          <article className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">CONVERSATION</span>
                <h3>Shipment messages</h3>
                <p className="admin-panel-description">
                  Communicate directly with the customer about this shipment.
                </p>
              </div>

              <button
                type="button"
                className="button button-secondary"
                disabled={detailLoading || messageSending}
                onClick={() => void openShipment(selected.id)}
              >
                {detailLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {selected.messages.length === 0 ? (
              <div className="admin-empty-state">
                No messages for this shipment yet.
              </div>
            ) : (
              <div className="admin-messages">
                {selected.messages.map((message) => (
                  <div
                    className={`admin-message admin-message-${message.sender_role}`}
                    key={message.id}
                  >
                    <strong>
                      {message.sender_role === "admin"
                        ? message.admin_name || "Administrator"
                        : `${message.customer_first_name || "Customer"} ${message.customer_last_name || ""}`}
                    </strong>

                    <p>{message.body}</p>

                    <small>
                      {formatDate(message.created_at)}
                    </small>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-message-composer">
              <label htmlFor="admin-shipment-message">
                Message customer
              </label>

              <textarea
                id="admin-shipment-message"
                className="admin-message-textarea"
                value={messageDraft}
                onChange={(event) =>
                  setMessageDraft(event.target.value)
                }
                placeholder="Write a message about this shipment..."
                maxLength={5000}
                rows={5}
                disabled={messageSending}
              />

              <div className="admin-message-composer-footer">
                <span>
                  {messageDraft.length}/5000
                </span>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void sendMessage()}
                  disabled={
                    messageSending ||
                    !messageDraft.trim()
                  }
                >
                  {messageSending
                    ? "Sending..."
                    : "Send Message"}
                </button>
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
