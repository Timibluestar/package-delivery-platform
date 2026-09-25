CREATE TABLE IF NOT EXISTS notification_email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email VARCHAR(320) NOT NULL,
    recipient_name VARCHAR(200),
    subject VARCHAR(300) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'sent', 'failed')),
    provider_message_id VARCHAR(200),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_email_outbox_notification_unique
  ON notification_email_outbox(notification_id);
