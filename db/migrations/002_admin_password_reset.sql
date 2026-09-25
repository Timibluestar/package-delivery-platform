CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    admin_id UUID NOT NULL
        REFERENCES admins(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_admin_id
    ON admin_password_reset_tokens(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_expires_at
    ON admin_password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_password_reset_tokens_token_hash
    ON admin_password_reset_tokens(token_hash);
