-- =============================================================================
-- BuyBack Marketplace — UNIVERSAL SQL (Run ONCE in Supabase SQL Editor)
-- =============================================================================
-- Contains: Schema + Auth Trigger + RLS Policies + Apple Device Seed
-- Project: gftbhfqefnhenvynpaim.supabase.co
-- =============================================================================

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 1: SCHEMA                                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTH
CREATE TABLE public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'business_owner', 'agent', 'super_admin')),
    business_id UUID,
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_role ON public.app_users(role);
CREATE INDEX idx_app_users_business_id ON public.app_users(business_id);

-- 2. BUSINESSES
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.app_users(id),
    business_name TEXT NOT NULL,
    legal_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    pincodes_served TEXT[] DEFAULT '{}',
    operating_radius_km INTEGER DEFAULT 25,
    gmb_place_id TEXT,
    gmb_url TEXT,
    gmb_rating DECIMAL(2, 1),
    gmb_review_count INTEGER,
    gmb_last_synced TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.app_users(id),
    logo_url TEXT,
    description TEXT,
    commission_rate DECIMAL(5, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users
    ADD CONSTRAINT fk_app_users_business
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_businesses_pincodes ON public.businesses USING GIN(pincodes_served);

-- 3. DEVICE CATALOG
CREATE TABLE public.device_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(brand, category)
);

CREATE TABLE public.device_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.device_categories(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_year INTEGER,
    chip TEXT,
    screen_size DECIMAL(3, 1),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_models_category ON public.device_models(category_id);

CREATE TABLE public.device_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.device_models(id) ON DELETE CASCADE,
    storage TEXT,
    ram TEXT,
    color TEXT,
    platform_base_price INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(model_id, storage, ram, color)
);

CREATE INDEX idx_device_variants_model ON public.device_variants(model_id);

-- 4. BUSINESS-SPECIFIC PRICING
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

-- 5. SELL REQUESTS
CREATE TABLE public.sell_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.app_users(id),
    variant_id UUID NOT NULL REFERENCES public.device_variants(id),
    condition_answers JSONB NOT NULL DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    serial_number TEXT,
    description TEXT,
    pickup_address_line1 TEXT,
    pickup_address_line2 TEXT,
    pickup_city TEXT,
    pickup_pincode TEXT,
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    pickup_date DATE,
    pickup_slot TEXT,
    selected_business_id UUID REFERENCES public.businesses(id),
    selected_quote_id UUID,
    customer_estimated_price INTEGER,
    final_price INTEGER,
    platform_commission INTEGER,
    business_payout INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'draft', 'quote_requested', 'quotes_received',
        'business_selected', 'pickup_scheduled', 'agent_assigned',
        'agent_en_route', 'agent_arrived', 'device_verified',
        'completed', 'cancelled', 'rejected'
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

-- 6. QUOTES
CREATE TABLE public.quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    quoted_price INTEGER NOT NULL,
    base_price INTEGER NOT NULL,
    deductions_breakdown JSONB DEFAULT '[]',
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

-- 7. AGENTS
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

-- 8. PICKUP ASSIGNMENTS
CREATE TABLE public.pickup_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id),
    agent_id UUID REFERENCES public.app_users(id),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'verifying', 'completed', 'cancelled')),
    verified_conditions JSONB,
    verified_price INTEGER,
    agent_notes TEXT,
    verification_photos TEXT[],
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

-- 9. REVIEWS
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

-- 10. NOTIFICATIONS
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

-- 11. PLATFORM SETTINGS
CREATE TABLE public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.app_users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value, description) VALUES
    ('default_commission_rate', '5.00'::jsonb, 'Default platform commission in percent'),
    ('quote_expiry_hours', '24'::jsonb, 'Quote validity in hours'),
    ('gmb_sync_interval_hours', '24'::jsonb, 'Google My Business data refresh interval'),
    ('min_businesses_per_pincode', '1'::jsonb, 'Minimum active businesses required in a pincode'),
    ('supported_brands', '["Apple"]'::jsonb, 'Brands currently supported on platform')
ON CONFLICT (key) DO NOTHING;

