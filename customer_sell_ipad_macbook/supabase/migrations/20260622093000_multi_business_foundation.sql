-- =====================================================
-- MULTI-BUSINESS FOUNDATION - PHASE 1
-- Additive migration for tenant-aware routing, pricing, and audit surfaces.
-- =====================================================

-- ---- Helper admin functions ----
CREATE OR REPLACE FUNCTION public.is_active_admin(_email TEXT DEFAULT auth.email())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = _email
      AND is_active = TRUE
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_email TEXT DEFAULT auth.email())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = _email
      AND is_active = TRUE
      AND role = 'super_admin'
  )
$$;

-- ---- Businesses ----
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    legal_name TEXT,
    city TEXT,
    state TEXT,
    owner_name TEXT,
    owner_email TEXT,
    owner_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'inactive')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    commission_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_single_default
    ON public.businesses (is_default)
    WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- ---- Business admin access ----
CREATE TABLE IF NOT EXISTS public.business_admin_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    access_role TEXT NOT NULL DEFAULT 'manager' CHECK (access_role IN ('owner', 'manager', 'ops', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, admin_user_id)
);
CREATE INDEX IF NOT EXISTS idx_business_admin_access_business ON public.business_admin_access(business_id);
CREATE INDEX IF NOT EXISTS idx_business_admin_access_admin ON public.business_admin_access(admin_user_id);

-- ---- Business service zones ----
CREATE TABLE IF NOT EXISTS public.business_service_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    pincode TEXT NOT NULL,
    city TEXT,
    state TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, pincode)
);
CREATE INDEX IF NOT EXISTS idx_business_service_zones_lookup
    ON public.business_service_zones(pincode, is_active, priority, business_id);

-- ---- Business pricing rules ----
CREATE TABLE IF NOT EXISTS public.business_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'ipad', 'macbook')),
    rule_type TEXT NOT NULL CHECK (rule_type IN ('markup', 'markdown', 'flat')),
    label TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, label)
);
CREATE INDEX IF NOT EXISTS idx_business_pricing_rules_business ON public.business_pricing_rules(business_id, is_active);

