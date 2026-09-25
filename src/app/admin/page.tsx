import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import AdminShipments from "@/components/admin/AdminShipments";
import AdminNotificationCenter from "@/components/admin/AdminNotificationCenter";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="page-section admin-dashboard-page">
      <div className="container">
        <div className="admin-dashboard-shell">
          <nav
            className="admin-dashboard-nav"
            aria-label="Administration navigation"
          >
            <div className="admin-dashboard-brand">
              <span
                className="admin-dashboard-brand-mark"
                aria-hidden="true"
              >
                PF
              </span>

              <span>
                <strong>ParcelFlow</strong>
                <small>Global Logistics</small>
              </span>
            </div>

            <div className="admin-dashboard-nav-links">
              <a
                className="admin-dashboard-nav-link admin-dashboard-nav-link-active"
                href="#overview"
              >
                Overview
              </a>

              <a
                className="admin-dashboard-nav-link"
                href="#shipment-operations"
              >
                Shipments
              </a>

              <a
                className="admin-dashboard-nav-link"
                href="#admin-notifications"
              >
                Notifications
              </a>
            </div>

            <div className="admin-dashboard-account">
              <span
                className="admin-dashboard-account-status"
                aria-hidden="true"
              />
              <span>
                <strong>{admin.name}</strong>
                <small>Administrator</small>
              </span>
            </div>
          </nav>

          <div id="overview" className="admin-dashboard-toolbar">
            <div className="section-heading">
              <span className="eyebrow">ADMINISTRATION</span>

              <h1>ParcelFlow Operations</h1>

              <p>
                Welcome, {admin.name}. Review shipments, process
                pending requests, manage pricing, and monitor
                customer communication.
              </p>
            </div>

            <div
              id="admin-notifications"
              className="admin-dashboard-notification-slot"
            >
              <AdminNotificationCenter />
            </div>
          </div>

          <div id="shipment-operations">
            <AdminShipments />
          </div>
        </div>
      </div>
    </main>
  );
}
