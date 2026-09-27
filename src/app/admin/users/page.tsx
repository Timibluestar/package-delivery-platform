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
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("search") ?? "";
  });

  const [shipmentFilter, setShipmentFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    const value = new URLSearchParams(window.location.search).get("shipments");
    return value === "has" || value === "none" ? value : "all";
  });

  const [activityFilter, setActivityFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    const value = new URLSearchParams(window.location.search).get("activity");
    return ["pending", "active", "delivered"].includes(value ?? "")
      ? value
      : "all";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const updateFromUrl = () => {
      const nextSearch = params.get("search") ?? "";
      const nextShipment = params.get("shipments");
      const nextActivity = params.get("activity");

      setSearch(nextSearch);
      setShipmentFilter(
        nextShipment === "has" || nextShipment === "none"
          ? nextShipment
          : "all",
      );
      setActivityFilter(
        nextActivity === "pending" ||
        nextActivity === "active" ||
        nextActivity === "delivered"
          ? nextActivity
          : "all",
      );
    };

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);

      setSearch(currentParams.get("search") ?? "");

      const nextShipment = currentParams.get("shipments");
      setShipmentFilter(
        nextShipment === "has" || nextShipment === "none"
          ? nextShipment
          : "all",
      );

      const nextActivity = currentParams.get("activity");
      setActivityFilter(
        nextActivity === "pending" ||
        nextActivity === "active" ||
        nextActivity === "delivered"
          ? nextActivity
          : "all",
      );
    };

    window.addEventListener("popstate", handlePopState);
    updateFromUrl();

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (shipmentFilter !== "all") {
      params.set("shipments", shipmentFilter);
    } else {
      params.delete("shipments");
    }

    if (activityFilter !== "all") {
      params.set("activity", activityFilter);
    } else {
      params.delete("activity");
    }

    const query = params.toString();
    const nextUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;

    const currentUrl =
      window.location.pathname +
      (window.location.search ? window.location.search : "");

    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [search, shipmentFilter, activityFilter]);

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

  const filteredCustomers = customers.filter((customer) => {
    const name =
      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      name.toLowerCase().includes(searchText) ||
      customer.email.toLowerCase().includes(searchText);

    const matchesShipment =
      shipmentFilter === "all" ||
      (shipmentFilter === "none" && customer.shipment_count === 0) ||
      (shipmentFilter === "has" && customer.shipment_count > 0);

    const matchesActivity =
      activityFilter === "all" ||
      (activityFilter === "pending" && customer.pending_shipments > 0) ||
      (activityFilter === "active" && customer.active_shipments > 0) ||
      (activityFilter === "delivered" && customer.delivered_shipments > 0);

    return matchesSearch && matchesShipment && matchesActivity;
  });

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

        {!loading && customers.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(240px, 2fr) repeat(2, minmax(180px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email..."
              aria-label="Search customers by name or email"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d7dfda",
                borderRadius: 10,
                background: "#fff",
              }}
            />

            <select
              value={shipmentFilter}
              onChange={(event) => setShipmentFilter(event.target.value)}
              aria-label="Filter by shipment count"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d7dfda",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <option value="all">All shipment counts</option>
              <option value="has">Has shipments</option>
              <option value="none">No shipments</option>
            </select>

            <select
              value={activityFilter}
              onChange={(event) => setActivityFilter(event.target.value)}
              aria-label="Filter by shipment activity"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d7dfda",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <option value="all">All activity</option>
              <option value="pending">Pending shipments</option>
              <option value="active">Active shipments</option>
              <option value="delivered">Delivered shipments</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShipmentFilter("all");
                setActivityFilter("all");
              }}
              disabled={
                !search &&
                shipmentFilter === "all" &&
                activityFilter === "all"
              }
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d7dfda",
                borderRadius: 10,
                background: "#f4f7f3",
                cursor:
                  search ||
                  shipmentFilter !== "all" ||
                  activityFilter !== "all"
                    ? "pointer"
                    : "not-allowed",
                opacity:
                  search ||
                  shipmentFilter !== "all" ||
                  activityFilter !== "all"
                    ? 1
                    : 0.55,
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && customers.length > 0 && (
          <p style={{ marginBottom: 16 }}>
            Showing <strong>{filteredCustomers.length}</strong> of{" "}
            <strong>{customers.length}</strong> customers
          </p>
        )}

        {loading ? (
          <p>Loading customer data…</p>
        ) : customers.length === 0 ? (
          <p>No registered customers found.</p>
        ) : filteredCustomers.length === 0 ? (
          <p>No customers match the selected search and filters.</p>
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
                {filteredCustomers.map((customer) => {
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
