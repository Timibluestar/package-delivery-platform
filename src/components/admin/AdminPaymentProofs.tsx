"use client";

import { useCallback, useEffect, useState } from "react";

type PaymentProof = {
  id: string;
  shipment_id: string;
  customer_id: string;
  file_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  note: string | null;
  status: "pending" | "confirmed" | "rejected";
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  tracking_number: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function AdminPaymentProofs() {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadProofs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/payment-proofs", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load payment proofs.");
      }

      setProofs(data.paymentSubmissions || []);
      setError("");
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load payment proofs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProofs();
    }, 0);

    const interval = window.setInterval(() => {
      void loadProofs();
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadProofs]);

  async function reviewProof(
    proof: PaymentProof,
    status: "confirmed" | "rejected",
  ) {
    let rejectionReason = "";

    if (status === "rejected") {
      rejectionReason =
        window.prompt("Enter the reason for rejecting this payment proof:") ||
        "";

      rejectionReason = rejectionReason.trim();

      if (!rejectionReason) {
        return;
      }
    }

    const confirmed = window.confirm(
      status === "confirmed"
        ? `Confirm payment for shipment ${proof.tracking_number}?`
        : `Reject payment proof for shipment ${proof.tracking_number}?`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(proof.id);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/payment-proofs/${proof.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            rejectionReason,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to review payment proof.");
      }

      await loadProofs();
    } catch (reviewError) {
      console.error(reviewError);
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to review payment proof.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <section
        id="payment-proofs"
        className="admin-dashboard-panel admin-payment-proofs"
      >
        <div className="section-heading">
          <p className="eyebrow">Payments</p>
          <h2>Payment proof review</h2>
          <p>Loading customer payment submissions...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="payment-proofs"
      className="admin-dashboard-panel admin-payment-proofs"
    >
      <div className="section-heading">
        <p className="eyebrow">Payments</p>
        <h2>Payment proof review</h2>
        <p>
          Review transaction receipts submitted by customers and confirm or
          reject them.
        </p>
      </div>

      {error ? (
        <div className="admin-payment-proof-error" role="alert">
          {error}
        </div>
      ) : null}

      {proofs.length === 0 ? (
        <div className="admin-payment-proof-empty">
          No payment proofs have been submitted yet.
        </div>
      ) : (
        <div className="admin-payment-proof-list">
          {proofs.map((proof) => {
            const customerName =
              `${proof.first_name} ${proof.last_name}`.trim();

            return (
              <article
                key={proof.id}
                className="admin-payment-proof-card"
              >
                <div className="admin-payment-proof-content">
                  <div>
                    <span className="admin-payment-proof-label">
                      Shipment
                    </span>
                    <strong>{proof.tracking_number}</strong>
                  </div>

                  <div>
                    <span className="admin-payment-proof-label">
                      Customer
                    </span>
                    <strong>{customerName}</strong>
                    <small>{proof.email}</small>
                  </div>

                  <div>
                    <span className="admin-payment-proof-label">
                      File
                    </span>
                    <strong>{proof.original_filename}</strong>
                    <small>
                      {(proof.file_size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>

                  <div>
                    <span className="admin-payment-proof-label">
                      Status
                    </span>
                    <span
                      className={`admin-payment-proof-status status-${proof.status}`}
                    >
                      {proof.status}
                    </span>
                  </div>

                  {proof.note ? (
                    <div className="admin-payment-proof-note">
                      <span className="admin-payment-proof-label">
                        Customer note
                      </span>
                      <p>{proof.note}</p>
                    </div>
                  ) : null}

                  {proof.rejection_reason ? (
                    <div className="admin-payment-proof-note">
                      <span className="admin-payment-proof-label">
                        Rejection reason
                      </span>
                      <p>{proof.rejection_reason}</p>
                    </div>
                  ) : null}
                </div>

                <div className="admin-payment-proof-actions">
                  <a
                    href={`/api/payment-proofs/${proof.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="button button-secondary"
                  >
                    View proof
                  </a>

                  {proof.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={processingId === proof.id}
                        onClick={() => reviewProof(proof, "confirmed")}
                      >
                        {processingId === proof.id
                          ? "Processing..."
                          : "Confirm payment"}
                      </button>

                      <button
                        type="button"
                        className="button button-danger"
                        disabled={processingId === proof.id}
                        onClick={() => reviewProof(proof, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
