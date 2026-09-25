"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

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

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(
      `Server returned an empty response (HTTP ${response.status}).`,
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}).`,
    );
  }
}

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
  const [packageFiles, setPackageFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const result = await readJsonResponse<{ authenticated?: boolean }>(
          response,
        );

        if (active) {
          setAuthenticated(Boolean(result.authenticated));
        }
      } catch {
        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setAuthChecking(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      active = false;
    };
  }, []);

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

      const result = await readJsonResponse<{
        message?: string;
        shipment?: {
          id: string;
          trackingNumber: string;
        };
      }>(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to create shipment.");
      }

      if (!result.shipment?.id || !result.shipment.trackingNumber) {
        throw new Error(
          "Shipment was created, but the server returned incomplete shipment data.",
        );
      }

      setMessage(
        "Shipment created successfully. Keep your tracking number safe.",
      );
      setTrackingNumber(result.shipment.trackingNumber);

      if (packageFiles.length > 0) {
        setUploadingMedia(true);

        try {
          for (const file of packageFiles) {
            const mediaForm = new FormData();

            mediaForm.append(
              "shipmentId",
              result.shipment.id,
            );

            mediaForm.append(
              "mediaType",
              file.type.startsWith("image/")
                ? "package_item"
                : "package_photo",
            );

            mediaForm.append("file", file);

            const mediaResponse = await fetch(
              "/api/shipments/media",
              {
                method: "POST",
                body: mediaForm,
              },
            );

            const mediaResult = await readJsonResponse<{
              message?: string;
            }>(mediaResponse);

            if (!mediaResponse.ok) {
              throw new Error(
                mediaResult.message ||
                  "Shipment created, but a package file could not be uploaded.",
              );
            }
          }

          setMessage(
            "Shipment created successfully and package files uploaded.",
          );
        } catch (mediaError) {
          setMessage(
            mediaError instanceof Error
              ? mediaError.message
              : "Shipment created, but package files could not be uploaded.",
          );
        } finally {
          setUploadingMedia(false);
        }
      }

      setPackageFiles([]);
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
  const authRedirect = encodeURIComponent("/shipping");

  if (authChecking) {
    return (
      <main className="inner-page shipping-page">
        <div className="inner-page-container">
          <section className="inner-page-intro">
            <p className="eyebrow">Create a shipment</p>
            <h1>Preparing your shipping workspace.</h1>
            <p>
              Checking your customer account before we open the shipment
              form.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="inner-page shipping-page">
        <div className="inner-page-container">
          <section className="inner-page-intro">
            <p className="eyebrow">Customer account required</p>
            <h1>Sign in before creating your shipment.</h1>
            <p>
              Your shipment is securely linked to your ParcelFlow customer
              account so you can manage and track it after creation.
            </p>
          </section>

          <section className="shipping-card shipping-auth-card">
            <div className="shipping-card-heading">
              <span>01</span>
              <div>
                <h2>Continue to shipping</h2>
                <p>
                  Sign in if you already have an account, or create one to
                  start shipping.
                </p>
              </div>
            </div>

            <div className="shipping-auth-actions">
              <Link
                className="shipping-submit"
                href={`/login?redirect=${authRedirect}`}
              >
                Sign in to continue →
              </Link>

              <Link
                className="shipping-auth-secondary"
                href={`/register?redirect=${authRedirect}`}
              >
                Create an account
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

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

            <div className="shipping-upload">
              <div className="shipping-upload-heading">
                <strong>Items to be delivered</strong>
                <span>
                  Upload photos or a PDF describing the package contents.
                </span>
              </div>

              <input
                className="shipping-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                onChange={(event) =>
                  setPackageFiles(
                    Array.from(event.target.files ?? []).slice(0, 5),
                  )
                }
              />

              {packageFiles.length > 0 && (
                <div className="shipping-upload-list">
                  {packageFiles.map((file) => (
                    <span key={`${file.name}-${file.size}`}>
                      {file.name}
                    </span>
                  ))}
                </div>
              )}

              <small>
                Up to 5 files. Maximum 10 MB per file.
              </small>
            </div>

            <button
              className="shipping-submit"
              type="submit"
              disabled={loading || uploadingMedia}
            >
              {loading
                ? "Creating shipment..."
                : uploadingMedia
                  ? "Uploading package files..."
                  : "Create shipment →"}
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
