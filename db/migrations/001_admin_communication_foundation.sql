-- ParcelFlow admin, pricing, messaging, and notification foundation

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(160) NOT NULL,

    role VARCHAR(30) NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin', 'manager')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_id UUID NOT NULL
        REFERENCES admins(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(12,2);

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS shipping_currency VARCHAR(3) NOT NULL DEFAULT 'USD';

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS price_disclosed_at TIMESTAMPTZ;

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS price_disclosed_by UUID
        REFERENCES admins(id)
        ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS shipment_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shipment_id UUID NOT NULL
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    customer_id UUID
        REFERENCES customers(id)
        ON DELETE SET NULL,

    admin_id UUID
        REFERENCES admins(id)
        ON DELETE SET NULL,

    sender_role VARCHAR(20) NOT NULL
        CHECK (sender_role IN ('customer', 'admin')),

    body TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT shipment_messages_sender_check
        CHECK (
            (sender_role = 'customer' AND customer_id IS NOT NULL AND admin_id IS NULL)
            OR
            (sender_role = 'admin' AND admin_id IS NOT NULL AND customer_id IS NULL)
        )
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID
        REFERENCES customers(id)
        ON DELETE CASCADE,

    admin_id UUID
        REFERENCES admins(id)
        ON DELETE CASCADE,

    shipment_id UUID
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notifications_recipient_check
        CHECK (
            (customer_id IS NOT NULL AND admin_id IS NULL)
            OR
            (customer_id IS NULL AND admin_id IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id
    ON admin_sessions(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
    ON admin_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_shipments_price_disclosed_at
    ON shipments(price_disclosed_at);

CREATE INDEX IF NOT EXISTS idx_shipments_price_disclosed_by
    ON shipments(price_disclosed_by);

CREATE INDEX IF NOT EXISTS idx_shipment_messages_shipment_id
    ON shipment_messages(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_messages_customer_id
    ON shipment_messages(customer_id);

CREATE INDEX IF NOT EXISTS idx_shipment_messages_admin_id
    ON shipment_messages(admin_id);

CREATE INDEX IF NOT EXISTS idx_shipment_messages_created_at
    ON shipment_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_customer_id
    ON notifications(customer_id);

CREATE INDEX IF NOT EXISTS idx_notifications_admin_id
    ON notifications(admin_id);

CREATE INDEX IF NOT EXISTS idx_notifications_shipment_id
    ON notifications(shipment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_customer
    ON notifications(customer_id, read_at, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_admin
    ON notifications(admin_id, read_at, created_at);
