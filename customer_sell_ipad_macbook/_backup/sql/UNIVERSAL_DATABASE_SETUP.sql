-- =====================================================
-- BUYBACK ELITE - UNIVERSAL DATABASE SETUP
-- Single SQL for Fresh Supabase Project
-- Last Updated: April 11, 2026
-- =====================================================
-- HOW TO USE:
--   1. Create a new Supabase project
--   2. Go to SQL Editor
--   3. Paste this ENTIRE file and run it
--   4. Done! All tables, functions, triggers, RLS, storage, seed data ready
-- =====================================================


-- =====================================================
-- PART 1: EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================
-- PART 2: CORE TABLES
-- =====================================================

-- 2.1 USERS TABLE (auto-created on Supabase Auth signup via trigger)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    name TEXT,
    email TEXT,
    saved_address TEXT,
    upi_id TEXT,
    profile_photo_url TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);

-- 2.2 ADMIN USERS TABLE
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 APPROVED ADMIN EMAILS (admin registration gate)
CREATE TABLE public.approved_admin_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_approved_admin_emails_email ON public.approved_admin_emails(email);
CREATE INDEX idx_approved_admin_emails_active ON public.approved_admin_emails(is_active);

-- 2.4 APPROVED AGENT EMAILS (agent registration gate - admin adds these)
CREATE TABLE public.approved_agent_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    city TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    is_registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_approved_agent_emails_email ON public.approved_agent_emails(email);
CREATE INDEX idx_approved_agent_emails_active ON public.approved_agent_emails(is_active);

-- 2.5 AGENTS TABLE
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE,
    city TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    last_location_update TIMESTAMPTZ,
    profile_photo_url TEXT,
    average_rating DECIMAL(2,1) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    service_area TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agents_active ON public.agents(is_active);
CREATE INDEX idx_agents_email ON public.agents(email);
CREATE INDEX idx_agents_online ON public.agents(is_online);

-- 2.6 PRICE ENGINE TABLE
CREATE TABLE public.price_engine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type TEXT NOT NULL CHECK (device_type IN ('MacBook', 'iPad')),
    model_name TEXT NOT NULL UNIQUE,
    base_price INTEGER NOT NULL DEFAULT 0,
    scrap_value INTEGER DEFAULT 5000,
    deduction_screen_issue INTEGER DEFAULT 0,
    deduction_body_issue INTEGER DEFAULT 0,
    deduction_battery_issue INTEGER DEFAULT 0,
    deduction_keyboard_issue INTEGER DEFAULT 0,
    deduction_no_charger INTEGER DEFAULT 0,
    deduction_no_box INTEGER DEFAULT 0,
    deduction_rules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_price_engine_model ON public.price_engine(model_name);
CREATE INDEX idx_price_engine_device_type ON public.price_engine(device_type);
CREATE INDEX idx_price_engine_active ON public.price_engine(is_active);

-- 2.7 DEVICE PRICES TABLE (storage/variant specific pricing)
CREATE TABLE public.device_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type TEXT NOT NULL,
    model TEXT NOT NULL,
    storage TEXT,
    variant TEXT,
    base_price INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_device_model_storage UNIQUE(device_type, model, storage)
);
CREATE INDEX idx_device_prices_type ON public.device_prices(device_type);
CREATE INDEX idx_device_prices_model ON public.device_prices(model);
CREATE INDEX idx_device_prices_active ON public.device_prices(is_active);

-- 2.8 CONDITION DEDUCTIONS TABLE
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
    CONSTRAINT unique_category_condition UNIQUE(category, condition_name)
);
CREATE INDEX idx_condition_deductions_category ON public.condition_deductions(category);
CREATE INDEX idx_condition_deductions_type ON public.condition_deductions(deduction_type);
CREATE INDEX idx_condition_deductions_active ON public.condition_deductions(is_active);

-- 2.9 VARIANT PRICES TABLE
CREATE TABLE public.variant_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_engine_id UUID REFERENCES public.price_engine(id) ON DELETE CASCADE,
    device_type TEXT,
    brand TEXT,
    model TEXT,
    variant_type TEXT NOT NULL CHECK (variant_type IN ('storage', 'ram')),
    variant_value TEXT NOT NULL,
    base_price_adjustment INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variant_prices_engine ON public.variant_prices(price_engine_id);
CREATE INDEX idx_variant_prices_type ON public.variant_prices(variant_type, variant_value);
CREATE INDEX idx_variant_prices_device ON public.variant_prices(device_type, model);

-- 2.10 WARRANTY DEDUCTIONS TABLE
CREATE TABLE public.warranty_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_type TEXT NOT NULL CHECK (device_type IN ('MacBook', 'iPad', 'All')),
    no_warranty_deduction INTEGER DEFAULT 5000,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 SERVICE ZONES TABLE
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

-- 2.12 BLOCKED DATES TABLE
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
CREATE INDEX idx_blocked_dates_pincode ON public.blocked_dates(pincode);

-- 2.13 SELL REQUESTS TABLE (main business table)
CREATE TABLE public.sell_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('MacBook', 'iPad')),
    device_name TEXT,
    model_name TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    condition_answers JSONB DEFAULT '{}'::jsonb,
    photos_url JSONB DEFAULT '[]'::jsonb,
    system_estimated_price INTEGER DEFAULT 0,
    user_expected_price INTEGER DEFAULT 0,
    admin_offer_price INTEGER,
    customer_counter_price INTEGER,
    final_price INTEGER,
    final_offer_by TEXT,
    user_location JSONB DEFAULT '{}'::jsonb,
    user_address TEXT,
    pickup_address TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    id_proof_url TEXT,
    id_proof_type TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN (
        'Draft', 'Pending', 'Reviewing', 'Approved', 'Seller_Confirmed',
        'Agent_Assigned', 'Agent_En_Route', 'Agent_Arrived', 'Picked_Up',
        'Counter_Offered', 'Customer_Countered', 'Offer_Accepted',
        'Pickup_Scheduled', 'Completed', 'Rejected', 'Cancelled'
    )),
    rejection_reason TEXT,
    admin_notes TEXT,
    delivery_method TEXT DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'self_drop')),
    seller_confirmed BOOLEAN DEFAULT FALSE,
    seller_confirmed_at TIMESTAMPTZ,
    assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    assigned_agent_name TEXT,
    pickup_scheduled_time TIMESTAMPTZ,
    pickup_date DATE,
    pickup_slot TEXT,
    pickup_pincode TEXT,
    has_warranty BOOLEAN DEFAULT FALSE,
    warranty_deduction INTEGER DEFAULT 0,
    price_breakdown JSONB DEFAULT '{}'::jsonb,
    bank_details JSONB,
    customer_phone TEXT,
    upi_id TEXT,
    payment_status TEXT DEFAULT 'Pending',
    compressed_photos TEXT[] DEFAULT '{}',
    photos_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sell_requests_user ON public.sell_requests(user_id);
