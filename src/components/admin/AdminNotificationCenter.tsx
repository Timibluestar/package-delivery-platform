"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  shipment_id: string | null;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  tracking_number: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      // Notification failures should not block operations.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  async function markRead(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnread((current) => Math.max(0, current - 1));
    } catch {
      // Keep notification display usable if marking read fails.
    }
  }

  function handleNotificationOpen(notification: NotificationItem) {
    if (!notification.read_at) {
      void markRead(notification.id);
    }

    if (!notification.shipment_id) {
      return;
    }

    setOpen(false);

    window.dispatchEvent(
      new CustomEvent("parcelflow-admin-open-shipment", {
        detail: {
          shipmentId: notification.shipment_id,
        },
      }),
    );
  }

  return (
    <div className="admin-notification-center">
      <button
        type="button"
        className={`admin-notification-trigger ${
          unread > 0 ? "admin-notification-trigger-alert" : ""
        }`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <span className="admin-notification-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </span>

        <span className="admin-notification-trigger-label">
          Notifications
        </span>

        {unread > 0 && (
          <span
            className="admin-notification-badge"
            aria-label={`${unread} unread`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="admin-notification-panel">
          <div className="admin-notification-heading">
            <div>
              <span className="eyebrow">OPERATIONS</span>
              <h3>Notifications</h3>
            </div>

            <span className="admin-notification-count">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </span>
          </div>

          {loading ? (
            <div className="admin-notification-empty">
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="admin-notification-empty">
              <strong>You&apos;re all caught up.</strong>
              <span>
                New shipments and customer messages will appear here.
              </span>
            </div>
          ) : (
            <div className="admin-notification-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`admin-notification-item ${
                    notification.read_at
                      ? "admin-notification-item-read"
                      : "admin-notification-item-unread"
                  } ${
                    notification.shipment_id
                      ? "admin-notification-item-clickable"
                      : ""
                  }`}
                  onClick={() =>
                    handleNotificationOpen(notification)
                  }
                >
                  <span className="admin-notification-dot" />

                  <span className="admin-notification-content">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>

                    <small>
                      {notification.tracking_number
                        ? `${notification.tracking_number} · `
                        : ""}
                      {formatDate(notification.created_at)}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
