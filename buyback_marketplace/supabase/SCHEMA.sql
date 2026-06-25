-- =============================================================================
-- BuyBack Marketplace — Universal Database Schema
-- =============================================================================
-- Multi-tenant Apple device buyback marketplace
-- Run once on fresh Supabase project
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for geospatial pincode queries

-- =============================================================================
-- 1. USERS & AUTH
-- =============================================================================

-- app_users extends Supabase auth.users with role + business link
CREATE TABLE public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'business_owner', 'agent', 'super_admin')),
    business_id UUID,  -- filled for business_owner (their biz) or agent (employer biz)
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_role ON public.app_users(role);
CREATE INDEX idx_app_users_business_id ON public.app_users(business_id);

-- =============================================================================
-- 2. BUSINESSES (Multi-Tenant Core)
-- =============================================================================

CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.app_users(id),
    business_name TEXT NOT NULL,
    legal_name TEXT,
    gst_number TEXT,
    pan_number TEXT,

    -- Contact & location
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    -- Service area
    pincodes_served TEXT[] DEFAULT '{}',
    operating_radius_km INTEGER DEFAULT 25,

    -- Google My Business integration
    gmb_place_id TEXT,
    gmb_url TEXT,
    gmb_rating DECIMAL(2, 1),
    gmb_review_count INTEGER,
    gmb_last_synced TIMESTAMPTZ,

    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.app_users(id),

    -- Branding
    logo_url TEXT,
    description TEXT,

    -- Commission
    commission_rate DECIMAL(5, 2) DEFAULT 5.00,  -- percent

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK from app_users.business_id → businesses.id (added after both tables exist)
ALTER TABLE public.app_users
    ADD CONSTRAINT fk_app_users_business
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_businesses_pincodes ON public.businesses USING GIN(pincodes_served);

-- =============================================================================
-- 3. DEVICE CATALOG (Shared across all businesses)
-- =============================================================================

CREATE TABLE public.device_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,  -- 'Apple'
    category TEXT NOT NULL,  -- 'MacBook', 'iPad'
    display_order INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(brand, category)
);

CREATE TABLE public.device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.device_categories(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,  -- 'MacBook Pro 14" M3'
    model_year INTEGER,
    chip TEXT,  -- 'M1', 'M2', 'M3', 'Intel i5'
    screen_size DECIMAL(3, 1),  -- 14.0
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_models_category ON public.device_models(category_id);

CREATE TABLE public.device_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
    storage TEXT,  -- '256GB'
    ram TEXT,      -- '8GB'
    color TEXT,    -- 'Space Gray'
    platform_base_price INTEGER NOT NULL DEFAULT 0,  -- platform-suggested default
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(model_id, storage, ram, color)
);

CREATE INDEX idx_device_variants_model ON public.device_variants(model_id);

-- =============================================================================
-- 4. BUSINESS-SPECIFIC PRICING (Multi-Tenant Overrides)
-- =============================================================================

CREATE TABLE public.business_variant_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.device_variants(id) ON DELETE CASCADE,
    base_price INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, variant_id)
);

CREATE INDEX idx_business_variant_prices_business ON public.business_variant_prices(business_id);
CREATE INDEX idx_business_variant_prices_variant ON public.business_variant_prices(variant_id);

CREATE TABLE public.business_condition_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    condition_name TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    deduction_type TEXT NOT NULL DEFAULT 'FLAT' CHECK (deduction_type IN ('PERCENT', 'FLAT', 'SCRAP_TRIGGER')),
    impact_level TEXT NOT NULL DEFAULT 'MINOR' CHECK (impact_level IN ('CRITICAL', 'MINOR', 'BONUS')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, category, condition_name)
);

CREATE INDEX idx_business_condition_deductions_business ON public.business_condition_deductions(business_id);
CREATE INDEX idx_business_condition_deductions_category ON public.business_condition_deductions(category);

-- =============================================================================
-- 5. SELL REQUESTS (Customer Listings)
-- =============================================================================