CREATE INDEX idx_sell_requests_status ON public.sell_requests(status);
CREATE INDEX idx_sell_requests_created ON public.sell_requests(created_at DESC);
CREATE INDEX idx_sell_requests_agent ON public.sell_requests(assigned_agent_id);
CREATE INDEX idx_sell_requests_pincode ON public.sell_requests(pickup_pincode);

-- 2.14 AGENT LOCATIONS TABLE
CREATE TABLE public.agent_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    accuracy DOUBLE PRECISION DEFAULT 0,
    is_online BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_locations_agent ON public.agent_locations(agent_id);
CREATE INDEX idx_agent_locations_updated ON public.agent_locations(last_updated DESC);

-- 2.15 AGENT TRACKING TABLE
CREATE TABLE public.agent_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    customer_latitude DOUBLE PRECISION,
    customer_longitude DOUBLE PRECISION,
    customer_address TEXT,
    agent_latitude DOUBLE PRECISION,
    agent_longitude DOUBLE PRECISION,
    location_updated_at TIMESTAMPTZ,
    pickup_status TEXT DEFAULT 'assigned' CHECK (pickup_status IN ('assigned', 'en_route', 'arrived', 'picked_up', 'completed', 'cancelled')),
    en_route_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    estimated_arrival_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    distance_km DOUBLE PRECISION,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_tracking_request ON public.agent_tracking(sell_request_id);
CREATE INDEX idx_agent_tracking_agent ON public.agent_tracking(agent_id);
CREATE INDEX idx_agent_tracking_status ON public.agent_tracking(pickup_status);

-- 2.16 AGENT RATINGS TABLE
CREATE TABLE public.agent_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_ratings_agent ON public.agent_ratings(agent_id);
CREATE INDEX idx_agent_ratings_user ON public.agent_ratings(user_id);

-- 2.17 NOTIFICATIONS TABLE (in-app notification history)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_email TEXT,
    sell_request_id UUID REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    message TEXT,
    type TEXT DEFAULT 'general',
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_agent_email ON public.notifications(agent_email);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- 2.18 FCM TOKENS TABLE (Firebase Cloud Messaging push tokens)
-- Stores push notification tokens for all apps/platforms.
-- user_id is TEXT (not UUID) because:
--   - Customer apps store auth UUID as string
--   - Agent/Admin apps may store email as identifier
-- UNIQUE(user_id, device_type) = one token per user per platform
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
CREATE INDEX idx_fcm_tokens_token ON public.fcm_tokens(token);

-- 2.19 FRAUD ALERTS TABLE
CREATE TABLE public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sell_request_id UUID REFERENCES public.sell_requests(id) ON DELETE SET NULL,
    id_proof_hash TEXT,
    alert_type TEXT NOT NULL,
    alert_message TEXT,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fraud_alerts_user ON public.fraud_alerts(user_id);
CREATE INDEX idx_fraud_alerts_id_hash ON public.fraud_alerts(id_proof_hash);
CREATE INDEX idx_fraud_alerts_resolved ON public.fraud_alerts(is_resolved);

-- 2.20 USER PROFILES TABLE (legacy compatibility)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- PART 3: FUNCTIONS
-- =====================================================