-- 12. UPDATED_AT TRIGGERS
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

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 2: AUTO-CREATE app_users ON SIGNUP (Auth Trigger)                 ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.app_users (id, email, full_name, phone, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.app_users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.app_users.avatar_url),
        phone = COALESCE(EXCLUDED.phone, public.app_users.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 3: ROW LEVEL SECURITY                                             ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_condition_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.app_users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM public.app_users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'super_admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- APP_USERS policies
CREATE POLICY "Users can view own profile" ON public.app_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.app_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admin can view all users" ON public.app_users FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Business owners can view their agents" ON public.app_users
    FOR SELECT USING (public.current_user_role() = 'business_owner' AND business_id = public.current_user_business_id());
CREATE POLICY "Allow signup" ON public.app_users FOR INSERT WITH CHECK (auth.uid() = id);

-- BUSINESSES policies
CREATE POLICY "Public read active businesses" ON public.businesses FOR SELECT USING (is_active = TRUE AND is_verified = TRUE);
CREATE POLICY "Owners manage own business" ON public.businesses FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Super admin manages all businesses" ON public.businesses FOR ALL USING (public.is_super_admin());

-- DEVICE CATALOG policies (public read)
CREATE POLICY "Public read device categories" ON public.device_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read device models" ON public.device_models FOR SELECT USING (TRUE);
CREATE POLICY "Public read device variants" ON public.device_variants FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages device catalog" ON public.device_categories FOR ALL USING (public.is_super_admin());
CREATE POLICY "Admin manages device models" ON public.device_models FOR ALL USING (public.is_super_admin());
CREATE POLICY "Admin manages device variants" ON public.device_variants FOR ALL USING (public.is_super_admin());

-- BUSINESS PRICING policies
CREATE POLICY "Owner manages variant prices" ON public.business_variant_prices
    FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Owner manages condition deductions" ON public.business_condition_deductions
    FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admin reads all variant prices" ON public.business_variant_prices FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Admin reads all condition deductions" ON public.business_condition_deductions FOR SELECT USING (public.is_super_admin());

-- SELL_REQUESTS policies
CREATE POLICY "Customer manages own sell requests" ON public.sell_requests FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Business sees selected sell requests" ON public.sell_requests
    FOR SELECT USING (selected_business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Business sees quoted sell requests" ON public.sell_requests
    FOR SELECT USING (id IN (SELECT sell_request_id FROM public.quote_requests WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())));
CREATE POLICY "Agent sees assigned sell requests" ON public.sell_requests
    FOR SELECT USING (id IN (SELECT sell_request_id FROM public.pickup_assignments WHERE agent_id = auth.uid()));
CREATE POLICY "Admin manages all sell requests" ON public.sell_requests FOR ALL USING (public.is_super_admin());

-- QUOTE_REQUESTS policies
CREATE POLICY "Customer views own quotes" ON public.quote_requests
    FOR SELECT USING (sell_request_id IN (SELECT id FROM public.sell_requests WHERE customer_id = auth.uid()));
CREATE POLICY "Business manages own quotes" ON public.quote_requests
    FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Admin manages all quotes" ON public.quote_requests FOR ALL USING (public.is_super_admin());

-- BUSINESS_AGENTS policies
CREATE POLICY "Owner manages own agents" ON public.business_agents
    FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Agent views own invite" ON public.business_agents FOR SELECT USING (agent_user_id = auth.uid());
CREATE POLICY "Admin manages agents" ON public.business_agents FOR ALL USING (public.is_super_admin());

-- PICKUP_ASSIGNMENTS policies
CREATE POLICY "Agent manages own pickups" ON public.pickup_assignments FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "Business manages own pickups" ON public.pickup_assignments
    FOR ALL USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Customer views own pickup" ON public.pickup_assignments
    FOR SELECT USING (sell_request_id IN (SELECT id FROM public.sell_requests WHERE customer_id = auth.uid()));
CREATE POLICY "Admin manages all pickups" ON public.pickup_assignments FOR ALL USING (public.is_super_admin());

-- REVIEWS policies
CREATE POLICY "Public reads reviews" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Customer writes own review" ON public.reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid() AND sell_request_id IN (SELECT id FROM public.sell_requests WHERE customer_id = auth.uid() AND status = 'completed'));
CREATE POLICY "Customer updates own review" ON public.reviews FOR UPDATE USING (customer_id = auth.uid());
CREATE POLICY "Admin manages reviews" ON public.reviews FOR ALL USING (public.is_super_admin());

-- NOTIFICATIONS policies
CREATE POLICY "User sees own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin inserts notifications" ON public.notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin manages all notifications" ON public.notifications FOR ALL USING (public.is_super_admin());

-- PLATFORM_SETTINGS policies
CREATE POLICY "Public reads platform settings" ON public.platform_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages platform settings" ON public.platform_settings FOR ALL USING (public.is_super_admin());

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 4: SEED APPLE DEVICE CATALOG                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Categories
INSERT INTO public.device_categories (id, brand, category, display_order, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apple', 'MacBook', 1, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Apple', 'iPad', 2, TRUE)
ON CONFLICT (brand, category) DO NOTHING;

-- MacBook Models
INSERT INTO public.device_models (category_id, model_name, model_year, chip, screen_size, display_order, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M3', 2024, 'M3', 13.6, 1, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M3 15"', 2024, 'M3', 15.3, 2, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M2', 2022, 'M2', 13.6, 3, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M2 15"', 2023, 'M2', 15.3, 4, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M1', 2020, 'M1', 13.3, 5, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air Intel', 2020, 'Intel i3/i5/i7', 13.3, 6, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M3', 2023, 'M3/M3 Pro/M3 Max', 14.2, 7, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M3', 2023, 'M3 Pro/M3 Max', 16.2, 8, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M2', 2023, 'M2 Pro/M2 Max', 14.2, 9, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M2', 2023, 'M2 Pro/M2 Max', 16.2, 10, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M1', 2021, 'M1 Pro/M1 Max', 14.2, 11, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M1', 2021, 'M1 Pro/M1 Max', 16.2, 12, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 13" M2', 2022, 'M2', 13.3, 13, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 13" M1', 2020, 'M1', 13.3, 14, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro Intel', 2019, 'Intel i5/i7/i9', 13.3, 15, TRUE)
ON CONFLICT DO NOTHING;

-- iPad Models
INSERT INTO public.device_models (category_id, model_name, model_year, chip, screen_size, display_order, is_active) VALUES
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 13" M4', 2024, 'M4', 13.0, 1, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M4', 2024, 'M4', 11.0, 2, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 12.9" M2', 2022, 'M2', 12.9, 3, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M2', 2022, 'M2', 11.0, 4, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 12.9" M1', 2021, 'M1', 12.9, 5, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M1', 2021, 'M1', 11.0, 6, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 13" M2', 2024, 'M2', 13.0, 7, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 11" M2', 2024, 'M2', 11.0, 8, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air M1', 2022, 'M1', 10.9, 9, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 4', 2020, 'A14 Bionic', 10.9, 10, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad 10th Gen', 2022, 'A14 Bionic', 10.9, 11, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad 9th Gen', 2021, 'A13 Bionic', 10.2, 12, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Mini 7 (A17 Pro)', 2024, 'A17 Pro', 8.3, 13, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Mini 6', 2021, 'A15 Bionic', 8.3, 14, TRUE)
ON CONFLICT DO NOTHING;

