CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(150),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120),
    postal_code VARCHAR(40),
    country VARCHAR(120) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    tracking_number VARCHAR(40) NOT NULL UNIQUE,

    shipment_type VARCHAR(20) NOT NULL
        CHECK (shipment_type IN ('domestic', 'international')),

    service VARCHAR(20) NOT NULL
        CHECK (service IN ('standard', 'express', 'business')),

    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'in_transit',
                'out_for_delivery',
                'delivered',
                'cancelled'
            )
        ),

    sender_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    recipient_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,

    package_description TEXT NOT NULL,
    package_weight NUMERIC(10,2) NOT NULL CHECK (package_weight > 0),

    estimated_delivery TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,

    location VARCHAR(200),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_id
    ON shipments(customer_id);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number
    ON shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id
    ON shipment_events(shipment_id);

CREATE INDEX IF NOT EXISTS idx_sessions_customer_id
    ON sessions(customer_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
    ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS shipment_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shipment_id UUID NOT NULL
        REFERENCES shipments(id)
        ON DELETE CASCADE,

    media_type VARCHAR(40) NOT NULL
        CHECK (
            media_type IN (
                'package_item',
                'package_photo',
                'receiver_photo'
            )
        ),

    file_url TEXT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_media_shipment_id
    ON shipment_media(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_media_type
    ON shipment_media(media_type);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
        REFERENCES customers(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_customer_id
    ON password_reset_tokens(customer_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
    ON password_reset_tokens(expires_at);

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

/*
 * ParcelFlow admin shipment operations
 *
 * Pricing is intentionally not collected during customer shipment creation.
 * The shipment remains pending until the admin reviews/processes it and
 * communicates the final shipment price to the customer.
 */

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(12,2);

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS shipping_currency VARCHAR(10)
        NOT NULL DEFAULT 'USD';

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS price_disclosed_at TIMESTAMPTZ;

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS price_disclosed_by UUID;

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS admin_processed_at TIMESTAMPTZ;

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS admin_processed_by UUID;

CREATE INDEX IF NOT EXISTS idx_shipments_status
    ON shipments(status);

CREATE INDEX IF NOT EXISTS idx_shipments_price_disclosed
    ON shipments(price_disclosed_at);

CREATE INDEX IF NOT EXISTS idx_shipments_admin_processed
    ON shipments(admin_processed_at);