-- 3.1 Auto-update updated_at timestamp on any row change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Auto-create user row when someone signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, phone, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.phone, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Fraud detection: flag users with many requests in 30 days
CREATE OR REPLACE FUNCTION public.check_fraud_on_request()
RETURNS TRIGGER AS $$
DECLARE
    request_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM public.sell_requests
    WHERE user_id = NEW.user_id AND created_at > NOW() - INTERVAL '30 days';

    IF request_count >= 5 THEN
        INSERT INTO public.fraud_alerts (user_id, sell_request_id, alert_type, alert_message, severity)
        VALUES (NEW.user_id, NEW.id, 'multiple_requests',
                'User has submitted ' || request_count || ' requests in last 30 days', 'medium');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Auto-recalculate agent average rating
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.agents SET
        average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.agent_ratings WHERE agent_id = NEW.agent_id),
        total_ratings = (SELECT COUNT(*) FROM public.agent_ratings WHERE agent_id = NEW.agent_id),
        updated_at = NOW()
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.5 Update agent GPS location (called from agent app)
CREATE OR REPLACE FUNCTION public.update_agent_location(
    p_agent_id UUID, p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION,
    p_heading DOUBLE PRECISION DEFAULT 0, p_speed DOUBLE PRECISION DEFAULT 0, p_accuracy DOUBLE PRECISION DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.agent_locations (agent_id, latitude, longitude, heading, speed, accuracy, last_updated)
    VALUES (p_agent_id, p_latitude, p_longitude, p_heading, p_speed, p_accuracy, NOW())
    ON CONFLICT (agent_id) DO UPDATE SET
        latitude = p_latitude, longitude = p_longitude, heading = p_heading,
        speed = p_speed, accuracy = p_accuracy, last_updated = NOW(), is_online = TRUE;

    UPDATE public.agents SET current_lat = p_latitude, current_lng = p_longitude,
        last_location_update = NOW(), is_online = TRUE WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 Insert notification helper function
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID DEFAULT NULL,
    p_agent_email TEXT DEFAULT NULL,
    p_title TEXT DEFAULT 'Notification',
    p_body TEXT DEFAULT '',
    p_type TEXT DEFAULT 'general',
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, agent_email, title, body, type, data)
    VALUES (p_user_id, p_agent_email, p_title, p_body, p_type, p_data)
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7 Auto-create in-app notification when sell request status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_agent_email TEXT;
    v_device_model TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_device_model := COALESCE(NEW.model_name, NEW.device_name, 'Device');

        -- Notify customer
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.user_id,
            'Request Status Updated',
            'Your ' || v_device_model || ' sell request status: ' || REPLACE(UPPER(NEW.status), '_', ' '),
            'status_update',
            jsonb_build_object('request_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'model', v_device_model)
        );

        -- Notify assigned agent if exists
        IF NEW.assigned_agent_id IS NOT NULL THEN
            SELECT email INTO v_agent_email FROM public.agents WHERE id = NEW.assigned_agent_id;
            IF v_agent_email IS NOT NULL THEN
                INSERT INTO public.notifications (agent_email, title, body, type, data)
                VALUES (
                    v_agent_email,
                    'Pickup Status Updated',
                    v_device_model || ' pickup status: ' || REPLACE(UPPER(NEW.status), '_', ' '),
                    'pickup_update',
                    jsonb_build_object('request_id', NEW.id, 'status', NEW.status, 'model', v_device_model)
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.8 Auto-notify when agent is assigned to a pickup
CREATE OR REPLACE FUNCTION public.notify_on_agent_assigned()
RETURNS TRIGGER AS $$
DECLARE
    v_agent_email TEXT;
    v_agent_name TEXT;
    v_device_model TEXT;
BEGIN
    IF OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id AND NEW.assigned_agent_id IS NOT NULL THEN
        v_device_model := COALESCE(NEW.model_name, NEW.device_name, 'Device');
        SELECT email, name INTO v_agent_email, v_agent_name FROM public.agents WHERE id = NEW.assigned_agent_id;

        -- Notify customer
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.user_id,
            'Agent Assigned for Pickup',
            COALESCE(v_agent_name, 'An agent') || ' will pick up your ' || v_device_model,
            'agent_assigned',
            jsonb_build_object('request_id', NEW.id, 'agent_name', v_agent_name, 'model', v_device_model)
        );

        -- Notify agent
        IF v_agent_email IS NOT NULL THEN
            INSERT INTO public.notifications (agent_email, title, body, type, data)
            VALUES (
                v_agent_email,
                'New Pickup Assignment',
                'You have been assigned to pickup: ' || v_device_model,
                'new_pickup',
                jsonb_build_object('request_id', NEW.id, 'model', v_device_model)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.9 Auto-notify customer when admin sends a price offer
CREATE OR REPLACE FUNCTION public.notify_on_offer()
RETURNS TRIGGER AS $$
DECLARE
    v_device_model TEXT;
BEGIN
    IF OLD.admin_offer_price IS DISTINCT FROM NEW.admin_offer_price AND NEW.admin_offer_price IS NOT NULL THEN
        v_device_model := COALESCE(NEW.model_name, NEW.device_name, 'Device');
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.user_id,
            'New Price Offer!',
            'You received ₹' || NEW.admin_offer_price || ' offer for your ' || v_device_model,
            'offer',
            jsonb_build_object('request_id', NEW.id, 'offer_price', NEW.admin_offer_price, 'model', v_device_model)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.10 Auto-notify all admins when a new sell request is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_request()
RETURNS TRIGGER AS $$
DECLARE
    v_device_model TEXT;
    v_customer_name TEXT;
    v_admin RECORD;
BEGIN
    v_device_model := COALESCE(NEW.model_name, NEW.device_name, NEW.device_type, 'Device');

    SELECT name INTO v_customer_name FROM public.users WHERE id = NEW.user_id;
    v_customer_name := COALESCE(v_customer_name, 'Customer');

    FOR v_admin IN
        SELECT u.id AS user_id
        FROM public.admin_users au
        JOIN public.users u ON u.email = au.email
        WHERE au.is_active = TRUE
    LOOP
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            v_admin.user_id,
            '🆕 New Sell Request',
            v_customer_name || ' submitted a request for ' || v_device_model,
            'admin_new_request',
            jsonb_build_object('request_id', NEW.id, 'device_model', v_device_model, 'customer_name', v_customer_name)
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.11 Keep agent email in sync for notification lookups
CREATE OR REPLACE FUNCTION public.sync_agent_auth_email()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email IS DISTINCT FROM NEW.email AND OLD.email IS NOT NULL THEN
        UPDATE public.notifications
        SET agent_email = NEW.email
        WHERE agent_email = OLD.email AND read = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.11 Auto-update fcm_tokens.updated_at
CREATE OR REPLACE FUNCTION public.handle_fcm_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- PART 4: TRIGGERS
-- =====================================================

-- updated_at auto-triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sell_requests_updated_at BEFORE UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_price_engine_updated_at BEFORE UPDATE ON public.price_engine
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_variant_prices_updated_at BEFORE UPDATE ON public.variant_prices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_device_prices_updated_at BEFORE UPDATE ON public.device_prices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_condition_deductions_updated_at BEFORE UPDATE ON public.condition_deductions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warranty_deductions_updated_at BEFORE UPDATE ON public.warranty_deductions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_zones_updated_at BEFORE UPDATE ON public.service_zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blocked_dates_updated_at BEFORE UPDATE ON public.blocked_dates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_tracking_updated_at BEFORE UPDATE ON public.agent_tracking
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_approved_admin_emails_updated_at BEFORE UPDATE ON public.approved_admin_emails
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_approved_agent_emails_updated_at BEFORE UPDATE ON public.approved_agent_emails
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_fcm_tokens_updated_at BEFORE UPDATE ON public.fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION public.handle_fcm_token_updated_at();

-- Business logic triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER check_fraud_trigger AFTER INSERT ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.check_fraud_on_request();
CREATE TRIGGER trigger_notify_admins_new_request AFTER INSERT ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_request();
CREATE TRIGGER trigger_update_agent_rating AFTER INSERT ON public.agent_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_agent_rating();
CREATE TRIGGER trigger_notify_status_change AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();
CREATE TRIGGER trigger_notify_agent_assigned AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_agent_assigned();
CREATE TRIGGER trigger_notify_offer AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer();
CREATE TRIGGER trigger_sync_agent_email AFTER UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.sync_agent_auth_email();


-- =====================================================
-- PART 5: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_engine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_agent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- PART 6: RLS POLICIES
-- =====================================================

-- ---- 6.1 USERS ----
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users
    FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_select_for_admin" ON public.users
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "users_select_for_agents" ON public.users
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.email = auth.email() AND agents.is_active = TRUE));

-- ---- 6.2 SELL REQUESTS ----
CREATE POLICY "sell_requests_select_own" ON public.sell_requests
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sell_requests_insert_own" ON public.sell_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sell_requests_update_own" ON public.sell_requests
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sell_requests_select_admin" ON public.sell_requests
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "sell_requests_update_admin" ON public.sell_requests
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "sell_requests_select_agent" ON public.sell_requests
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.email = auth.email() AND agents.is_active = TRUE AND agents.id = sell_requests.assigned_agent_id));
CREATE POLICY "sell_requests_update_agent" ON public.sell_requests
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.agents WHERE agents.email = auth.email() AND agents.is_active = TRUE AND agents.id = sell_requests.assigned_agent_id));
CREATE POLICY "sell_requests_delete_own" ON public.sell_requests
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- 6.3 NOTIFICATIONS ----
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_select_agent" ON public.notifications
    FOR SELECT TO authenticated
    USING (agent_email IS NOT NULL AND agent_email = (auth.jwt()->>'email')
        AND EXISTS (SELECT 1 FROM public.agents WHERE email = agent_email AND is_active = true));