-- MacBook Air M3 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 85000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
UNION ALL
SELECT id, '512GB', '16GB', 110000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
UNION ALL
SELECT id, '1TB', '16GB', 130000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
ON CONFLICT DO NOTHING;

-- MacBook Air M2 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 65000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
UNION ALL
SELECT id, '512GB', '16GB', 85000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
UNION ALL
SELECT id, '1TB', '16GB', 100000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
ON CONFLICT DO NOTHING;

-- MacBook Air M1 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 45000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
UNION ALL
SELECT id, '512GB', '8GB', 55000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
UNION ALL
SELECT id, '512GB', '16GB', 65000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
ON CONFLICT DO NOTHING;

-- MacBook Pro 14" M3 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '512GB', '16GB', 150000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
UNION ALL
SELECT id, '1TB', '18GB', 185000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
UNION ALL
SELECT id, '1TB', '36GB', 225000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
ON CONFLICT DO NOTHING;

-- iPad Pro 11" M4 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 85000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '512GB', '8GB', 100000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '1TB', '16GB', 130000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '2TB', '16GB', 160000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
ON CONFLICT DO NOTHING;

-- iPad Air 11" M2 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '128GB', '8GB', 52000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '256GB', '8GB', 60000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '512GB', '8GB', 75000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '1TB', '8GB', 90000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
ON CONFLICT DO NOTHING;

