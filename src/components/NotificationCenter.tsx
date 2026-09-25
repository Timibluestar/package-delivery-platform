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

type NotificationCenterProps = {
  onOpenShipment?: (shipmentId: string) => void | Promise<void>;
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

export default function NotificationCenter({
  onOpenShipment,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
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
      // Notification failures should not block the dashboard.
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
    const notification = notifications.find(
      (item) => item.id === id,
    );

    if (!notification || notification.read_at) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnread((current) => Math.max(0, current - 1));
    } catch {
      // Keep notification display usable if marking read fails.
    }
  }

  async function handleNotificationOpen(
    notification: NotificationItem,
  ) {
    if (!notification.read_at) {
      await markRead(notification.id);
    }

    if (notification.shipment_id && onOpenShipment) {
      setOpen(false);
      await onOpenShipment(notification.shipment_id);
    }
  }

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Notifications${
          unread ? `, ${unread} unread` : ""
        }`}
      >
        <span
          className="notification-trigger-icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
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

        <span>Notifications</span>

        {unread > 0 && (
          <span className="notification-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-heading">
            <div>
              <span className="eyebrow">ACCOUNT UPDATES</span>
              <h3>Notifications</h3>
            </div>

            <span className="notification-unread">
              {unread} unread
            </span>
          </div>

          {loading ? (
            <div className="notification-empty">
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <strong>You’re all caught up.</strong>
              <span>
                Shipment updates and messages will appear here.
              </span>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item ${
                    notification.read_at
                      ? "notification-item-read"
                      : "notification-item-unread"
                  }`}
                  onClick={() =>
                    void handleNotificationOpen(notification)
                  }
                >
                  <span className="notification-item-dot" />

                  <span className="notification-item-content">
                    <strong>{notification.title}</strong>

                    <span>{notification.message}</span>

                    <small>
                      {notification.tracking_number
                        ? `${notification.tracking_number} · `
                        : ""}
                      {formatDate(notification.created_at)}
                    </small>

                    {notification.shipment_id && (
                      <small className="notification-item-action">
                        Open shipment →
                      </small>
                    )}
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
