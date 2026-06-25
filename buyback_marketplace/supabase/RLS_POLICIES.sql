-- =============================================================================
-- BuyBack Marketplace — Row Level Security Policies
-- =============================================================================
-- Run after SCHEMA.sql
-- =============================================================================

-- Enable RLS on all tables
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

-- =============================================================================
-- Helper: check role of current auth user
-- =============================================================================

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

-- =============================================================================
-- APP_USERS
-- =============================================================================

CREATE POLICY "Users can view own profile" ON public.app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.app_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admin can view all users" ON public.app_users
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Business owners can view their agents" ON public.app_users
    FOR SELECT USING (
        public.current_user_role() = 'business_owner'
        AND business_id = public.current_user_business_id()
    );

CREATE POLICY "Allow signup" ON public.app_users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- BUSINESSES
-- =============================================================================

-- Anyone (including anon) can view ACTIVE, VERIFIED businesses (for customer listing)
CREATE POLICY "Public read active businesses" ON public.businesses
    FOR SELECT USING (is_active = TRUE AND is_verified = TRUE);

-- Owner can view/update their own business (even if unverified)
CREATE POLICY "Owners manage own business" ON public.businesses
    FOR ALL USING (owner_id = auth.uid());

-- Super admin full access
CREATE POLICY "Super admin manages all businesses" ON public.businesses
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- DEVICE CATALOG (Public read, admin write)
-- =============================================================================

CREATE POLICY "Public read device categories" ON public.device_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public read device models" ON public.device_models FOR SELECT USING (TRUE);
CREATE POLICY "Public read device variants" ON public.device_variants FOR SELECT USING (TRUE);

CREATE POLICY "Admin manages device catalog" ON public.device_categories FOR ALL USING (public.is_super_admin());
CREATE POLICY "Admin manages device models" ON public.device_models FOR ALL USING (public.is_super_admin());
CREATE POLICY "Admin manages device variants" ON public.device_variants FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- BUSINESS-SPECIFIC PRICING
-- =============================================================================

-- Business owner manages their own pricing
CREATE POLICY "Owner manages variant prices" ON public.business_variant_prices
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

CREATE POLICY "Owner manages condition deductions" ON public.business_condition_deductions
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- Platform (for quote calculation) needs read via Edge Function with service_role key — bypasses RLS
-- Super admin read
CREATE POLICY "Admin reads all variant prices" ON public.business_variant_prices FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Admin reads all condition deductions" ON public.business_condition_deductions FOR SELECT USING (public.is_super_admin());

-- =============================================================================
-- SELL_REQUESTS
-- =============================================================================

-- Customer: CRUD own requests
CREATE POLICY "Customer manages own sell requests" ON public.sell_requests
    FOR ALL USING (customer_id = auth.uid());

-- Business owner: view sell_requests where they're the selected business
CREATE POLICY "Business sees selected sell requests" ON public.sell_requests
    FOR SELECT USING (
        selected_business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- Business owner: view sell_requests with pending quote from their business (for quote response)
CREATE POLICY "Business sees quoted sell requests" ON public.sell_requests
    FOR SELECT USING (
        id IN (
            SELECT sell_request_id FROM public.quote_requests
            WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
        )
    );

-- Agent: view assigned sell_requests
CREATE POLICY "Agent sees assigned sell requests" ON public.sell_requests
    FOR SELECT USING (
        id IN (SELECT sell_request_id FROM public.pickup_assignments WHERE agent_id = auth.uid())
    );

-- Super admin full access
CREATE POLICY "Admin manages all sell requests" ON public.sell_requests
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- QUOTE_REQUESTS
-- =============================================================================

-- Customer: view quotes for their sell_request
CREATE POLICY "Customer views own quotes" ON public.quote_requests
    FOR SELECT USING (
        sell_request_id IN (SELECT id FROM public.sell_requests WHERE customer_id = auth.uid())
    );

-- Business: manage quotes for their business
CREATE POLICY "Business manages own quotes" ON public.quote_requests
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- Admin full access
CREATE POLICY "Admin manages all quotes" ON public.quote_requests
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- BUSINESS_AGENTS
-- =============================================================================

CREATE POLICY "Owner manages own agents" ON public.business_agents
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

CREATE POLICY "Agent views own invite" ON public.business_agents
    FOR SELECT USING (agent_user_id = auth.uid());

CREATE POLICY "Admin manages agents" ON public.business_agents
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- PICKUP_ASSIGNMENTS
-- =============================================================================

-- Agent: CRUD own assignments
CREATE POLICY "Agent manages own pickups" ON public.pickup_assignments
    FOR ALL USING (agent_id = auth.uid());

-- Business owner: manage pickups for own business
CREATE POLICY "Business manages own pickups" ON public.pickup_assignments
    FOR ALL USING (
        business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    );

-- Customer: view their pickup
CREATE POLICY "Customer views own pickup" ON public.pickup_assignments
    FOR SELECT USING (
        sell_request_id IN (SELECT id FROM public.sell_requests WHERE customer_id = auth.uid())
    );

-- Admin full access
CREATE POLICY "Admin manages all pickups" ON public.pickup_assignments
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- REVIEWS
-- =============================================================================

-- Anyone can read reviews (for public business listing)
CREATE POLICY "Public reads reviews" ON public.reviews FOR SELECT USING (TRUE);

-- Customer can create review for own completed request
CREATE POLICY "Customer writes own review" ON public.reviews
    FOR INSERT WITH CHECK (
        customer_id = auth.uid()
        AND sell_request_id IN (
            SELECT id FROM public.sell_requests
            WHERE customer_id = auth.uid() AND status = 'completed'
        )
    );

CREATE POLICY "Customer updates own review" ON public.reviews
    FOR UPDATE USING (customer_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin manages reviews" ON public.reviews FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE POLICY "User sees own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User updates own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin inserts notifications" ON public.notifications
    FOR INSERT WITH CHECK (TRUE);  -- Edge Functions use service_role

CREATE POLICY "Admin manages all notifications" ON public.notifications
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- PLATFORM_SETTINGS
-- =============================================================================

CREATE POLICY "Public reads platform settings" ON public.platform_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Admin manages platform settings" ON public.platform_settings
    FOR ALL USING (public.is_super_admin());

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================
