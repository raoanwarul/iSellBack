-- =====================================================
-- MARKETPLACE ENHANCEMENTS
-- Adds device_type, delivery options, area-based RPCs
-- =====================================================

-- ---- Listings enhancements ----
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'MacBook' CHECK (device_type IN ('MacBook', 'iPad')),
    ADD COLUMN IF NOT EXISTS exchange_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'sell' CHECK (listing_type IN ('sell', 'buyback'));

CREATE INDEX IF NOT EXISTS idx_listings_device_type ON public.listings(device_type, status);

-- ---- Business enhancements ----
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS storefront_address TEXT,
    ADD COLUMN IF NOT EXISTS storefront_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS storefront_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS delivery_options JSONB NOT NULL DEFAULT '{"agent_pickup": true, "store_visit": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS business_hours TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ---- Sell request enhancements ----
ALTER TABLE public.sell_requests
    ADD COLUMN IF NOT EXISTS delivery_preference TEXT DEFAULT 'agent_pickup'
        CHECK (delivery_preference IN ('agent_pickup', 'store_visit')),
    ADD COLUMN IF NOT EXISTS selected_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sell_requests_selected_business ON public.sell_requests(selected_business_id);

-- ---- RPC: Get listings by area ----
CREATE OR REPLACE FUNCTION public.get_listings_by_area(
    p_pincode TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 48
)
RETURNS SETOF public.listings
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_ids UUID[];
BEGIN
    -- Collect business IDs that serve this area
    IF NULLIF(TRIM(COALESCE(p_pincode, '')), '') IS NOT NULL THEN
        SELECT ARRAY_AGG(DISTINCT bsz.business_id) INTO v_business_ids
        FROM public.business_service_zones bsz
        JOIN public.businesses b ON b.id = bsz.business_id AND b.status = 'active'
        WHERE bsz.pincode = TRIM(p_pincode) AND bsz.is_active = TRUE;
    END IF;

    -- Fallback to city match
    IF v_business_ids IS NULL OR array_length(v_business_ids, 1) IS NULL THEN
        IF NULLIF(TRIM(COALESCE(p_city, '')), '') IS NOT NULL THEN
            SELECT ARRAY_AGG(DISTINCT b.id) INTO v_business_ids
            FROM public.businesses b
            WHERE LOWER(COALESCE(b.city, '')) = LOWER(TRIM(p_city))
              AND b.status = 'active';
        END IF;
    END IF;

    -- If still no businesses, show all active
    IF v_business_ids IS NULL OR array_length(v_business_ids, 1) IS NULL THEN
        SELECT ARRAY_AGG(b.id) INTO v_business_ids
        FROM public.businesses b WHERE b.status = 'active';
    END IF;

    RETURN QUERY
    SELECT l.*
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.business_id = ANY(v_business_ids)
      AND (p_device_type IS NULL OR l.device_type = p_device_type)
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ---- RPC: Get businesses by area ----
CREATE OR REPLACE FUNCTION public.get_businesses_by_area(
    p_pincode TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    name TEXT,
    city TEXT,
    state TEXT,
    short_description TEXT,
    trust_score NUMERIC,
    google_rating NUMERIC,
    logo_url TEXT,
    storefront_address TEXT,
    delivery_options JSONB,
    whatsapp_number TEXT,
    listing_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_ids UUID[];
BEGIN
    -- Collect business IDs that serve this area
    IF NULLIF(TRIM(COALESCE(p_pincode, '')), '') IS NOT NULL THEN
        SELECT ARRAY_AGG(DISTINCT bsz.business_id) INTO v_business_ids
        FROM public.business_service_zones bsz
        JOIN public.businesses b ON b.id = bsz.business_id AND b.status = 'active'
        WHERE bsz.pincode = TRIM(p_pincode) AND bsz.is_active = TRUE;
    END IF;

    IF v_business_ids IS NULL OR array_length(v_business_ids, 1) IS NULL THEN
        IF NULLIF(TRIM(COALESCE(p_city, '')), '') IS NOT NULL THEN
            SELECT ARRAY_AGG(DISTINCT b2.id) INTO v_business_ids
            FROM public.businesses b2
            WHERE LOWER(COALESCE(b2.city, '')) = LOWER(TRIM(p_city))
              AND b2.status = 'active';
        END IF;
    END IF;

    IF v_business_ids IS NULL OR array_length(v_business_ids, 1) IS NULL THEN
        SELECT ARRAY_AGG(b3.id) INTO v_business_ids
        FROM public.businesses b3 WHERE b3.status = 'active';
    END IF;

    RETURN QUERY
    SELECT
        b.id,
        b.slug,
        b.name,
        b.city,
        b.state,
        b.short_description,
        b.trust_score,
        b.google_rating,
        b.logo_url,
        b.storefront_address,
        b.delivery_options,
        b.whatsapp_number,
        (SELECT COUNT(*) FROM public.listings l WHERE l.business_id = b.id AND l.status = 'active') AS listing_count
    FROM public.businesses b
    WHERE b.id = ANY(v_business_ids)
      AND b.status = 'active'
    ORDER BY b.is_featured DESC, b.trust_score DESC
    LIMIT p_limit;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_listings_by_area TO anon;
GRANT EXECUTE ON FUNCTION public.get_listings_by_area TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_businesses_by_area TO anon;
GRANT EXECUTE ON FUNCTION public.get_businesses_by_area TO authenticated;
