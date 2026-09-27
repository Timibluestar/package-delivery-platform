"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string | null;
  created_at: string;
  shipment_count: number;
  pending_shipments: number;
  active_shipments: number;
  delivered_shipments: number;
  cancelled_shipments: number;
};

type Summary = {
  total_users: number;
  active_users: number;
  new_this_month: number;
  users_with_shipments: number;
};

export default function AdminUsersPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load users.");
        }

        if (!cancelled) {
          setSummary(data.summary);
          setCustomers(data.customers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load users.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container" style={{ paddingTop: 140, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin">← Back to Overview</Link>

        <p style={{ marginTop: 20, marginBottom: 8 }}>ADMIN</p>

        <h1>Users</h1>

        <p>
          Registered customers, account activity, and shipment activity.
        </p>
      </div>

      {error && (
        <div
          className="admin-card"
          style={{ marginBottom: 24 }}
          role="alert"
        >
          {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        <div className="admin-card">
          <p>Total Registered Users</p>
          <strong>{loading ? "…" : summary?.total_users ?? 0}</strong>
        </div>

        <div className="admin-card">
          <p>Active Users</p>
          <strong>{loading ? "…" : summary?.active_users ?? 0}</strong>
        </div>

        <div className="admin-card">
          <p>New This Month</p>
          <strong>{loading ? "…" : summary?.new_this_month ?? 0}</strong>
        </div>

        <div className="admin-card">
          <p>Users With Shipments</p>
          <strong>
            {loading ? "…" : summary?.users_with_shipments ?? 0}
          </strong>
        </div>
      </section>

      <section className="admin-card">
        <div style={{ marginBottom: 20 }}>
          <h2>Recent registrations</h2>
          <p>
            Showing the latest registered customers and their shipment
            activity.
          </p>
        </div>

        {loading ? (
          <p>Loading customer data…</p>
        ) : customers.length === 0 ? (
          <p>No registered customers found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 850,
              }}
            >
              <thead>
                <tr>
                  <th align="left">Customer</th>
                  <th align="left">Email</th>
                  <th align="left">Registered</th>
                  <th align="left">Shipments</th>
                  <th align="left">Activity</th>
                  <th align="left">Status</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const name =
                    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
                    "Unnamed customer";

                  return (
                    <tr key={customer.id}>
                      <td>{name}</td>

                      <td>{customer.email}</td>

                      <td>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>

                      <td>
                        <strong>{customer.shipment_count}</strong>
                      </td>

                      <td>
                        <small>
                          {customer.pending_shipments} pending ·{" "}
                          {customer.active_shipments} active ·{" "}
                          {customer.delivered_shipments} delivered
                        </small>
                      </td>

                      <td>
                        {customer.status || "active"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