CREATE POLICY "notifications_update_agent" ON public.notifications
    FOR UPDATE TO authenticated
    USING (agent_email IS NOT NULL AND agent_email = (auth.jwt()->>'email')
        AND EXISTS (SELECT 1 FROM public.agents WHERE email = agent_email AND is_active = true));
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_select_admin" ON public.notifications
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "notifications_update_admin" ON public.notifications
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "notifications_delete_admin" ON public.notifications
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));

-- ---- 6.4 PRICING TABLES (public read, authenticated write) ----
CREATE POLICY "price_engine_select" ON public.price_engine FOR SELECT USING (true);
CREATE POLICY "price_engine_insert" ON public.price_engine FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "price_engine_update" ON public.price_engine FOR UPDATE TO authenticated USING (true);
CREATE POLICY "price_engine_delete" ON public.price_engine FOR DELETE TO authenticated USING (true);

CREATE POLICY "device_prices_select" ON public.device_prices FOR SELECT USING (true);
CREATE POLICY "device_prices_insert" ON public.device_prices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "device_prices_update" ON public.device_prices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "device_prices_delete" ON public.device_prices FOR DELETE TO authenticated USING (true);

CREATE POLICY "condition_deductions_select" ON public.condition_deductions FOR SELECT USING (true);
CREATE POLICY "condition_deductions_insert" ON public.condition_deductions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "condition_deductions_update" ON public.condition_deductions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "condition_deductions_delete" ON public.condition_deductions FOR DELETE TO authenticated USING (true);

CREATE POLICY "variant_prices_select" ON public.variant_prices FOR SELECT USING (true);
CREATE POLICY "variant_prices_insert" ON public.variant_prices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "variant_prices_update" ON public.variant_prices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "variant_prices_delete" ON public.variant_prices FOR DELETE TO authenticated USING (true);

CREATE POLICY "warranty_deductions_select" ON public.warranty_deductions FOR SELECT USING (true);
CREATE POLICY "warranty_deductions_insert" ON public.warranty_deductions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "warranty_deductions_update" ON public.warranty_deductions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "warranty_deductions_delete" ON public.warranty_deductions FOR DELETE TO authenticated USING (true);

-- ---- 6.5 AGENTS ----
CREATE POLICY "agents_select" ON public.agents FOR SELECT USING (true);
CREATE POLICY "agents_insert" ON public.agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agents_update" ON public.agents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "agents_delete" ON public.agents FOR DELETE TO authenticated USING (true);

-- ---- 6.6 AGENT LOCATIONS ----
CREATE POLICY "agent_locations_select" ON public.agent_locations FOR SELECT USING (true);
CREATE POLICY "agent_locations_insert" ON public.agent_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agent_locations_update" ON public.agent_locations FOR UPDATE TO authenticated USING (true);

-- ---- 6.7 AGENT TRACKING ----
CREATE POLICY "agent_tracking_select" ON public.agent_tracking FOR SELECT USING (true);
CREATE POLICY "agent_tracking_insert" ON public.agent_tracking FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agent_tracking_update" ON public.agent_tracking FOR UPDATE TO authenticated USING (true);

-- ---- 6.8 AGENT RATINGS ----
CREATE POLICY "agent_ratings_select" ON public.agent_ratings FOR SELECT USING (true);
CREATE POLICY "agent_ratings_insert" ON public.agent_ratings
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---- 6.9 ADMIN USERS (readable by all, writable by admins) ----
CREATE POLICY "admin_users_select" ON public.admin_users
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_users_insert" ON public.admin_users
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_users_update" ON public.admin_users
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email() AND au.is_active = TRUE));
CREATE POLICY "admin_users_delete" ON public.admin_users
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.email = auth.email() AND au.is_active = TRUE));

-- ---- 6.10 APPROVED ADMIN EMAILS (readable by anyone for registration check) ----
CREATE POLICY "approved_admin_emails_select" ON public.approved_admin_emails FOR SELECT USING (true);
CREATE POLICY "approved_admin_emails_insert" ON public.approved_admin_emails FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "approved_admin_emails_update" ON public.approved_admin_emails FOR UPDATE TO authenticated USING (true);
CREATE POLICY "approved_admin_emails_delete" ON public.approved_admin_emails FOR DELETE TO authenticated USING (true);

-- ---- 6.11 APPROVED AGENT EMAILS (readable by anyone for registration check) ----
CREATE POLICY "approved_agent_emails_select" ON public.approved_agent_emails FOR SELECT USING (true);
CREATE POLICY "approved_agent_emails_insert" ON public.approved_agent_emails FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "approved_agent_emails_update" ON public.approved_agent_emails FOR UPDATE TO authenticated USING (true);
CREATE POLICY "approved_agent_emails_delete" ON public.approved_agent_emails FOR DELETE TO authenticated USING (true);

-- ---- 6.12 SERVICE ZONES ----
CREATE POLICY "service_zones_select" ON public.service_zones FOR SELECT USING (true);
CREATE POLICY "service_zones_admin" ON public.service_zones FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));

-- ---- 6.13 BLOCKED DATES ----
CREATE POLICY "blocked_dates_select" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "blocked_dates_admin" ON public.blocked_dates FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));

-- ---- 6.14 FRAUD ALERTS ----
CREATE POLICY "fraud_alerts_select_admin" ON public.fraud_alerts
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "fraud_alerts_update_admin" ON public.fraud_alerts
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));
CREATE POLICY "fraud_alerts_insert" ON public.fraud_alerts
    FOR INSERT TO authenticated WITH CHECK (true);

-- ---- 6.15 FCM TOKENS ----
CREATE POLICY "fcm_tokens_insert" ON public.fcm_tokens
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fcm_tokens_update" ON public.fcm_tokens
    FOR UPDATE TO authenticated USING (true);
CREATE POLICY "fcm_tokens_delete" ON public.fcm_tokens
    FOR DELETE TO authenticated USING (true);
CREATE POLICY "fcm_tokens_select" ON public.fcm_tokens
    FOR SELECT USING (true);

-- ---- 6.16 USER PROFILES (legacy) ----
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);