-- ---- Sell events ----
CREATE TABLE IF NOT EXISTS public.sell_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    event_type TEXT NOT NULL,
    message TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sell_events_request_created ON public.sell_events(sell_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sell_events_business_created ON public.sell_events(business_id, created_at DESC);

-- ---- Admin audit ----
CREATE TABLE IF NOT EXISTS public.admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    message TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_business_created ON public.admin_audit(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_created ON public.admin_audit(actor_email, created_at DESC);

-- ---- Existing tables extended for tenant context ----
ALTER TABLE public.sell_requests
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS business_assignment_source TEXT CHECK (business_assignment_source IN ('manual', 'pincode', 'city', 'default')),
    ADD COLUMN IF NOT EXISTS business_assignment_notes TEXT,
    ADD COLUMN IF NOT EXISTS business_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.agents
    ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS primary_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sell_requests_business ON public.sell_requests(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_business ON public.agents(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_primary_business ON public.admin_users(primary_business_id, is_active);

-- ---- Updated_at triggers for new tables ----
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_pricing_rules_updated_at BEFORE UPDATE ON public.business_pricing_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---- Access helpers ----
CREATE OR REPLACE FUNCTION public.admin_can_access_business(_business_id UUID, _email TEXT DEFAULT auth.email())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_super_admin(_email)
    OR EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.email = _email
        AND au.is_active = TRUE
        AND au.primary_business_id = _business_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.business_admin_access baa
      JOIN public.admin_users au ON au.id = baa.admin_user_id
      WHERE au.email = _email
        AND au.is_active = TRUE
        AND baa.is_active = TRUE
        AND baa.business_id = _business_id
    )
  )
$$;

-- ---- Default business seed ----
CREATE OR REPLACE FUNCTION public.ensure_default_business()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    SELECT id INTO v_business_id
    FROM public.businesses
    WHERE is_default = TRUE
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_business_id IS NOT NULL THEN
        RETURN v_business_id;
    END IF;

    INSERT INTO public.businesses (
        slug,
        name,
        legal_name,
        city,
        state,
        owner_name,
        owner_email,
        owner_phone,
        status,
        is_default,
        metadata
    )
    VALUES (
        'buyback-elite-default',
        'BuyBack Elite',
        'BuyBack Elite',
        COALESCE((SELECT city FROM public.service_zones WHERE city IS NOT NULL ORDER BY city ASC LIMIT 1), 'Default City'),
        COALESCE((SELECT state FROM public.service_zones WHERE state IS NOT NULL ORDER BY state ASC LIMIT 1), 'Default State'),
        COALESCE((SELECT name FROM public.admin_users WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1), 'Core Team'),
        COALESCE((SELECT email FROM public.admin_users WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1), 'ops@buybackelite.local'),
        COALESCE((SELECT phone FROM public.admin_users WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1), ''),
        'active',
        TRUE,
        jsonb_build_object('seeded_by', '20260622093000_multi_business_foundation')
    )
    ON CONFLICT (slug) DO UPDATE
        SET is_default = TRUE,
            updated_at = NOW()
    RETURNING id INTO v_business_id;

    RETURN v_business_id;
END;
$$;

-- ---- Business resolution ----
CREATE OR REPLACE FUNCTION public.resolve_business_for_request(
    p_pincode TEXT,
    p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
    business_id UUID,
    assignment_source TEXT,
    business_name TEXT,
    business_city TEXT,
    business_slug TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NULLIF(TRIM(COALESCE(p_pincode, '')), '') IS NOT NULL THEN
        RETURN QUERY
        SELECT b.id, 'pincode'::TEXT, b.name, COALESCE(b.city, ''), b.slug
        FROM public.business_service_zones bsz
        JOIN public.businesses b ON b.id = bsz.business_id
        WHERE bsz.pincode = TRIM(p_pincode)
          AND bsz.is_active = TRUE
          AND b.status = 'active'
        ORDER BY bsz.priority ASC, b.created_at ASC
        LIMIT 1;
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    IF NULLIF(TRIM(COALESCE(p_city, '')), '') IS NOT NULL THEN
        RETURN QUERY
        SELECT b.id, 'city'::TEXT, b.name, COALESCE(b.city, ''), b.slug
        FROM public.businesses b
        WHERE LOWER(COALESCE(b.city, '')) = LOWER(TRIM(p_city))
          AND b.status = 'active'
        ORDER BY b.is_default DESC, b.created_at ASC
        LIMIT 1;
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    RETURN QUERY
    SELECT b.id, 'default'::TEXT, b.name, COALESCE(b.city, ''), b.slug
    FROM public.businesses b
    WHERE b.id = public.ensure_default_business();
END;
$$;

-- ---- Sell request tenant sync ----
CREATE OR REPLACE FUNCTION public.sync_sell_request_business_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resolved RECORD;
BEGIN
    SELECT * INTO v_resolved
    FROM public.resolve_business_for_request(
        NEW.pickup_pincode,
        COALESCE(NULLIF(NEW.user_location->>'city', ''), NULLIF(TRIM(NEW.user_address), ''))
    )
    LIMIT 1;

    IF NEW.business_id IS NULL AND v_resolved.business_id IS NOT NULL THEN
        NEW.business_id := v_resolved.business_id;
    END IF;

    IF COALESCE(NEW.business_assignment_source, '') = '' AND v_resolved.assignment_source IS NOT NULL THEN
        NEW.business_assignment_source := v_resolved.assignment_source;
    END IF;

    IF COALESCE(NEW.business_assignment_notes, '') = '' AND v_resolved.assignment_source IS NOT NULL THEN
        NEW.business_assignment_notes := 'Auto-assigned via ' || v_resolved.assignment_source;
    END IF;

    IF COALESCE(NEW.business_snapshot, '{}'::jsonb) = '{}'::jsonb AND NEW.business_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', b.id,
            'name', b.name,
            'city', COALESCE(b.city, ''),
            'slug', b.slug,
            'assignment_source', COALESCE(NEW.business_assignment_source, v_resolved.assignment_source, 'manual')
        )
        INTO NEW.business_snapshot
        FROM public.businesses b
        WHERE b.id = NEW.business_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_sell_request_business_context
    BEFORE INSERT OR UPDATE OF business_id, pickup_pincode, user_location, user_address
    ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.sync_sell_request_business_context();

-- ---- Sell event logging ----
CREATE OR REPLACE FUNCTION public.log_sell_request_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.sell_events (sell_request_id, business_id, actor_user_id, actor_email, event_type, message, meta)
        VALUES (
            NEW.id,
            NEW.business_id,
            NEW.user_id,
            auth.email(),
            'created',
            'Sell request created',
            jsonb_build_object('status', NEW.status, 'device_type', NEW.device_type, 'model_name', NEW.model_name)
        );
        RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.sell_events (sell_request_id, business_id, actor_user_id, actor_email, event_type, message, meta)
        VALUES (
            NEW.id,
            NEW.business_id,
            auth.uid(),
            auth.email(),
            'status_changed',
            'Status changed from ' || COALESCE(OLD.status, 'unknown') || ' to ' || COALESCE(NEW.status, 'unknown'),
            jsonb_build_object('from', OLD.status, 'to', NEW.status)
        );
    END IF;

    IF NEW.assigned_agent_id IS DISTINCT FROM OLD.assigned_agent_id AND NEW.assigned_agent_id IS NOT NULL THEN
        INSERT INTO public.sell_events (sell_request_id, business_id, actor_user_id, actor_email, event_type, message, meta)
        VALUES (
            NEW.id,
            NEW.business_id,
            auth.uid(),
            auth.email(),
            'agent_assigned',
            'Agent assigned to sell request',
            jsonb_build_object('assigned_agent_id', NEW.assigned_agent_id)
        );
    END IF;

    IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
        INSERT INTO public.sell_events (sell_request_id, business_id, actor_user_id, actor_email, event_type, message, meta)
        VALUES (
            NEW.id,
            NEW.business_id,
            auth.uid(),
            auth.email(),
            'business_changed',
            'Business assignment updated',
            jsonb_build_object('from', OLD.business_id, 'to', NEW.business_id, 'source', NEW.business_assignment_source)
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_sell_request_event
    AFTER INSERT OR UPDATE ON public.sell_requests
    FOR EACH ROW EXECUTE FUNCTION public.log_sell_request_event();

-- ---- RLS enablement ----
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

-- ---- RLS policies ----
DROP POLICY IF EXISTS "businesses_select_authenticated" ON public.businesses;
CREATE POLICY "businesses_select_authenticated" ON public.businesses
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "businesses_insert_admin" ON public.businesses;
CREATE POLICY "businesses_insert_admin" ON public.businesses
    FOR INSERT TO authenticated WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "businesses_update_admin" ON public.businesses;
CREATE POLICY "businesses_update_admin" ON public.businesses
    FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR public.admin_can_access_business(id))
    WITH CHECK (public.is_super_admin() OR public.admin_can_access_business(id));

DROP POLICY IF EXISTS "businesses_delete_super_admin" ON public.businesses;
CREATE POLICY "businesses_delete_super_admin" ON public.businesses
    FOR DELETE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "business_admin_access_select_admin" ON public.business_admin_access;
CREATE POLICY "business_admin_access_select_admin" ON public.business_admin_access
    FOR SELECT TO authenticated USING (public.is_active_admin());

DROP POLICY IF EXISTS "business_admin_access_write_super_admin" ON public.business_admin_access;
CREATE POLICY "business_admin_access_write_super_admin" ON public.business_admin_access
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "business_service_zones_select_authenticated" ON public.business_service_zones;
CREATE POLICY "business_service_zones_select_authenticated" ON public.business_service_zones
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "business_service_zones_write_admin" ON public.business_service_zones;
CREATE POLICY "business_service_zones_write_admin" ON public.business_service_zones
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR public.admin_can_access_business(business_id))
    WITH CHECK (public.is_super_admin() OR public.admin_can_access_business(business_id));

DROP POLICY IF EXISTS "business_pricing_rules_select_authenticated" ON public.business_pricing_rules;
CREATE POLICY "business_pricing_rules_select_authenticated" ON public.business_pricing_rules
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "business_pricing_rules_write_admin" ON public.business_pricing_rules;
CREATE POLICY "business_pricing_rules_write_admin" ON public.business_pricing_rules
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR public.admin_can_access_business(business_id))
    WITH CHECK (public.is_super_admin() OR public.admin_can_access_business(business_id));