-- iPad Mini 7 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '128GB', '8GB', 40000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
UNION ALL
SELECT id, '256GB', '8GB', 48000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
UNION ALL
SELECT id, '512GB', '8GB', 60000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
ON CONFLICT DO NOTHING;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 5: ADDITIONAL TABLES (from existing BuyBack Elite project)        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- 5.1 PLATFORM CONDITION DEDUCTIONS (default questions + deduction values)
CREATE TABLE public.condition_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    condition_name TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    deduction_type TEXT NOT NULL DEFAULT 'FLAT' CHECK (deduction_type IN ('PERCENT', 'FLAT', 'SCRAP_TRIGGER')),
    impact_level TEXT NOT NULL DEFAULT 'MINOR' CHECK (impact_level IN ('CRITICAL', 'MINOR', 'BONUS')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, condition_name)
);
CREATE INDEX idx_condition_deductions_category ON public.condition_deductions(category);
CREATE INDEX idx_condition_deductions_active ON public.condition_deductions(is_active);

ALTER TABLE public.condition_deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read condition deductions" ON public.condition_deductions FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages condition deductions" ON public.condition_deductions FOR ALL USING (public.is_super_admin());

CREATE TRIGGER trg_condition_deductions_updated BEFORE UPDATE ON public.condition_deductions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5.2 FCM TOKENS (push notification tokens for all apps/platforms)
CREATE TABLE public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'android_customer'
        CHECK (device_type IN (
            'android_customer', 'android_agent', 'android_admin',
            'web_customer', 'web_agent', 'web_admin'
        )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_type)
);
CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_device_type ON public.fcm_tokens(device_type);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fcm_tokens_select" ON public.fcm_tokens FOR SELECT USING (TRUE);
CREATE POLICY "fcm_tokens_insert" ON public.fcm_tokens FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "fcm_tokens_update" ON public.fcm_tokens FOR UPDATE TO authenticated USING (TRUE);
CREATE POLICY "fcm_tokens_delete" ON public.fcm_tokens FOR DELETE TO authenticated USING (TRUE);