-- =====================================================
-- PART 7: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('device-photos', 'device-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('id-proofs', 'id-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-profile-photos', 'customer-profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('agent-profile-photos', 'agent-profile-photos', true);


-- =====================================================
-- PART 8: STORAGE POLICIES
-- =====================================================

-- Device Photos (public read, auth write)
CREATE POLICY "device_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'device-photos');
CREATE POLICY "device_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'device-photos');

-- ID Proofs (private: own folder + admin can view all)
CREATE POLICY "id_proofs_auth_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'id-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_proofs_select_own" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'id-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_proofs_select_admin" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'id-proofs' AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = auth.email() AND admin_users.is_active = TRUE));

-- Profile Photos (public read, auth write)
CREATE POLICY "profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-photos');

-- Customer Profile Photos
CREATE POLICY "customer_profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'customer-profile-photos');
CREATE POLICY "customer_profile_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'customer-profile-photos');
CREATE POLICY "customer_profile_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'customer-profile-photos');
CREATE POLICY "customer_profile_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'customer-profile-photos');

-- Agent Profile Photos
CREATE POLICY "agent_profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'agent-profile-photos');
CREATE POLICY "agent_profile_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agent-profile-photos');
CREATE POLICY "agent_profile_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'agent-profile-photos');
CREATE POLICY "agent_profile_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'agent-profile-photos');


-- =====================================================
-- PART 9: ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sell_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fcm_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.condition_deductions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_engine;


-- =====================================================
-- PART 10: GRANTS
-- =====================================================

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.sell_requests TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.price_engine TO authenticated;
GRANT ALL ON public.device_prices TO authenticated;
GRANT ALL ON public.condition_deductions TO authenticated;
GRANT ALL ON public.variant_prices TO authenticated;
GRANT ALL ON public.warranty_deductions TO authenticated;
GRANT ALL ON public.agents TO authenticated;
GRANT ALL ON public.agent_locations TO authenticated;
GRANT ALL ON public.agent_tracking TO authenticated;
GRANT ALL ON public.agent_ratings TO authenticated;
GRANT ALL ON public.fraud_alerts TO authenticated;
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.approved_admin_emails TO authenticated;
GRANT ALL ON public.approved_agent_emails TO authenticated;
GRANT ALL ON public.service_zones TO authenticated;
GRANT ALL ON public.blocked_dates TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.fcm_tokens TO authenticated;

-- Anonymous access for pricing/scheduling (customer sees before login)
GRANT SELECT ON public.device_prices TO anon;
GRANT SELECT ON public.condition_deductions TO anon;
GRANT SELECT ON public.price_engine TO anon;
GRANT SELECT ON public.service_zones TO anon;
GRANT SELECT ON public.blocked_dates TO anon;
-- Anonymous can check approved emails (needed for registration gate)
GRANT SELECT ON public.approved_admin_emails TO anon;
GRANT SELECT ON public.approved_agent_emails TO anon;


-- =====================================================
-- PART 11: SEED DATA - ADMIN USERS
-- =====================================================

-- Admin accounts (login to admin panel)
INSERT INTO public.admin_users (email, name, role, is_active) VALUES
    ('raogyyy@gmail.com', 'Rao', 'super_admin', true),
    ('himzypharmacy@gmail.com', 'Himzy Admin', 'super_admin', true),
    ('admin@example.com', 'Web Admin', 'super_admin', true);

-- Pre-approved admin emails (for admin registration flow)
INSERT INTO public.approved_admin_emails (email, name, is_active) VALUES
    ('raogyyy@gmail.com', 'Rao', true),
    ('himzypharmacy@gmail.com', 'Himzy', true),
    ('admin@example.com', 'Web Admin', true);


-- =====================================================
-- PART 12: SEED DATA - MacBook PRICES
-- =====================================================

INSERT INTO public.price_engine (device_type, model_name, base_price, scrap_value, deduction_screen_issue, deduction_body_issue, deduction_battery_issue, deduction_keyboard_issue, deduction_no_charger, deduction_no_box) VALUES
('MacBook', 'MacBook Air M1 (2020)', 45000, 5000, 8000, 3000, 5000, 4000, 2000, 1000),
('MacBook', 'MacBook Air M2 (2022)', 65000, 5000, 10000, 4000, 6000, 5000, 2500, 1500),
('MacBook', 'MacBook Air M3 (2024)', 85000, 5000, 12000, 5000, 7000, 6000, 3000, 2000),
('MacBook', 'MacBook Pro 13" M1 (2020)', 55000, 5000, 10000, 4000, 6000, 5000, 2500, 1500),
('MacBook', 'MacBook Pro 13" M2 (2022)', 70000, 5000, 12000, 5000, 7000, 6000, 3000, 2000),
('MacBook', 'MacBook Pro 14" M1 Pro (2021)', 95000, 5000, 15000, 6000, 8000, 7000, 3500, 2500),
('MacBook', 'MacBook Pro 14" M2 Pro (2023)', 115000, 5000, 18000, 7000, 9000, 8000, 4000, 3000),
('MacBook', 'MacBook Pro 14" M3 (2023)', 100000, 5000, 15000, 6000, 8000, 7000, 3500, 2500),
('MacBook', 'MacBook Pro 14" M3 Pro (2023)', 130000, 5000, 18000, 7000, 9000, 8000, 4000, 3000),
('MacBook', 'MacBook Pro 14" M3 Max (2023)', 160000, 5000, 22000, 9000, 11000, 10000, 5000, 4000),
('MacBook', 'MacBook Pro 16" M1 Pro (2021)', 110000, 5000, 18000, 7000, 9000, 8000, 4000, 3000),
('MacBook', 'MacBook Pro 16" M2 Pro (2023)', 135000, 5000, 20000, 8000, 10000, 9000, 4500, 3500),
('MacBook', 'MacBook Pro 16" M3 Pro (2023)', 145000, 5000, 20000, 8000, 10000, 9000, 4500, 3500),
('MacBook', 'MacBook Pro 16" M3 Max (2023)', 180000, 5000, 25000, 10000, 12000, 11000, 5500, 4500);


-- =====================================================
-- PART 13: SEED DATA - iPad PRICES
-- =====================================================

INSERT INTO public.price_engine (device_type, model_name, base_price, scrap_value, deduction_screen_issue, deduction_body_issue, deduction_battery_issue, deduction_keyboard_issue, deduction_no_charger, deduction_no_box) VALUES
('iPad', 'iPad 9th Gen (2021)', 18000, 3000, 4000, 1500, 2000, 0, 1000, 500),
('iPad', 'iPad 10th Gen (2022)', 28000, 4000, 5000, 2000, 2500, 0, 1500, 800),
('iPad', 'iPad Air 4th Gen (2020)', 32000, 4000, 6000, 2500, 3000, 0, 1500, 1000),
('iPad', 'iPad Air 5th Gen M1 (2022)', 42000, 5000, 7000, 3000, 3500, 0, 2000, 1200),
('iPad', 'iPad Air 6th Gen M2 (2024)', 50000, 5000, 8000, 3500, 4000, 0, 2500, 1500),
('iPad', 'iPad Mini 6th Gen (2021)', 35000, 4000, 6000, 2500, 3000, 0, 1500, 1000),
('iPad', 'iPad Pro 11" M1 (2021)', 50000, 5000, 8000, 3500, 4000, 0, 2500, 1500),
('iPad', 'iPad Pro 11" M2 (2022)', 60000, 5000, 9000, 4000, 4500, 0, 3000, 1800),
('iPad', 'iPad Pro 11" M4 (2024)', 75000, 5000, 11000, 4500, 5000, 0, 3500, 2000),
('iPad', 'iPad Pro 12.9" M1 (2021)', 65000, 5000, 10000, 4500, 5000, 0, 3000, 2000),
('iPad', 'iPad Pro 12.9" M2 (2022)', 80000, 6000, 12000, 5000, 5500, 0, 3500, 2500),
('iPad', 'iPad Pro 13" M4 (2024)', 95000, 6000, 14000, 6000, 6000, 0, 4000, 3000);


-- =====================================================
-- PART 14: SEED DATA - DEVICE PRICES (Storage Variants)
-- =====================================================

INSERT INTO public.device_prices (device_type, model, storage, base_price) VALUES
-- MacBook
('MacBook', 'MacBook Air M1', '256GB', 45000),
('MacBook', 'MacBook Air M1', '512GB', 55000),
('MacBook', 'MacBook Air M2', '256GB', 65000),
('MacBook', 'MacBook Air M2', '512GB', 75000),
('MacBook', 'MacBook Air M3', '256GB', 85000),
('MacBook', 'MacBook Air M3', '512GB', 95000),
('MacBook', 'MacBook Air M3', '1TB', 105000),
('MacBook', 'MacBook Pro 13" M1', '256GB', 55000),
('MacBook', 'MacBook Pro 13" M1', '512GB', 65000),
('MacBook', 'MacBook Pro 13" M2', '256GB', 70000),
('MacBook', 'MacBook Pro 13" M2', '512GB', 80000),
('MacBook', 'MacBook Pro 14" M1 Pro', '512GB', 95000),
('MacBook', 'MacBook Pro 14" M1 Pro', '1TB', 110000),
('MacBook', 'MacBook Pro 14" M2 Pro', '512GB', 115000),
('MacBook', 'MacBook Pro 14" M2 Pro', '1TB', 130000),
('MacBook', 'MacBook Pro 14" M3', '512GB', 100000),
('MacBook', 'MacBook Pro 14" M3', '1TB', 115000),
('MacBook', 'MacBook Pro 14" M3 Pro', '512GB', 130000),
('MacBook', 'MacBook Pro 14" M3 Pro', '1TB', 145000),
('MacBook', 'MacBook Pro 14" M3 Max', '1TB', 160000),
('MacBook', 'MacBook Pro 14" M3 Max', '2TB', 185000),
('MacBook', 'MacBook Pro 16" M1 Pro', '512GB', 110000),
('MacBook', 'MacBook Pro 16" M1 Pro', '1TB', 125000),
('MacBook', 'MacBook Pro 16" M2 Pro', '512GB', 135000),
('MacBook', 'MacBook Pro 16" M2 Pro', '1TB', 150000),
('MacBook', 'MacBook Pro 16" M3 Pro', '512GB', 145000),
('MacBook', 'MacBook Pro 16" M3 Pro', '1TB', 160000),
('MacBook', 'MacBook Pro 16" M3 Max', '1TB', 180000),
('MacBook', 'MacBook Pro 16" M3 Max', '2TB', 210000),
-- iPad
('iPad', 'iPad 9th Gen', '64GB', 18000),
('iPad', 'iPad 9th Gen', '256GB', 22000),
('iPad', 'iPad 10th Gen', '64GB', 28000),
('iPad', 'iPad 10th Gen', '256GB', 34000),
('iPad', 'iPad Air M1', '64GB', 42000),
('iPad', 'iPad Air M1', '256GB', 50000),
('iPad', 'iPad Air M2', '128GB', 50000),
('iPad', 'iPad Air M2', '256GB', 58000),
('iPad', 'iPad Air M2', '512GB', 68000),
('iPad', 'iPad Air M2', '1TB', 80000),
('iPad', 'iPad Mini 6', '64GB', 35000),
('iPad', 'iPad Mini 6', '256GB', 42000),
('iPad', 'iPad Pro 11" M1', '128GB', 50000),
('iPad', 'iPad Pro 11" M1', '256GB', 58000),
('iPad', 'iPad Pro 11" M1', '512GB', 68000),
('iPad', 'iPad Pro 11" M2', '128GB', 60000),
('iPad', 'iPad Pro 11" M2', '256GB', 70000),
('iPad', 'iPad Pro 11" M2', '512GB', 82000),
('iPad', 'iPad Pro 11" M4', '256GB', 75000),
('iPad', 'iPad Pro 11" M4', '512GB', 88000),
('iPad', 'iPad Pro 11" M4', '1TB', 105000),
('iPad', 'iPad Pro 12.9" M1', '128GB', 65000),
('iPad', 'iPad Pro 12.9" M1', '256GB', 75000),
('iPad', 'iPad Pro 12.9" M1', '512GB', 88000),
('iPad', 'iPad Pro 12.9" M2', '128GB', 80000),
('iPad', 'iPad Pro 12.9" M2', '256GB', 90000),
('iPad', 'iPad Pro 12.9" M2', '512GB', 105000),
('iPad', 'iPad Pro 12.9" M2', '1TB', 125000),
('iPad', 'iPad Pro 13" M4', '256GB', 95000),
('iPad', 'iPad Pro 13" M4', '512GB', 110000),
('iPad', 'iPad Pro 13" M4', '1TB', 130000),
('iPad', 'iPad Pro 13" M4', '2TB', 155000);


-- =====================================================
-- PART 15: SEED DATA - CONDITION DEDUCTIONS
-- =====================================================

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
-- Keyboard
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
-- Microphone
('Microphone', 'Working', 0, 'FLAT', 'MINOR', 1),
('Microphone', 'Not working', 3000, 'FLAT', 'CRITICAL', 2),
-- Camera
('Camera', 'Working', 0, 'FLAT', 'MINOR', 1),
('Camera', 'Blurry/Damaged', 2000, 'FLAT', 'MINOR', 2),
('Camera', 'Not working', 4000, 'FLAT', 'CRITICAL', 3),
-- FaceID
('FaceID', 'Working', 0, 'FLAT', 'MINOR', 1),
('FaceID', 'Not working', 5000, 'FLAT', 'CRITICAL', 2),
-- TouchID
('TouchID', 'Working', 0, 'FLAT', 'MINOR', 1),
('TouchID', 'Not working', 4000, 'FLAT', 'CRITICAL', 2),
-- WiFi
('WiFi', 'Working', 0, 'FLAT', 'MINOR', 1),
('WiFi', 'Not working', 5000, 'FLAT', 'CRITICAL', 2),
-- Bluetooth
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
('Accessories', 'Apple Pencil 1st Gen included', -2000, 'FLAT', 'BONUS', 4),
('Accessories', 'Apple Pencil 2nd Gen included', -3500, 'FLAT', 'BONUS', 5),
('Accessories', 'Apple Pencil Pro included', -5000, 'FLAT', 'BONUS', 6),
('Accessories', 'Magic Keyboard included', -5000, 'FLAT', 'BONUS', 7),
('Accessories', 'Smart Keyboard Folio included', -3000, 'FLAT', 'BONUS', 8),
-- Cycle Count (MacBook)
('CycleCount', '0-299 cycles', 0, 'FLAT', 'MINOR', 1),
('CycleCount', '300-499 cycles', 1500, 'FLAT', 'MINOR', 2),
('CycleCount', '500-799 cycles', 3000, 'FLAT', 'MINOR', 3),
('CycleCount', '800-999 cycles', 5000, 'FLAT', 'CRITICAL', 4),
('CycleCount', '1000+ cycles', 8000, 'FLAT', 'CRITICAL', 5),
-- Cellular (iPad)
('Cellular', 'WiFi Only', 0, 'FLAT', 'MINOR', 1),
('Cellular', 'WiFi + Cellular (Working)', -3000, 'FLAT', 'BONUS', 2),
('Cellular', 'WiFi + Cellular (Not Working)', 2000, 'FLAT', 'MINOR', 3),
-- Apple Pencil Support
('ApplePencil', 'Supports Apple Pencil', 0, 'FLAT', 'MINOR', 1),
('ApplePencil', 'Does not support Apple Pencil', 0, 'FLAT', 'MINOR', 2);


-- =====================================================
-- PART 16: SEED DATA - WARRANTY & VARIANT PRICES
-- =====================================================

INSERT INTO public.warranty_deductions (device_type, no_warranty_deduction, description) VALUES
('MacBook', 5000, 'Deduction for MacBook without warranty'),
('iPad', 3000, 'Deduction for iPad without warranty'),
('All', 4000, 'Default deduction for devices without warranty');

-- MacBook Air M1 variants
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M1 (2020)', 'storage', '256GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M1 (2020)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M1 (2020)', 'storage', '512GB', 8000 FROM public.price_engine WHERE model_name = 'MacBook Air M1 (2020)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M1 (2020)', 'ram', '8GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M1 (2020)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M1 (2020)', 'ram', '16GB', 10000 FROM public.price_engine WHERE model_name = 'MacBook Air M1 (2020)';

-- MacBook Air M2 variants
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'storage', '256GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'storage', '512GB', 10000 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'storage', '1TB', 20000 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'ram', '8GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'ram', '16GB', 12000 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M2 (2022)', 'ram', '24GB', 20000 FROM public.price_engine WHERE model_name = 'MacBook Air M2 (2022)';

-- MacBook Air M3 variants
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'storage', '256GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'storage', '512GB', 10000 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'storage', '1TB', 20000 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'ram', '8GB', 0 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'ram', '16GB', 12000 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';
INSERT INTO public.variant_prices (price_engine_id, device_type, model, variant_type, variant_value, base_price_adjustment)
SELECT id, 'MacBook', 'MacBook Air M3 (2024)', 'ram', '24GB', 22000 FROM public.price_engine WHERE model_name = 'MacBook Air M3 (2024)';


-- =====================================================
-- PART 17: SEED DATA - SERVICE ZONES
-- =====================================================

INSERT INTO public.service_zones (pincode, city, state, max_orders_per_day, is_serviceable, available_slots) VALUES
('560001', 'Bangalore', 'Karnataka', 15, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('560002', 'Bangalore', 'Karnataka', 15, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('560003', 'Bangalore', 'Karnataka', 10, true, '["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"]'),
('400001', 'Mumbai', 'Maharashtra', 20, true, '["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('400002', 'Mumbai', 'Maharashtra', 20, true, '["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('110001', 'New Delhi', 'Delhi', 18, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "3:00 PM - 5:00 PM"]'),
('110002', 'New Delhi', 'Delhi', 18, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "3:00 PM - 5:00 PM"]'),
('600001', 'Chennai', 'Tamil Nadu', 12, true, '["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM", "4:00 PM - 6:00 PM"]'),
('500001', 'Hyderabad', 'Telangana', 14, true, '["10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM", "4:00 PM - 6:00 PM"]'),
('411001', 'Pune', 'Maharashtra', 10, true, '["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"]');


-- =====================================================
-- MIGRATIONS (Run these if upgrading an existing DB)
-- =====================================================
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Agent self-assign & payment verification columns
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS agent_self_assigned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS agent_self_assigned_at TIMESTAMPTZ;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS payment_verified_by_agent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS payment_method_used TEXT;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS admin_rejected_before_assign BOOLEAN DEFAULT FALSE;


-- =====================================================
-- PART 18: AGENT SELF-ASSIGN & PAYMENT VERIFICATION
-- =====================================================

-- RLS: Agents can see ALL approved/confirmed unassigned requests (for self-assign)
CREATE POLICY "sell_requests_select_agent_available" ON public.sell_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.agents WHERE agents.email = auth.email() AND agents.is_active = TRUE)
        AND assigned_agent_id IS NULL
        AND admin_rejected_before_assign = FALSE
        AND status IN ('Approved', 'Seller_Confirmed', 'Offer_Accepted')
    );

-- RLS: Agents can update unassigned requests to self-assign
CREATE POLICY "sell_requests_agent_self_assign" ON public.sell_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.agents WHERE agents.email = auth.email() AND agents.is_active = TRUE)
        AND (
            -- Can self-assign unassigned approved requests
            (assigned_agent_id IS NULL AND status IN ('Approved', 'Seller_Confirmed', 'Offer_Accepted'))
            OR
            -- Can update their own assigned requests (existing behavior)
            (assigned_agent_id = (SELECT id FROM public.agents WHERE agents.email = auth.email() LIMIT 1))
        )
    );

-- Function: Agent self-assigns a pickup
CREATE OR REPLACE FUNCTION public.agent_self_assign_pickup(
    p_agent_id UUID,
    p_request_id UUID,
    p_pickup_date DATE,
    p_pickup_slot TEXT,
    p_pickup_time TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
    v_agent_name TEXT;
    v_current_status TEXT;
    v_current_agent UUID;
BEGIN
    -- Check request is still available
    SELECT status, assigned_agent_id INTO v_current_status, v_current_agent
    FROM public.sell_requests WHERE id = p_request_id;

    IF v_current_agent IS NOT NULL THEN
        RETURN FALSE; -- Already assigned
    END IF;

    IF v_current_status NOT IN ('Approved', 'Seller_Confirmed', 'Offer_Accepted') THEN
        RETURN FALSE; -- Not in assignable status
    END IF;

    -- Get agent name
    SELECT name INTO v_agent_name FROM public.agents WHERE id = p_agent_id;

    -- Assign the request to this agent
    UPDATE public.sell_requests SET
        assigned_agent_id = p_agent_id,
        assigned_agent_name = v_agent_name,
        agent_self_assigned = TRUE,
        agent_self_assigned_at = NOW(),
        pickup_date = p_pickup_date,
        pickup_slot = p_pickup_slot,
        pickup_scheduled_time = p_pickup_time,
        status = 'Pickup_Scheduled',
        updated_at = NOW()
    WHERE id = p_request_id AND assigned_agent_id IS NULL;

    -- Create agent_tracking row
    INSERT INTO public.agent_tracking (sell_request_id, agent_id, pickup_status)
    VALUES (p_request_id, p_agent_id, 'assigned');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Agent verifies payment after sending money
CREATE OR REPLACE FUNCTION public.agent_verify_payment(
    p_agent_id UUID,
    p_request_id UUID,
    p_payment_method TEXT DEFAULT 'UPI',
    p_payment_reference TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_assigned_agent UUID;
    v_bank_details JSONB;
BEGIN
    -- Check agent is assigned to this request
    SELECT assigned_agent_id, bank_details INTO v_assigned_agent, v_bank_details
    FROM public.sell_requests WHERE id = p_request_id;

    IF v_assigned_agent != p_agent_id THEN
        RETURN FALSE; -- Not assigned to this agent
    END IF;

    -- Update bank_details with payment_done info
    v_bank_details = COALESCE(v_bank_details, '{}'::jsonb);
    v_bank_details = v_bank_details || jsonb_build_object(
        'payment_done', true,
        'payment_done_at', NOW()::text,
        'payment_done_by', 'agent',
        'payment_method', p_payment_method,
        'payment_reference', p_payment_reference
    );

    UPDATE public.sell_requests SET
        payment_verified_by_agent = TRUE,
        payment_verified_at = NOW(),
        payment_method_used = p_payment_method,
        payment_reference = p_payment_reference,
        payment_status = 'Completed',
        bank_details = v_bank_details,
        status = 'Completed',
        updated_at = NOW()
    WHERE id = p_request_id AND assigned_agent_id = p_agent_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Admin rejects a request before agent can assign
CREATE OR REPLACE FUNCTION public.admin_reject_before_assign(
    p_request_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.sell_requests SET
        admin_rejected_before_assign = TRUE,
        status = 'Rejected',
        rejection_reason = COALESCE(p_reason, 'Rejected by admin before pickup'),
        updated_at = NOW()
    WHERE id = p_request_id AND assigned_agent_id IS NULL;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger: Notify agent when self-assigned pickup updates
CREATE OR REPLACE FUNCTION public.notify_on_agent_self_assign()
RETURNS TRIGGER AS $$
DECLARE
    v_agent_email TEXT;
    v_device_model TEXT;
    v_customer_name TEXT;
BEGIN
    -- Only fire when agent_self_assigned changes from false to true
    IF OLD.agent_self_assigned IS DISTINCT FROM NEW.agent_self_assigned AND NEW.agent_self_assigned = TRUE THEN
        v_device_model := COALESCE(NEW.model_name, NEW.device_name, 'Device');
        SELECT name INTO v_customer_name FROM public.users WHERE id = NEW.user_id;

        -- Notify customer that agent is assigned
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.user_id,
            '🚀 Agent Assigned!',
            COALESCE(NEW.assigned_agent_name, 'An agent') || ' will pick up your ' || v_device_model,
            'agent_assigned',
            jsonb_build_object('request_id', NEW.id, 'agent_name', NEW.assigned_agent_name, 'model', v_device_model)
        );

        -- Notify all admins about self-assignment
        INSERT INTO public.notifications (user_id, title, body, type, data)
        SELECT u.id, '📋 Agent Self-Assigned',
            COALESCE(NEW.assigned_agent_name, 'Agent') || ' picked up: ' || v_device_model || ' for ' || COALESCE(v_customer_name, 'Customer'),
            'agent_self_assigned',
            jsonb_build_object('request_id', NEW.id, 'agent_name', NEW.assigned_agent_name, 'model', v_device_model)
        FROM public.admin_users au
        JOIN public.users u ON u.email = au.email
        WHERE au.is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_agent_self_assign AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_agent_self_assign();

-- Notification trigger: Notify admin when agent verifies payment
CREATE OR REPLACE FUNCTION public.notify_on_agent_payment_verify()
RETURNS TRIGGER AS $$
DECLARE
    v_device_model TEXT;
BEGIN
    IF OLD.payment_verified_by_agent IS DISTINCT FROM NEW.payment_verified_by_agent AND NEW.payment_verified_by_agent = TRUE THEN
        v_device_model := COALESCE(NEW.model_name, NEW.device_name, 'Device');

        -- Notify customer: payment received
        INSERT INTO public.notifications (user_id, title, body, type, data)
        VALUES (
            NEW.user_id,
            '💰 Payment Confirmed!',
            'Payment for your ' || v_device_model || ' has been completed. ₹' || COALESCE(NEW.final_price, NEW.admin_offer_price, 0),
            'payment_confirmed',
            jsonb_build_object('request_id', NEW.id, 'amount', COALESCE(NEW.final_price, NEW.admin_offer_price, 0))
        );

        -- Notify all admins
        INSERT INTO public.notifications (user_id, title, body, type, data)
        SELECT u.id, '💰 Payment Verified by Agent',
            COALESCE(NEW.assigned_agent_name, 'Agent') || ' verified payment for ' || v_device_model || ' - ₹' || COALESCE(NEW.final_price, NEW.admin_offer_price, 0),
            'agent_payment_verified',
            jsonb_build_object('request_id', NEW.id, 'amount', COALESCE(NEW.final_price, NEW.admin_offer_price, 0), 'method', NEW.payment_method_used)
        FROM public.admin_users au
        JOIN public.users u ON u.email = au.email
        WHERE au.is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_agent_payment_verify AFTER UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_agent_payment_verify();

-- Grants for new functions
GRANT EXECUTE ON FUNCTION public.agent_self_assign_pickup TO authenticated;
GRANT EXECUTE ON FUNCTION public.agent_verify_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_before_assign TO authenticated;


-- =====================================================
-- DONE!
-- =====================================================
SELECT '✅ BUYBACK ELITE - UNIVERSAL DATABASE SETUP COMPLETE!' as status;
SELECT '20 Tables, 14 Functions, 23 Triggers, 5 Storage Buckets, 7 Realtime Tables' as summary;
SELECT 'Admins: raogyyy@gmail.com, himzypharmacy@gmail.com, admin@example.com' as admins;
SELECT '🆕 Agent Self-Assign + Payment Verification enabled!' as new_features;