DROP POLICY IF EXISTS "sell_events_select_visible" ON public.sell_events;
CREATE POLICY "sell_events_select_visible" ON public.sell_events
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.sell_requests sr
            WHERE sr.id = sell_events.sell_request_id
              AND (
                  sr.user_id = auth.uid()
                  OR public.is_active_admin()
                  OR EXISTS (
                      SELECT 1
                      FROM public.agents a
                      WHERE a.email = auth.email()
                        AND a.is_active = TRUE
                        AND a.id = sr.assigned_agent_id
                  )
              )
        )
    );

DROP POLICY IF EXISTS "sell_events_insert_visible" ON public.sell_events;
CREATE POLICY "sell_events_insert_visible" ON public.sell_events
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.sell_requests sr
            WHERE sr.id = sell_events.sell_request_id
              AND (
                  sr.user_id = auth.uid()
                  OR public.is_active_admin()
                  OR EXISTS (
                      SELECT 1
                      FROM public.agents a
                      WHERE a.email = auth.email()
                        AND a.is_active = TRUE
                        AND a.id = sr.assigned_agent_id
                  )
              )
        )
    );

DROP POLICY IF EXISTS "admin_audit_select_admin" ON public.admin_audit;
CREATE POLICY "admin_audit_select_admin" ON public.admin_audit
    FOR SELECT TO authenticated USING (public.is_active_admin());