-- 5.3 SERVICE ZONES (pincode-based scheduling)
CREATE TABLE public.service_zones (
    pincode TEXT PRIMARY KEY,
    city TEXT,
    state TEXT,
    max_orders_per_day INTEGER NOT NULL DEFAULT 10,
    is_serviceable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    available_slots JSONB DEFAULT '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'::jsonb,
    lead_days INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read service zones" ON public.service_zones FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages service zones" ON public.service_zones FOR ALL USING (public.is_super_admin());

CREATE TRIGGER trg_service_zones_updated BEFORE UPDATE ON public.service_zones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5.4 BLOCKED DATES
CREATE TABLE public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocked_date DATE NOT NULL,
    pincode TEXT REFERENCES public.service_zones(pincode) ON DELETE CASCADE,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_blocked_dates_date ON public.blocked_dates(blocked_date);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blocked dates" ON public.blocked_dates FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages blocked dates" ON public.blocked_dates FOR ALL USING (public.is_super_admin());

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 6: NOTIFICATION AUTO-TRIGGERS                                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Auto-notify customer when sell_request status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.customer_id,
            'Request Status Updated',
            'Your sell request status: ' || REPLACE(UPPER(NEW.status), '_', ' '),
            'status_update',
            jsonb_build_object('request_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_status_change AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 7: STORAGE BUCKETS + POLICIES                                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

INSERT INTO storage.buckets (id, name, public) VALUES ('device-photos', 'device-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

CREATE POLICY "device_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'device-photos');

CREATE POLICY "profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-photos');

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 8: REALTIME SUBSCRIPTIONS                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sell_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 9: GRANTS                                                         ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

GRANT ALL ON public.app_users TO authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.device_categories TO authenticated;
GRANT ALL ON public.device_models TO authenticated;
GRANT ALL ON public.device_variants TO authenticated;
GRANT ALL ON public.business_variant_prices TO authenticated;
GRANT ALL ON public.business_condition_deductions TO authenticated;
GRANT ALL ON public.sell_requests TO authenticated;
GRANT ALL ON public.quote_requests TO authenticated;
GRANT ALL ON public.business_agents TO authenticated;
GRANT ALL ON public.pickup_assignments TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.condition_deductions TO authenticated;
GRANT ALL ON public.fcm_tokens TO authenticated;
GRANT ALL ON public.service_zones TO authenticated;
GRANT ALL ON public.blocked_dates TO authenticated;

-- Anonymous access (customer sees pricing before login)
GRANT SELECT ON public.device_categories TO anon;
GRANT SELECT ON public.device_models TO anon;
GRANT SELECT ON public.device_variants TO anon;
GRANT SELECT ON public.condition_deductions TO anon;
GRANT SELECT ON public.service_zones TO anon;
GRANT SELECT ON public.blocked_dates TO anon;
GRANT SELECT ON public.platform_settings TO anon;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 10: SEED — CONDITION DEDUCTIONS (from existing BuyBack Elite)     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

INSERT INTO public.condition_deductions (category, condition_name, value, deduction_type, impact_level, display_order) VALUES
-- Device Status
('DeviceStatus', 'Device turns on', 0, 'FLAT', 'MINOR', 1),
('DeviceStatus', 'Device not turning on', 0, 'SCRAP_TRIGGER', 'CRITICAL', 2),
-- Screen
('Screen', 'Perfect (No scratches)', 0, 'FLAT', 'MINOR', 1),
('Screen', 'Minor scratches', 2000, 'FLAT', 'MINOR', 2),
('Screen', 'Visible scratches', 5000, 'FLAT', 'MINOR', 3),
('Screen', 'Cracked/Broken', 15000, 'FLAT', 'CRITICAL', 4),
('Screen', 'Display not working', 0, 'SCRAP_TRIGGER', 'CRITICAL', 5),
-- Body
('Body', 'Like new', 0, 'FLAT', 'MINOR', 1),
('Body', 'Minor dents/scratches', 2000, 'FLAT', 'MINOR', 2),
('Body', 'Visible dents', 5000, 'FLAT', 'MINOR', 3),
('Body', 'Major damage', 12000, 'FLAT', 'CRITICAL', 4),
-- Battery
('Battery', '90-100%', 0, 'FLAT', 'MINOR', 1),
('Battery', '80-89%', 2000, 'FLAT', 'MINOR', 2),
('Battery', '70-79%', 4000, 'FLAT', 'MINOR', 3),
('Battery', 'Below 70%', 7000, 'FLAT', 'CRITICAL', 4),
('Battery', 'Not holding charge', 10000, 'FLAT', 'CRITICAL', 5),
-- Keyboard (MacBook)
('Keyboard', 'Working perfectly', 0, 'FLAT', 'MINOR', 1),
('Keyboard', 'Some keys sticky', 3000, 'FLAT', 'MINOR', 2),
('Keyboard', 'Some keys not working', 5000, 'FLAT', 'MINOR', 3),
('Keyboard', 'Not working', 12000, 'FLAT', 'CRITICAL', 4),
-- Trackpad
('Trackpad', 'Working perfectly', 0, 'FLAT', 'MINOR', 1),
('Trackpad', 'Click issues', 3000, 'FLAT', 'MINOR', 2),
('Trackpad', 'Not working', 8000, 'FLAT', 'CRITICAL', 3),
-- Ports
('Ports', 'All working', 0, 'FLAT', 'MINOR', 1),
('Ports', 'Some not working', 3000, 'FLAT', 'MINOR', 2),
('Ports', 'Most not working', 8000, 'FLAT', 'CRITICAL', 3),
-- Speakers
('Speakers', 'Working', 0, 'FLAT', 'MINOR', 1),
('Speakers', 'Distorted sound', 2000, 'FLAT', 'MINOR', 2),
('Speakers', 'Not working', 5000, 'FLAT', 'CRITICAL', 3),
-- Camera
('Camera', 'Working', 0, 'FLAT', 'MINOR', 1),
('Camera', 'Blurry/Damaged', 2000, 'FLAT', 'MINOR', 2),
('Camera', 'Not working', 4000, 'FLAT', 'CRITICAL', 3),
-- FaceID / TouchID
('FaceID', 'Working', 0, 'FLAT', 'MINOR', 1),
('FaceID', 'Not working', 5000, 'FLAT', 'CRITICAL', 2),
('TouchID', 'Working', 0, 'FLAT', 'MINOR', 1),
('TouchID', 'Not working', 4000, 'FLAT', 'CRITICAL', 2),
-- WiFi / Bluetooth
('WiFi', 'Working', 0, 'FLAT', 'MINOR', 1),
('WiFi', 'Not working', 5000, 'FLAT', 'CRITICAL', 2),
('Bluetooth', 'Working', 0, 'FLAT', 'MINOR', 1),
('Bluetooth', 'Not working', 3000, 'FLAT', 'CRITICAL', 2),
-- Warranty
('Warranty', 'Out of Warranty / No Bill', 0, 'FLAT', 'MINOR', 1),
('Warranty', '0-3 Months Remaining', -1000, 'FLAT', 'BONUS', 2),
('Warranty', '3-6 Months Remaining', -2000, 'FLAT', 'BONUS', 3),
('Warranty', '6-11 Months Remaining', -4000, 'FLAT', 'BONUS', 4),
('Warranty', 'Apple Care+ (12+ Months)', -7000, 'FLAT', 'BONUS', 5),
-- Accessories
('Accessories', 'Original Charger included', 0, 'FLAT', 'MINOR', 1),
('Accessories', 'No charger', 2000, 'FLAT', 'MINOR', 2),
('Accessories', 'Original Box included', -1000, 'FLAT', 'BONUS', 3),
('Accessories', 'Apple Pencil 2nd Gen included', -3500, 'FLAT', 'BONUS', 4),
('Accessories', 'Apple Pencil Pro included', -5000, 'FLAT', 'BONUS', 5),
('Accessories', 'Magic Keyboard included', -5000, 'FLAT', 'BONUS', 6),
-- Cycle Count (MacBook)
('CycleCount', '0-299 cycles', 0, 'FLAT', 'MINOR', 1),
('CycleCount', '300-499 cycles', 1500, 'FLAT', 'MINOR', 2),
('CycleCount', '500-799 cycles', 3000, 'FLAT', 'MINOR', 3),
('CycleCount', '800-999 cycles', 5000, 'FLAT', 'CRITICAL', 4),
('CycleCount', '1000+ cycles', 8000, 'FLAT', 'CRITICAL', 5),
-- Cellular (iPad)
('Cellular', 'WiFi Only', 0, 'FLAT', 'MINOR', 1),
('Cellular', 'WiFi + Cellular (Working)', -3000, 'FLAT', 'BONUS', 2),
('Cellular', 'WiFi + Cellular (Not Working)', 2000, 'FLAT', 'MINOR', 3)
ON CONFLICT (category, condition_name) DO NOTHING;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  PART 11: SEED — SERVICE ZONES                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

INSERT INTO public.service_zones (pincode, city, state, max_orders_per_day, is_serviceable, available_slots) VALUES
('201301', 'Noida', 'Uttar Pradesh', 15, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('201303', 'Noida', 'Uttar Pradesh', 15, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('110001', 'New Delhi', 'Delhi', 18, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "3:00 PM - 5:00 PM"]'),
('110002', 'New Delhi', 'Delhi', 18, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "3:00 PM - 5:00 PM"]'),
('400001', 'Mumbai', 'Maharashtra', 20, true, '["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('560001', 'Bangalore', 'Karnataka', 15, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('600001', 'Chennai', 'Tamil Nadu', 12, true, '["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('500001', 'Hyderabad', 'Telangana', 14, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "4:00 PM - 6:00 PM"]'),
('411001', 'Pune', 'Maharashtra', 10, true, '["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"]')
ON CONFLICT (pincode) DO NOTHING;

-- =============================================================================
-- END OF UNIVERSAL SQL
-- =============================================================================
-- Tables: 19 | Triggers: 10 | Storage Buckets: 2 | Realtime: 3 tables
-- Includes: Schema + Auth Trigger + RLS + Seed + Conditions + Service Zones
-- =============================================================================
