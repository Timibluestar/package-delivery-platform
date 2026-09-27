"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Stats = {
  pending: number;
  sent: number;
  failed: number;
  total: number;
};

type Activity = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

type MailData = {
  stats: Stats;
  activity: Activity[];
  customers: Customer[];
};

export default function AdminMailComposer() {
  const [data, setData] = useState<MailData | null>(null);
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadMail() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/mail", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to load mail data.");
      }

      setData({
        stats: result.stats,
        activity: result.activity,
        customers: result.customers,
      });
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load the mail center.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeMail() {
      try {
        setLoading(true);

        const response = await fetch("/api/admin/mail", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ?? "Unable to load mail data.",
          );
        }

        if (!cancelled) {
          setData({
            stats: result.stats,
            activity: result.activity,
            customers: result.customers,
          });
          setFeedback("");
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback(
            error instanceof Error
              ? error.message
              : "Unable to load the mail center.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeMail();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return data.customers;
    }

    return data.customers.filter((customer) =>
      [
        customer.first_name,
        customer.last_name,
        customer.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data, search]);

  const recipientCount =
    audience === "all"
      ? Math.min(data?.customers.length ?? 0, 500)
      : selectedIds.length;

  function toggleCustomer(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= 500
          ? current
          : [...current, id],
    );
  }

  function selectVisible() {
    const visibleIds = filteredCustomers
      .slice(0, 500)
      .map((customer) => customer.id);

    setSelectedIds((current) => [
      ...new Set([...current, ...visibleIds]),
    ].slice(0, 500));
  }

  function clearSelected() {
    setSelectedIds([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending) {
      return;
    }

    setFeedback("");
    setSending(true);

    try {
      const response = await fetch("/api/admin/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audience,
          customerIds: audience === "selected" ? selectedIds : [],
          subject,
          message,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to send the message.");
      }

      setFeedback(result.message);
      setSubject("");
      setMessage("");
      setSelectedIds([]);

      await loadMail();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to send the message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="admin-mail-compose">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">BULK MESSAGE</span>
            <h2>Send a customer message</h2>
            <p>
              Queue a message for ParcelFlow customers. Delivery is handled
              by the existing email worker.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="admin-mail-form">
          <div className="admin-mail-field">
            <label htmlFor="mail-audience">Audience</label>
            <select
              id="mail-audience"
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as "all" | "selected")
              }
            >
              <option value="all">
                All customers ({recipientCount})
              </option>
              <option value="selected">
                Selected customers ({selectedIds.length})
              </option>
            </select>
          </div>

          {audience === "selected" && (
            <div className="admin-mail-recipient-picker">
              <div className="admin-mail-picker-toolbar">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customers..."
                  aria-label="Search customers"
                />

                <div className="admin-mail-picker-actions">
                  <button type="button" onClick={selectVisible}>
                    Select visible
                  </button>
                  <button type="button" onClick={clearSelected}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="admin-mail-customer-list">
                {filteredCustomers.length === 0 ? (
                  <div className="admin-empty-state">
                    <strong>No customers found.</strong>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <label
                      key={customer.id}
                      className="admin-mail-customer-row"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                      />
                      <span>
                        <strong>
                          {customer.first_name} {customer.last_name}
                        </strong>
                        <small>{customer.email}</small>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="admin-mail-field">
            <label htmlFor="mail-subject">Subject</label>
            <input
              id="mail-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={300}
              placeholder="Important update from ParcelFlow"
              required
            />
          </div>

          <div className="admin-mail-field">
            <label htmlFor="mail-message">Message</label>
            <textarea
              id="mail-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={5000}
              rows={10}
              placeholder="Write your message..."
              required
            />
            <small>{message.length}/5000 characters</small>
          </div>

          <div className="admin-mail-submit-row">
            <div>
              <strong>{recipientCount}</strong>{" "}
              recipient{recipientCount === 1 ? "" : "s"} will be queued.
            </div>

            <button
              className="admin-primary-button"
              type="submit"
              disabled={sending || recipientCount === 0}
            >
              {sending ? "Queueing..." : "Send bulk message"}
            </button>
          </div>

          {feedback && (
            <div className="admin-mail-feedback" role="status">
              {feedback}
            </div>
          )}
        </form>
      </section>

      <section className="admin-mail-grid">
        <article className="dashboard-card">
          <span className="eyebrow">OUTBOX</span>
          <strong className="admin-stat-value">
            {loading ? "—" : data?.stats.pending ?? 0}
          </strong>
          <p>Emails waiting to be processed.</p>
        </article>

        <article className="dashboard-card">
          <span className="eyebrow">SENT</span>
          <strong className="admin-stat-value">
            {loading ? "—" : data?.stats.sent ?? 0}
          </strong>
          <p>Successfully processed emails.</p>
        </article>

        <article className="dashboard-card">
          <span className="eyebrow">FAILED</span>
          <strong className="admin-stat-value">
            {loading ? "—" : data?.stats.failed ?? 0}
          </strong>
          <p>Emails requiring attention.</p>
        </article>
      </section>

      <section className="admin-panel admin-mail-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">EMAIL OUTBOX</span>
            <h2>Recent mail activity</h2>
          </div>
        </div>

        <div className="admin-mail-activity">
          {!data || data.activity.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No mail activity yet.</strong>
              <p>
                Bulk messages and transactional notifications will appear
                here after they are queued.
              </p>
            </div>
          ) : (
            data.activity.map((item) => (
              <div className="admin-mail-activity-row" key={item.id}>
                <div>
                  <strong>{item.subject}</strong>
                  <span>
                    {item.recipient_name
                      ? `${item.recipient_name} · `
                      : ""}
                    {item.recipient_email}
                  </span>
                  {item.last_error ? (
                    <small className="admin-mail-error">
                      Attempt {item.attempts}: {item.last_error}
                    </small>
                  ) : null}
                </div>

                <div className={`admin-mail-status ${item.status}`}>
                  {item.status}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
