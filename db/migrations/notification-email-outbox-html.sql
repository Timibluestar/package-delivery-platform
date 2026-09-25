ALTER TABLE notification_email_outbox
ADD COLUMN IF NOT EXISTS html_body TEXT;