CREATE TABLE public.sell_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.app_users(id),
    variant_id UUID NOT NULL REFERENCES public.device_variants(id),

    -- Customer-provided condition answers (JSONB for flexibility)
    condition_answers JSONB NOT NULL DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    serial_number TEXT,
    description TEXT,

    -- Pickup details
    pickup_address_line1 TEXT,
    pickup_address_line2 TEXT,
    pickup_city TEXT,
    pickup_pincode TEXT,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    pickup_date DATE,
    pickup_slot TEXT,

    -- Matching
    selected_business_id UUID REFERENCES public.businesses(id),
    selected_quote_id UUID,

    -- Pricing
    customer_estimated_price INTEGER,  -- platform's estimate shown before quotes
    final_price INTEGER,
    platform_commission INTEGER,
    business_payout INTEGER,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'draft',
        'quote_requested',
        'quotes_received',
        'business_selected',
        'pickup_scheduled',
        'agent_assigned',
        'agent_en_route',
        'agent_arrived',
        'device_verified',
        'completed',
        'cancelled',
        'rejected'
    )),
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sell_requests_customer ON public.sell_requests(customer_id);
CREATE INDEX idx_sell_requests_business ON public.sell_requests(selected_business_id);
CREATE INDEX idx_sell_requests_status ON public.sell_requests(status);
CREATE INDEX idx_sell_requests_created ON public.sell_requests(created_at DESC);

-- =============================================================================
-- 6. QUOTES (Business offers for each sell_request)
-- =============================================================================

CREATE TABLE public.quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

    quoted_price INTEGER NOT NULL,
    base_price INTEGER NOT NULL,
    deductions_breakdown JSONB DEFAULT '[]',  -- [{category, condition, amount}]
    notes TEXT,

    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired', 'withdrawn')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(sell_request_id, business_id)
);

CREATE INDEX idx_quote_requests_sell ON public.quote_requests(sell_request_id);
CREATE INDEX idx_quote_requests_business ON public.quote_requests(business_id);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);

-- =============================================================================
-- 7. AGENTS (Business Employees)
-- =============================================================================

CREATE TABLE public.business_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    agent_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,

    invited_email TEXT NOT NULL,
    invited_phone TEXT,
    invite_token TEXT,
    invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'declined', 'revoked')),

    is_active BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES public.app_users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    UNIQUE(business_id, invited_email)
);

CREATE INDEX idx_business_agents_business ON public.business_agents(business_id);
CREATE INDEX idx_business_agents_user ON public.business_agents(agent_user_id);

-- =============================================================================
-- 8. PICKUP ASSIGNMENTS
-- =============================================================================

CREATE TABLE public.pickup_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    agent_id UUID REFERENCES public.app_users(id),

    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'verifying', 'completed', 'cancelled')),

    -- Agent's verification
    verified_conditions JSONB,
    verified_price INTEGER,
    agent_notes TEXT,
    verification_photos TEXT[],

    -- Payment
    payment_method TEXT CHECK (payment_method IN ('UPI', 'NEFT', 'RTGS', 'Cash')),
    payment_reference TEXT,
    payment_completed_at TIMESTAMPTZ,

    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE(sell_request_id)
);

CREATE INDEX idx_pickup_assignments_agent ON public.pickup_assignments(agent_id);
CREATE INDEX idx_pickup_assignments_business ON public.pickup_assignments(business_id);
CREATE INDEX idx_pickup_assignments_status ON public.pickup_assignments(status);

-- =============================================================================
-- 9. REVIEWS
-- =============================================================================

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.app_users(id),
    business_id UUID NOT NULL REFERENCES public.businesses(id),

    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_business ON public.reviews(business_id);

-- =============================================================================
-- 10. NOTIFICATIONS
-- =============================================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================================================
-- 11. PLATFORM SETTINGS (Global config)
-- =============================================================================

CREATE TABLE public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.app_users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults
INSERT INTO public.platform_settings (key, value, description) VALUES
    ('default_commission_rate', '5.00'::jsonb, 'Default platform commission in percent'),
    ('quote_expiry_hours', '24'::jsonb, 'Quote validity in hours'),
    ('gmb_sync_interval_hours', '24'::jsonb, 'Google My Business data refresh interval'),
    ('min_businesses_per_pincode', '1'::jsonb, 'Minimum active businesses required in a pincode'),
    ('supported_brands', '["Apple"]'::jsonb, 'Brands currently supported on platform')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 12. UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_users_updated BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sell_requests_updated BEFORE UPDATE ON public.sell_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quote_requests_updated BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_business_variant_prices_updated BEFORE UPDATE ON public.business_variant_prices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_business_condition_deductions_updated BEFORE UPDATE ON public.business_condition_deductions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
-- Next: Apply RLS policies (see RLS_POLICIES.sql)
-- Next: Seed Apple device catalog (see SEED_APPLE_DEVICES.sql)
-- =============================================================================
