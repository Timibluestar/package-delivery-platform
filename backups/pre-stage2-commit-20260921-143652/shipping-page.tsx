"use client";

import { FormEvent, useState } from "react";

type FormState = {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderCountry: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientCountry: string;
  description: string;
  weightKg: string;
  service: "standard" | "express" | "business";
  shipmentType: "domestic" | "international";
};

const initialForm: FormState = {
  senderName: "",
  senderEmail: "",
  senderPhone: "",
  senderAddress: "",
  senderCity: "",
  senderCountry: "",
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
  recipientAddress: "",
  recipientCity: "",
  recipientCountry: "",
  description: "",
  weightKg: "",
  service: "standard",
  shipmentType: "international",
};

export default function ShippingPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setTrackingNumber("");

    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipmentType: form.shipmentType,
          service: form.service,

          sender: {
            name: form.senderName,
            email: form.senderEmail,
            phone: form.senderPhone,
            address: form.senderAddress,
            city: form.senderCity,
            country: form.senderCountry,
          },

          recipient: {
            name: form.recipientName,
            email: form.recipientEmail,
            phone: form.recipientPhone,
            address: form.recipientAddress,
            city: form.recipientCity,
            country: form.recipientCountry,
          },

          package: {
            description: form.description,
            weightKg: Number(form.weightKg),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to create shipment.");
      }

      setMessage(
        "Shipment created successfully. Keep your tracking number safe.",
      );
      setTrackingNumber(result.shipment.trackingNumber);
      setForm(initialForm);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create shipment.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "shipping-input";

  return (
    <main className="inner-page shipping-page">
      <div className="inner-page-container">
        <section className="inner-page-intro">
          <p className="eyebrow">Create a shipment</p>
          <h1>Send something that matters.</h1>
          <p>
            Enter the shipment details below. ParcelFlow will create a unique
            tracking number for your package.
          </p>
        </section>

        <form className="shipping-form" onSubmit={submit}>
          <section className="shipping-card">
            <div className="shipping-card-heading">
              <span>01</span>
              <div>
                <h2>Shipment type</h2>
                <p>Choose the delivery workflow for this package.</p>
              </div>
            </div>

            <div className="shipping-choice-grid">
              <label className="shipping-choice">
                <input
                  type="radio"
                  name="shipmentType"
                  checked={form.shipmentType === "international"}
                  onChange={() => update("shipmentType", "international")}
                />
                <span>
                  <strong>International</strong>
                  <small>Across countries and borders</small>
                </span>
              </label>

              <label className="shipping-choice">
                <input
                  type="radio"
                  name="shipmentType"
                  checked={form.shipmentType === "domestic"}
                  onChange={() => update("shipmentType", "domestic")}
                />
                <span>
                  <strong>Domestic</strong>
                  <small>Within the same country</small>
                </span>
              </label>
            </div>

            <label className="shipping-field">
              <span>Service</span>
              <select
                value={form.service}
                onChange={(event) =>
                  update(
                    "service",
                    event.target.value as FormState["service"],
                  )
                }
              >
                <option value="standard">Standard shipping</option>
                <option value="express">Express delivery</option>
                <option value="business">Business logistics</option>
              </select>
            </label>
          </section>

          <section className="shipping-card">
            <div className="shipping-card-heading">
              <span>02</span>
              <div>
                <h2>Sender details</h2>
                <p>Where should the package be collected?</p>
              </div>
            </div>

            <div className="shipping-grid">
              <label className="shipping-field">
                <span>Full name</span>
                <input
                  className={inputClass}
                  value={form.senderName}
                  onChange={(event) =>
                    update("senderName", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Email</span>
                <input
                  className={inputClass}
                  type="email"
                  value={form.senderEmail}
                  onChange={(event) =>
                    update("senderEmail", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Phone</span>
                <input
                  className={inputClass}
                  value={form.senderPhone}
                  onChange={(event) =>
                    update("senderPhone", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Country</span>
                <input
                  className={inputClass}
                  value={form.senderCountry}
                  onChange={(event) =>
                    update("senderCountry", event.target.value)
                  }
                  placeholder="Nigeria"
                  required
                />
              </label>

              <label className="shipping-field shipping-field-wide">
                <span>Address</span>
                <input
                  className={inputClass}
                  value={form.senderAddress}
                  onChange={(event) =>
                    update("senderAddress", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>City</span>
                <input
                  className={inputClass}
                  value={form.senderCity}
                  onChange={(event) =>
                    update("senderCity", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>

          <section className="shipping-card">
            <div className="shipping-card-heading">
              <span>03</span>
              <div>
                <h2>Recipient details</h2>
                <p>Where should the package be delivered?</p>
              </div>
            </div>

            <div className="shipping-grid">
              <label className="shipping-field">
                <span>Full name</span>
                <input
                  className={inputClass}
                  value={form.recipientName}
                  onChange={(event) =>
                    update("recipientName", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Email</span>
                <input
                  className={inputClass}
                  type="email"
                  value={form.recipientEmail}
                  onChange={(event) =>
                    update("recipientEmail", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Phone</span>
                <input
                  className={inputClass}
                  value={form.recipientPhone}
                  onChange={(event) =>
                    update("recipientPhone", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Country</span>
                <input
                  className={inputClass}
                  value={form.recipientCountry}
                  onChange={(event) =>
                    update("recipientCountry", event.target.value)
                  }
                  placeholder="United Kingdom"
                  required
                />
              </label>

              <label className="shipping-field shipping-field-wide">
                <span>Address</span>
                <input
                  className={inputClass}
                  value={form.recipientAddress}
                  onChange={(event) =>
                    update("recipientAddress", event.target.value)
                  }
                  required
                />
              </label>

              <label className="shipping-field">
                <span>City</span>
                <input
                  className={inputClass}
                  value={form.recipientCity}
                  onChange={(event) =>
                    update("recipientCity", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>

          <section className="shipping-card">
            <div className="shipping-card-heading">
              <span>04</span>
              <div>
                <h2>Package details</h2>
                <p>Tell us what is being shipped.</p>
              </div>
            </div>

            <div className="shipping-grid">
              <label className="shipping-field shipping-field-wide">
                <span>Package description</span>
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  placeholder="Documents, clothing, electronics..."
                  required
                />
              </label>

              <label className="shipping-field">
                <span>Weight (kg)</span>
                <input
                  className={inputClass}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.weightKg}
                  onChange={(event) =>
                    update("weightKg", event.target.value)
                  }
                  required
                />
              </label>
            </div>

            <button className="shipping-submit" type="submit" disabled={loading}>
              {loading ? "Creating shipment..." : "Create shipment →"}
            </button>

            {message && <div className="shipping-message">{message}</div>}

            {trackingNumber && (
              <div className="shipping-success">
                <span>Your tracking number</span>
                <strong>{trackingNumber}</strong>
                <a href={`/tracking?number=${trackingNumber}`}>
                  Track this shipment →
                </a>
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}