DROP POLICY IF EXISTS "admin_audit_insert_admin" ON public.admin_audit;
CREATE POLICY "admin_audit_insert_admin" ON public.admin_audit
    FOR INSERT TO authenticated WITH CHECK (public.is_active_admin());

-- ---- Seed default business and backfill compatibility data ----
SELECT public.ensure_default_business();

WITH default_business AS (
    SELECT public.ensure_default_business() AS id
)
UPDATE public.agents a
SET business_id = db.id,
    updated_at = NOW()
FROM default_business db
WHERE a.business_id IS NULL;

WITH default_business AS (
    SELECT public.ensure_default_business() AS id
)
UPDATE public.admin_users au
SET primary_business_id = db.id
FROM default_business db
WHERE au.primary_business_id IS NULL
  AND COALESCE(au.role, 'admin') <> 'super_admin';

WITH default_business AS (
    SELECT public.ensure_default_business() AS id
)
INSERT INTO public.business_admin_access (business_id, admin_user_id, access_role, is_active)
SELECT db.id,
       au.id,
       CASE WHEN au.role = 'super_admin' THEN 'owner' ELSE 'manager' END,
       TRUE
FROM public.admin_users au
CROSS JOIN default_business db
WHERE au.is_active = TRUE
ON CONFLICT (business_id, admin_user_id) DO NOTHING;

WITH default_business AS (
    SELECT public.ensure_default_business() AS id
)
INSERT INTO public.business_service_zones (business_id, pincode, city, state, priority, is_active)
SELECT db.id,
       sz.pincode,
       sz.city,
       sz.state,
       100,
       COALESCE(sz.is_active, TRUE) AND COALESCE(sz.is_serviceable, TRUE)
FROM public.service_zones sz
CROSS JOIN default_business db
ON CONFLICT (business_id, pincode) DO UPDATE
    SET city = EXCLUDED.city,
        state = EXCLUDED.state,
        is_active = EXCLUDED.is_active;

WITH default_business AS (
    SELECT public.ensure_default_business() AS id
), default_business_row AS (
    SELECT b.id, b.name, b.city, b.slug
    FROM public.businesses b
    JOIN default_business db ON db.id = b.id
)
UPDATE public.sell_requests sr
SET business_id = dbr.id,
    business_assignment_source = COALESCE(sr.business_assignment_source, 'default'),
    business_assignment_notes = COALESCE(sr.business_assignment_notes, 'Backfilled during multi-business migration'),
    business_snapshot = CASE
        WHEN COALESCE(sr.business_snapshot, '{}'::jsonb) = '{}'::jsonb THEN
            jsonb_build_object(
                'id', dbr.id,
                'name', dbr.name,
                'city', COALESCE(dbr.city, ''),
                'slug', dbr.slug,
                'assignment_source', COALESCE(sr.business_assignment_source, 'default')
            )
        ELSE sr.business_snapshot
    END
FROM default_business_row dbr
WHERE sr.business_id IS NULL;