-- Add the shipment processing fields required by the admin operations workflow.

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS admin_processed_at TIMESTAMPTZ;

ALTER TABLE shipments
    ADD COLUMN IF NOT EXISTS admin_processed_by UUID
        REFERENCES admins(id)
        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_admin_processed
    ON shipments(admin_processed_at);

CREATE INDEX IF NOT EXISTS idx_shipments_admin_processed_by
    ON shipments(admin_processed_by);
